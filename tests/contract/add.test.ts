import { describe, it, expect, beforeEach } from 'vitest';
import { makeStorePath, runCli } from '../helpers/tempStore.js';

let store: string;
beforeEach(() => {
  store = makeStorePath();
});

describe('task add', () => {
  it('adds a task and reports the new id (exit 0)', async () => {
    const r = await runCli(['add', 'Buy milk'], store);
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/#1/);
  });

  it('accepts priority and repeated tags', async () => {
    const r = await runCli(
      ['add', 'Write', '--priority', 'high', '--tag', 'work', '--tag', 'urgent'],
      store,
    );
    expect(r.code).toBe(0);
  });

  it('--json returns the created task object', async () => {
    const r = await runCli(['add', 'Buy milk', '--priority', 'low', '--tag', 'home', '--json'], store);
    expect(r.code).toBe(0);
    const task = JSON.parse(r.stdout);
    expect(task).toMatchObject({ id: 1, title: 'Buy milk', state: 'pending', priority: 'low', tags: ['home'] });
    expect(task.completedAt).toBeNull();
  });

  it('rejects an empty title (exit 1)', async () => {
    const r = await runCli(['add', '   '], store);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/Error:/);
  });

  it('rejects an invalid priority and lists accepted values (exit 1)', async () => {
    const r = await runCli(['add', 'X', '--priority', 'urgent'], store);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/high, medium, low/);
  });

  it('--json error emits a JSON error object on stderr', async () => {
    const r = await runCli(['add', 'X', '--priority', 'urgent', '--json'], store);
    expect(r.code).toBe(1);
    expect(JSON.parse(r.stderr)).toMatchObject({ error: { code: 'validation' } });
  });
});
