import { describe, it, expect, beforeEach } from 'vitest';
import { makeStorePath, runCli } from '../helpers/tempStore.js';

let store: string;
beforeEach(async () => {
  store = makeStorePath();
  await runCli(['add', 'task one'], store);
});

describe('task complete / reopen', () => {
  it('completes then re-opens a task', async () => {
    const c = await runCli(['complete', '1'], store);
    expect(c.code).toBe(0);
    const r = await runCli(['reopen', '1'], store);
    expect(r.code).toBe(0);
  });

  it('reports a no-op when already in the target state (exit 0)', async () => {
    await runCli(['complete', '1'], store);
    const again = await runCli(['complete', '1'], store);
    expect(again.code).toBe(0);
    expect(again.stdout).toMatch(/already completed/);
  });

  it('--json returns the updated task object', async () => {
    const c = await runCli(['complete', '1', '--json'], store);
    const task = JSON.parse(c.stdout);
    expect(task).toMatchObject({ id: 1, state: 'completed' });
    expect(task.completedAt).not.toBeNull();
  });

  it('unknown id fails with exit 1 and JSON error under --json', async () => {
    const r = await runCli(['complete', '99'], store);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/not found/i);

    const rj = await runCli(['reopen', '99', '--json'], store);
    expect(rj.code).toBe(1);
    expect(JSON.parse(rj.stderr)).toMatchObject({ error: { code: 'not_found' } });
  });
});
