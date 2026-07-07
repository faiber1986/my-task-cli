# Quickstart: Task Management CLI

**Feature**: `001-task-crud` | **Date**: 2026-07-06

## Prerequisites

- Node.js 18+ and npm.
- Repository dependencies installed: `npm install`.

## Develop

- Run without building (dev): `npm run dev -- <command> [args]`
  - e.g. `npm run dev -- add "Buy milk" --priority high --tag home`
- Build: `npm run build` (emits `dist/`, must type-check cleanly under strict mode).
- After building, the linked binary is `task` (from `package.json` `bin`): `task list`.

## Test (test-first — Constitution Principle II)

- Run all tests: `npm test`
- Watch mode: `npm run test:watch`
- Tests must be written before implementation and pass before a change is complete.
- Integration/contract tests point the store at a temp file via `MY_TASK_CLI_STORE` so they never
  touch the real per-user store.

## Try the full lifecycle

```bash
# Redirect the store to a scratch file for a safe trial run
export MY_TASK_CLI_STORE="$(mktemp -d)/tasks.json"    # PowerShell: $env:MY_TASK_CLI_STORE = "$env:TEMP\tasks.json"

npm run dev -- add "Write the spec" --priority high --tag work
npm run dev -- add "Buy milk" --tag home --tag errand
npm run dev -- list                      # pending only, default view
npm run dev -- complete 1
npm run dev -- list --all                # includes the completed task
npm run dev -- list --tag home --json    # machine-readable, filtered
npm run dev -- edit 2 --priority medium
npm run dev -- reopen 1
npm run dev -- remove 2
```

## Verify (per /verify skill expectations)

- Drive the real CLI end-to-end (as above) against a temp store and confirm:
  - Added tasks get sequential ids and persist across separate invocations.
  - Default `list` shows only pending; `--all` and filters behave per `contracts/cli.md`.
  - Unknown id on complete/reopen/edit/remove fails with exit code 1 and changes nothing.
  - `list --json` emits the documented JSON shape.

## Store location (real use)

- Windows: `%APPDATA%\my-task-cli\tasks.json`
- macOS: `~/Library/Application Support/my-task-cli/tasks.json`
- Linux: `$XDG_CONFIG_HOME/my-task-cli/tasks.json` or `~/.config/my-task-cli/tasks.json`
- Override anywhere with `MY_TASK_CLI_STORE`.
