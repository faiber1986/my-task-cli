import { describe, it, expect, beforeEach } from 'vitest';
import { makeStorePath, runCli } from '../helpers/tempStore.js';

let store: string;
beforeEach(async () => {
  store = makeStorePath();
  await runCli(['add', 'to remove'], store);
});

describe('task remove', () => {
  it('removes a task and confirms (exit 0)', async () => {
    const r = await runCli(['remove', '1'], store);
    expect(r.code).toBe(0);
    expect((await runCli(['list', '--all', '--json'], store)).stdout).toBe('[]\n');
  });

  it('--json returns { removed: true, id }', async () => {
    const r = await runCli(['remove', '1', '--json'], store);
    expect(JSON.parse(r.stdout)).toEqual({ removed: true, id: 1 });
  });

  it('unknown id fails with exit 1 (JSON error under --json)', async () => {
    const r = await runCli(['remove', '99'], store);
    expect(r.code).toBe(1);
    const rj = await runCli(['remove', '99', '--json'], store);
    expect(JSON.parse(rj.stderr)).toMatchObject({ error: { code: 'not_found' } });
  });
});
