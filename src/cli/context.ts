import { Repository } from '../storage/repository.js';

export interface CommandContext {
  repo: Repository;
  json: boolean;
  /** Positional arguments after the command name. */
  positionals: string[];
  /** Parsed flag values. */
  values: Record<string, string | boolean | string[] | undefined>;
  out: (s: string) => void;
}
