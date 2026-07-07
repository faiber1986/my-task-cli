import {
  Task,
  TaskSet,
  Priority,
  State,
  requireTitle,
  normalizeTags,
} from './task.js';
import { NotFoundError, ValidationError } from './errors.js';

export interface AddInput {
  title: string;
  priority?: Priority | null;
  tags?: readonly string[];
}

export interface ListFilters {
  state?: State;
  all?: boolean;
  priority?: Priority;
  tags?: readonly string[];
}

export interface EditChanges {
  /** Presence means change. */
  title?: string;
  /** Presence means change; `value` null clears the priority. */
  priority?: { value: Priority | null };
  /** Presence means replace the whole tag set. */
  tags?: readonly string[];
}

function replace<S extends TaskSet>(set: S, updated: Task): S {
  return { ...set, tasks: set.tasks.map((t) => (t.id === updated.id ? updated : t)) };
}

/** Find a task by id, or throw NotFoundError. */
export function find(set: TaskSet, id: number): Task {
  const task = set.tasks.find((t) => t.id === id);
  if (!task) throw new NotFoundError(id);
  return task;
}

/** Create a pending task with the next sequential id. */
export function add<S extends TaskSet>(
  set: S,
  input: AddInput,
  now: () => string = () => new Date().toISOString(),
): { set: S; task: Task } {
  const task: Task = {
    id: set.nextId,
    title: requireTitle(input.title),
    state: 'pending',
    priority: input.priority ?? null,
    tags: normalizeTags(input.tags),
    createdAt: now(),
    completedAt: null,
  };
  return {
    set: { ...set, nextId: set.nextId + 1, tasks: [...set.tasks, task] },
    task,
  };
}

/** List tasks matching ALL supplied filters. Default (no state, no all): pending only. */
export function list(set: TaskSet, filters: ListFilters = {}): Task[] {
  const wantTags = (filters.tags ?? []).map((t) => t.toLowerCase());
  return set.tasks.filter((task) => {
    if (filters.state) {
      if (task.state !== filters.state) return false;
    } else if (!filters.all) {
      if (task.state !== 'pending') return false;
    }
    if (filters.priority && task.priority !== filters.priority) return false;
    if (wantTags.length) {
      const taskTags = task.tags.map((t) => t.toLowerCase());
      if (!wantTags.every((t) => taskTags.includes(t))) return false;
    }
    return true;
  });
}

/** Mark a task completed. No-op (reported) if already completed. */
export function complete<S extends TaskSet>(
  set: S,
  id: number,
  now: () => string = () => new Date().toISOString(),
): { set: S; task: Task; noop: boolean } {
  const task = find(set, id);
  if (task.state === 'completed') return { set, task, noop: true };
  const updated: Task = { ...task, state: 'completed', completedAt: now() };
  return { set: replace(set, updated), task: updated, noop: false };
}

/** Re-open a completed task. No-op (reported) if already pending. */
export function reopen<S extends TaskSet>(
  set: S,
  id: number,
): { set: S; task: Task; noop: boolean } {
  const task = find(set, id);
  if (task.state === 'pending') return { set, task, noop: true };
  const updated: Task = { ...task, state: 'pending', completedAt: null };
  return { set: replace(set, updated), task: updated, noop: false };
}

/** Edit a task's title/priority/tags. Requires at least one change. */
export function edit<S extends TaskSet>(
  set: S,
  id: number,
  changes: EditChanges,
): { set: S; task: Task } {
  const task = find(set, id);
  const hasChange =
    changes.title !== undefined || changes.priority !== undefined || changes.tags !== undefined;
  if (!hasChange) {
    throw new ValidationError(
      'Edit must change at least one attribute (--title, --priority/--clear-priority, --tag/--clear-tags).',
    );
  }
  const updated: Task = {
    ...task,
    title: changes.title !== undefined ? requireTitle(changes.title) : task.title,
    priority: changes.priority !== undefined ? changes.priority.value : task.priority,
    tags: changes.tags !== undefined ? normalizeTags(changes.tags) : task.tags,
  };
  return { set: replace(set, updated), task: updated };
}

/** Remove a task by id. `nextId` is left unchanged so ids are never reused. */
export function remove<S extends TaskSet>(set: S, id: number): { set: S; task: Task } {
  const task = find(set, id);
  return { set: { ...set, tasks: set.tasks.filter((t) => t.id !== id) }, task };
}
