import { parseArgs } from 'node:util';
import { Repository } from '../storage/repository.js';
import { resolveStorePath } from '../storage/paths.js';
import { CliError, ValidationError, StorageError } from '../domain/errors.js';
import { jsonError } from '../output/format.js';
import { CommandContext } from './context.js';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { completeCommand } from './commands/complete.js';
import { reopenCommand } from './commands/reopen.js';
import { editCommand } from './commands/edit.js';
import { removeCommand } from './commands/remove.js';
import { helpCommand, HELP_TEXT } from './commands/help.js';

const options = {
  priority: { type: 'string' },
  tag: { type: 'string', multiple: true },
  state: { type: 'string' },
  all: { type: 'boolean' },
  json: { type: 'boolean' },
  title: { type: 'string' },
  'clear-priority': { type: 'boolean' },
  'clear-tags': { type: 'boolean' },
  help: { type: 'boolean', short: 'h' },
} as const;

export interface RunDeps {
  storePath?: string;
  env?: NodeJS.ProcessEnv;
  out?: (s: string) => void;
  err?: (s: string) => void;
}

function emitError(error: CliError, json: boolean, err: (s: string) => void): number {
  err(json ? `${jsonError(error.code, error.message)}\n` : `Error: ${error.message}\n`);
  return error.exitCode;
}

export async function run(argv: string[], deps: RunDeps = {}): Promise<number> {
  const out = deps.out ?? ((s) => void process.stdout.write(s));
  const err = deps.err ?? ((s) => void process.stderr.write(s));
  const env = deps.env ?? process.env;

  let values: Record<string, string | boolean | string[] | undefined>;
  let positionals: string[];
  try {
    const parsed = parseArgs({ args: argv, options, allowPositionals: true, strict: true });
    values = parsed.values as typeof values;
    positionals = parsed.positionals;
  } catch (e) {
    return emitError(new ValidationError((e as Error).message), false, err);
  }

  const json = values.json === true;
  try {
    const command = positionals[0];
    if (command === undefined || command === 'help' || values.help === true) {
      helpCommand({ out } as CommandContext);
      return 0;
    }

    const repo = new Repository(deps.storePath ?? resolveStorePath(env));
    const ctx: CommandContext = { repo, json, positionals: positionals.slice(1), values, out };

    switch (command) {
      case 'add':
        await addCommand(ctx);
        break;
      case 'list':
        await listCommand(ctx);
        break;
      case 'complete':
        await completeCommand(ctx);
        break;
      case 'reopen':
        await reopenCommand(ctx);
        break;
      case 'edit':
        await editCommand(ctx);
        break;
      case 'remove':
        await removeCommand(ctx);
        break;
      default:
        throw new ValidationError(`Unknown command "${command}". Run "task help" for usage.`);
    }
    return 0;
  } catch (e) {
    const error = e instanceof CliError ? e : new StorageError((e as Error)?.message ?? String(e));
    return emitError(error, json, err);
  }
}

export { HELP_TEXT };
