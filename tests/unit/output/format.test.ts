import { describe, it, expect } from 'vitest';
import { Task } from '../../../src/domain/task.js';
import {
  taskToJson,
  jsonList,
  jsonRemoved,
  jsonError,
  formatListHuman,
} from '../../../src/output/format.js';

const task: Task = {
  id: 7,
  title: 'Buy milk',
  state: 'pending',
  priority: 'high',
  tags: ['home', 'errand'],
  createdAt: '2026-07-06T12:00:00.000Z',
  completedAt: null,
};

describe('JSON formatters', () => {
  it('taskToJson emits the stable shape', () => {
    expect(taskToJson(task)).toEqual({
      id: 7,
      title: 'Buy milk',
      state: 'pending',
      priority: 'high',
      tags: ['home', 'errand'],
      createdAt: '2026-07-06T12:00:00.000Z',
      completedAt: null,
    });
  });

  it('jsonList returns an array (empty -> [])', () => {
    expect(JSON.parse(jsonList([]))).toEqual([]);
    expect(JSON.parse(jsonList([task]))).toHaveLength(1);
  });

  it('jsonRemoved and jsonError shapes', () => {
    expect(JSON.parse(jsonRemoved(7))).toEqual({ removed: true, id: 7 });
    expect(JSON.parse(jsonError('not_found', 'nope'))).toEqual({
      error: { code: 'not_found', message: 'nope' },
    });
  });
});

describe('human list formatter', () => {
  it('shows an empty message when there are no tasks', () => {
    expect(formatListHuman([], 'No tasks.')).toBe('No tasks.');
  });

  it('includes a header and the task title', () => {
    const out = formatListHuman([task]);
    expect(out).toContain('TITLE');
    expect(out).toContain('Buy milk');
    expect(out).toContain('#7');
  });
});
