import { CommandContext } from '../context.js';

export const HELP_TEXT = `task - a simple personal task manager

Usage: task <command> [args] [flags]

Commands:
  add <title> [--priority <p>] [--tag <t> ...]   Add a task (state: pending)
  list [--state <s> | --all] [--priority <p>] [--tag <t> ...]
                                                 List tasks (default: pending only)
  complete <id>                                  Mark a task completed
  reopen <id>                                    Re-open a completed task
  edit <id> [--title <t>] [--priority <p> | --clear-priority]
            [--tag <t> ... | --clear-tags]       Change a task's attributes
  remove <id>                                    Delete a task
  help                                           Show this help

Flags:
  --priority   Task priority: high | medium | low
  --tag        A tag; repeat the flag for multiple tags
  --state      Filter list by state: pending | completed
  --all        Include completed tasks in the list
  --json       Machine-readable JSON output (available on every command)

Store: a per-user JSON file (override with MY_TASK_CLI_STORE).
Exit codes: 0 success, 1 user error, 2 internal error.
`;

export function helpCommand(ctx: CommandContext): void {
  ctx.out(HELP_TEXT);
}
