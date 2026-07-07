import { describe, it, expect, beforeEach } from 'vitest';
import { makeStorePath, runCli } from '../helpers/tempStore.js';

let store: string;
beforeEach(async () => {
  store = makeStorePath();
});

describe('task list', () => {
  it('shows an empty message on an empty store (exit 0)', async () => {
    const r = await runCli(['list'], store);
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/No tasks/);
  });

  it('lists only pending tasks by default', async () => {
    await runCli(['add', 'alpha'], store);
    await runCli(['add', 'beta'], store);
    await runCli(['complete', '1'], store);
    const r = await runCli(['list'], store);
    expect(r.stdout).toContain('beta');
    expect(r.stdout).not.toContain('alpha');
  });

  it('--json returns an array; empty store -> []', async () => {
    const r = await runCli(['list', '--json'], store);
    expect(JSON.parse(r.stdout)).toEqual([]);

    await runCli(['add', 'one'], store);
    const r2 = await runCli(['list', '--json'], store);
    const arr = JSON.parse(r2.stdout);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr[0]).toMatchObject({ id: 1, title: 'one', state: 'pending' });
  });
});
