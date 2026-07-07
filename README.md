# my-task-cli

A small, reliable personal task manager for the command line. Add, list, complete, re-open,
edit, and remove tasks with an optional priority and tags. Tasks are stored in a single per-user
JSON file, written atomically so your data is safe.

## Install

```bash
npm install
npm run build      # emits dist/, then the `task` bin is available
```

During development you can run without building:

```bash
npm run dev -- <command> [args]
```

## Usage

```bash
task add <title> [--priority high|medium|low] [--tag <t> ...]
task list [--state pending|completed | --all] [--priority <p>] [--tag <t> ...]
task complete <id>
task reopen <id>
task edit <id> [--title <t>] [--priority <p> | --clear-priority] [--tag <t> ... | --clear-tags]
task remove <id>
task help
```

Every command also accepts `--json` for machine-readable output.

### Examples

```bash
task add "Write the spec" --priority high --tag work
task add "Buy milk" --tag home --tag errand
task list                       # pending tasks only (default)
task complete 1
task list --all                 # include completed tasks
task list --tag home --json     # filtered, machine-readable
task edit 2 --priority medium
task reopen 1
task remove 2
```

## Behavior notes

- **IDs** are sequential integers from a counter that never reuses a number (deleting #2 does not
  free the id 2).
- **`list`** shows only pending tasks by default; use `--all` or `--state completed` to see
  completed ones. Filters combine with AND; tag/priority/state matching is case-insensitive.
- **Storage**: a single per-user file. Default locations:
  - Windows: `%APPDATA%\my-task-cli\tasks.json`
  - macOS: `~/Library/Application Support/my-task-cli/tasks.json`
  - Linux: `$XDG_CONFIG_HOME/my-task-cli/tasks.json` or `~/.config/my-task-cli/tasks.json`
  - Override with the `MY_TASK_CLI_STORE` environment variable.
- **Exit codes**: `0` success · `1` user error (validation, not found) · `2` internal error.

## Development

```bash
npm test           # run the test suite (vitest)
npm run test:watch # watch mode
npm run typecheck  # tsc --noEmit
npm run build      # tsc
```

Requires Node.js 18+.
