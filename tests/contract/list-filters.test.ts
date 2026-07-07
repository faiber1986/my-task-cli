import { describe, it, expect, beforeEach } from 'vitest';
import { makeStorePath, runCli } from '../helpers/tempStore.js';

let store: string;
beforeEach(async () => {
  store = makeStorePath();
  await runCli(['add', 'a', '--priority', 'high', '--tag', 'work'], store); // #1 pending
  await runCli(['add', 'b', '--priority', 'low', '--tag', 'home'], store); // #2 pending
  await runCli(['add', 'c', '--priority', 'high', '--tag', 'work'], store); // #3 -> completed
  await runCli(['complete', '3'], store);
});

const ids = (json: string): number[] => JSON.parse(json).map((t: { id: number }) => t.id);

describe('task list filters', () => {
  it('filters by state', async () => {
    expect(ids((await runCli(['list', '--state', 'completed', '--json'], store)).stdout)).toEqual([3]);
    expect(ids((await runCli(['list', '--state', 'pending', '--json'], store)).stdout)).toEqual([1, 2]);
  });

  it('--all includes completed', async () => {
    expect(ids((await runCli(['list', '--all', '--json'], store)).stdout)).toEqual([1, 2, 3]);
  });

  it('filters by priority and by tag (case-insensitive)', async () => {
    expect(ids((await runCli(['list', '--priority', 'high', '--json'], store)).stdout)).toEqual([1]);
    expect(ids((await runCli(['list', '--tag', 'WORK', '--json'], store)).stdout)).toEqual([1]);
  });

  it('combines filters with AND semantics', async () => {
    const r = await runCli(['list', '--all', '--priority', 'high', '--tag', 'work', '--json'], store);
    expect(ids(r.stdout)).toEqual([1, 3]);
  });

  it('reports a clear empty result (exit 0) for a non-matching filter', async () => {
    const r = await runCli(['list', '--tag', 'nope'], store);
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/No matching tasks/);
  });

  it('rejects an invalid state value (exit 1)', async () => {
    const r = await runCli(['list', '--state', 'archived'], store);
    expect(r.code).toBe(1);
  });
});
