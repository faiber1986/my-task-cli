import { describe, it, expect } from 'vitest';
import { TaskSet } from '../../../src/domain/task.js';
import {
  add,
  find,
  list,
  complete,
  reopen,
  edit,
  remove,
} from '../../../src/domain/taskCollection.js';
import { NotFoundError, ValidationError } from '../../../src/domain/errors.js';

const fixedNow = () => '2026-07-06T12:00:00.000Z';
const empty = (): TaskSet => ({ nextId: 1, tasks: [] });

describe('add', () => {
  it('assigns sequential ids and pending defaults', () => {
    let set = empty();
    let r = add(set, { title: 'A' }, fixedNow);
    expect(r.task).toMatchObject({ id: 1, state: 'pending', priority: null, tags: [] });
    set = r.set;
    r = add(set, { title: 'B', priority: 'high', tags: ['work', 'work'] }, fixedNow);
    expect(r.task).toMatchObject({ id: 2, priority: 'high', tags: ['work'] });
    expect(r.set.nextId).toBe(3);
  });
});

describe('find', () => {
  it('returns a task or throws NotFoundError', () => {
    const { set } = add(empty(), { title: 'A' }, fixedNow);
    expect(find(set, 1).title).toBe('A');
    expect(() => find(set, 99)).toThrow(NotFoundError);
  });
});

describe('list', () => {
  const build = (): TaskSet => {
    let set = empty();
    set = add(set, { title: 'p-high', priority: 'high', tags: ['work'] }, fixedNow).set;
    set = add(set, { title: 'p-low', priority: 'low', tags: ['home'] }, fixedNow).set;
    set = add(set, { title: 'done', priority: 'high', tags: ['work'] }, fixedNow).set;
    set = complete(set, 3, fixedNow).set;
    return set;
  };

  it('defaults to pending only', () => {
    expect(list(build()).map((t) => t.id)).toEqual([1, 2]);
  });

  it('--all includes completed', () => {
    expect(list(build(), { all: true }).map((t) => t.id)).toEqual([1, 2, 3]);
  });

  it('filters by state, priority, and tag (case-insensitive, AND)', () => {
    const set = build();
    expect(list(set, { state: 'completed' }).map((t) => t.id)).toEqual([3]);
    expect(list(set, { priority: 'high' }).map((t) => t.id)).toEqual([1]);
    expect(list(set, { tags: ['WORK'] }).map((t) => t.id)).toEqual([1]);
    expect(list(set, { all: true, priority: 'high', tags: ['work'] }).map((t) => t.id)).toEqual([
      1, 3,
    ]);
  });

  it('returns [] for a non-matching filter', () => {
    expect(list(build(), { tags: ['nope'] })).toEqual([]);
  });
});

describe('complete / reopen', () => {
  it('completes then re-opens, toggling completedAt', () => {
    const { set: s0 } = add(empty(), { title: 'A' }, fixedNow);
    const c = complete(s0, 1, fixedNow);
    expect(c.task.state).toBe('completed');
    expect(c.task.completedAt).toBe(fixedNow());
    expect(c.noop).toBe(false);

    const again = complete(c.set, 1, fixedNow);
    expect(again.noop).toBe(true);

    const r = reopen(c.set, 1);
    expect(r.task.state).toBe('pending');
    expect(r.task.completedAt).toBeNull();
    expect(reopen(r.set, 1).noop).toBe(true);
  });

  it('throws NotFoundError for unknown id', () => {
    expect(() => complete(empty(), 5, fixedNow)).toThrow(NotFoundError);
  });
});

describe('edit', () => {
  const seed = () => add(empty(), { title: 'A', priority: 'low', tags: ['x'] }, fixedNow).set;

  it('updates only supplied fields, keeps id', () => {
    const set = seed();
    const t = edit(set, 1, { title: 'B' }).task;
    expect(t).toMatchObject({ id: 1, title: 'B', priority: 'low', tags: ['x'] });
  });

  it('clears priority and replaces tags', () => {
    const set = seed();
    const t1 = edit(set, 1, { priority: { value: null } }).task;
    expect(t1.priority).toBeNull();
    const t2 = edit(set, 1, { tags: ['y', 'z'] }).task;
    expect(t2.tags).toEqual(['y', 'z']);
  });

  it('rejects an edit with no changes and an empty title', () => {
    const set = seed();
    expect(() => edit(set, 1, {})).toThrow(ValidationError);
    expect(() => edit(set, 1, { title: '   ' })).toThrow(ValidationError);
  });
});

describe('remove', () => {
  it('removes a task without reusing its id', () => {
    let set = empty();
    set = add(set, { title: 'A' }, fixedNow).set;
    set = add(set, { title: 'B' }, fixedNow).set;
    set = remove(set, 1).set;
    expect(set.tasks.map((t) => t.id)).toEqual([2]);
    expect(set.nextId).toBe(3);
    const added = add(set, { title: 'C' }, fixedNow);
    expect(added.task.id).toBe(3);
  });

  it('throws NotFoundError for unknown id', () => {
    expect(() => remove(empty(), 1)).toThrow(NotFoundError);
  });
});
