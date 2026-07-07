import { describe, it, expect, beforeEach } from 'vitest';
import { makeStorePath, runCli } from '../helpers/tempStore.js';

let store: string;
beforeEach(async () => {
  store = makeStorePath();
  await runCli(['add', 'original', '--priority', 'low', '--tag', 'x'], store);
});

describe('task edit', () => {
  it('changes the title, keeping the id and other fields', async () => {
    const r = await runCli(['edit', '1', '--title', 'renamed', '--json'], store);
    expect(r.code).toBe(0);
    expect(JSON.parse(r.stdout)).toMatchObject({ id: 1, title: 'renamed', priority: 'low', tags: ['x'] });
  });

  it('clears priority and replaces tags', async () => {
    const p = await runCli(['edit', '1', '--clear-priority', '--json'], store);
    expect(JSON.parse(p.stdout).priority).toBeNull();
    const t = await runCli(['edit', '1', '--tag', 'y', '--tag', 'z', '--json'], store);
    expect(JSON.parse(t.stdout).tags).toEqual(['y', 'z']);
    const c = await runCli(['edit', '1', '--clear-tags', '--json'], store);
    expect(JSON.parse(c.stdout).tags).toEqual([]);
  });

  it('rejects an edit with no change flags (exit 1)', async () => {
    const r = await runCli(['edit', '1'], store);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/at least one/i);
  });

  it('rejects an empty title and an invalid priority (exit 1)', async () => {
    expect((await runCli(['edit', '1', '--title', '   '], store)).code).toBe(1);
    expect((await runCli(['edit', '1', '--priority', 'urgent'], store)).code).toBe(1);
  });

  it('unknown id fails with exit 1', async () => {
    const r = await runCli(['edit', '99', '--title', 'x'], store);
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/not found/i);
  });
});
