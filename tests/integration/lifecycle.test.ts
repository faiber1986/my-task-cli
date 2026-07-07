import { describe, it, expect, beforeEach } from 'vitest';
import { makeStorePath, runCli } from '../helpers/tempStore.js';

let store: string;
beforeEach(() => {
  store = makeStorePath();
});

describe('full lifecycle persists across separate invocations', () => {
  it('add -> list -> complete -> reopen -> edit -> remove', async () => {
    // Each runCli call is an independent invocation sharing only the on-disk store.
    await runCli(['add', 'Write the spec', '--priority', 'high', '--tag', 'work'], store);
    await runCli(['add', 'Buy milk', '--tag', 'home', '--tag', 'errand'], store);

    // Persisted across a fresh invocation.
    let all = JSON.parse((await runCli(['list', '--all', '--json'], store)).stdout);
    expect(all.map((t: { id: number }) => t.id)).toEqual([1, 2]);

    await runCli(['complete', '1'], store);
    let pending = JSON.parse((await runCli(['list', '--json'], store)).stdout);
    expect(pending.map((t: { id: number }) => t.id)).toEqual([2]);

    await runCli(['reopen', '1'], store);
    pending = JSON.parse((await runCli(['list', '--json'], store)).stdout);
    expect(pending.map((t: { id: number }) => t.id).sort()).toEqual([1, 2]);

    await runCli(['edit', '2', '--priority', 'medium'], store);
    const t2 = JSON.parse((await runCli(['list', '--json'], store)).stdout).find(
      (t: { id: number }) => t.id === 2,
    );
    expect(t2.priority).toBe('medium');

    await runCli(['remove', '2'], store);
    all = JSON.parse((await runCli(['list', '--all', '--json'], store)).stdout);
    expect(all.map((t: { id: number }) => t.id)).toEqual([1]);

    // Removed id is never reused: next add gets #3.
    const added = JSON.parse((await runCli(['add', 'Third', '--json'], store)).stdout);
    expect(added.id).toBe(3);
  });
});

describe('edge cases', () => {
  it('keeps duplicate titles distinct by id', async () => {
    await runCli(['add', 'same'], store);
    await runCli(['add', 'same'], store);
    const all = JSON.parse((await runCli(['list', '--all', '--json'], store)).stdout);
    expect(all).toHaveLength(2);
    expect(all[0].id).not.toBe(all[1].id);
  });

  it('refuses a corrupt store instead of overwriting it', async () => {
    const { writeFileSync, readFileSync } = await import('node:fs');
    writeFileSync(store, '{ not valid json', 'utf8');
    const r = await runCli(['add', 'X'], store);
    expect(r.code).toBe(2);
    expect(r.stderr).toMatch(/not valid JSON/);
    // The corrupt file is left untouched.
    expect(readFileSync(store, 'utf8')).toBe('{ not valid json');
  });

  it('help is shown with no arguments (exit 0)', async () => {
    const r = await runCli([], store);
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/Usage: task/);
  });
});
