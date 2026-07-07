import { describe, it, expect } from 'vitest';
import { resolveStorePath } from '../../../src/storage/paths.js';

describe('resolveStorePath', () => {
  it('uses MY_TASK_CLI_STORE override when set', () => {
    expect(resolveStorePath({ MY_TASK_CLI_STORE: '/tmp/custom/tasks.json' })).toBe(
      '/tmp/custom/tasks.json',
    );
  });

  it('ignores an empty override', () => {
    const p = resolveStorePath({ MY_TASK_CLI_STORE: '   ' });
    expect(p).not.toBe('   ');
    expect(p).toContain('my-task-cli');
  });

  it('falls back to a per-user config path containing my-task-cli/tasks.json', () => {
    const p = resolveStorePath({});
    expect(p).toContain('my-task-cli');
    expect(p.endsWith('tasks.json')).toBe(true);
  });
});
