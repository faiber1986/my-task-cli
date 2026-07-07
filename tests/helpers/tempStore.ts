import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../../src/cli/router.js';

/** Create a unique temp store path (parent dir exists; file does not yet). */
export function makeStorePath(): string {
  const dir = mkdtempSync(join(tmpdir(), 'mytask-'));
  return join(dir, 'tasks.json');
}

export interface CliResult {
  code: number;
  stdout: string;
  stderr: string;
}

/** Invoke the CLI in-process against a specific store, capturing output. */
export async function runCli(args: string[], storePath: string): Promise<CliResult> {
  let stdout = '';
  let stderr = '';
  const code = await run(args, {
    storePath,
    env: {},
    out: (s) => {
      stdout += s;
    },
    err: (s) => {
      stderr += s;
    },
  });
  return { code, stdout, stderr };
}
