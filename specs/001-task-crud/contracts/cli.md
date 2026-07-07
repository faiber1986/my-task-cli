# CLI Contract: `task`

**Feature**: `001-task-crud` | **Date**: 2026-07-06

The `task` binary is the external interface (Constitution Principle I). This contract defines the
command surface, exit codes, and machine-readable output shape. Contract tests in
`tests/contract/` assert against this document.

## Conventions

- Invocation: `task <command> [args] [flags]`.
- Primary results → **stdout**; all errors/diagnostics → **stderr**.
- **Exit codes**: `0` success · `1` user error (validation, not found) · `2` internal error
  (I/O failure, corrupt store, lock timeout).
- Priority values: `high | medium | low` (case-insensitive input). State values:
  `pending | completed` (case-insensitive input). Tags: case-insensitive exact match on filter.
- Store path override for tests/power users: environment variable `MY_TASK_CLI_STORE`.

## Commands

### `task add <title> [--priority <p>] [--tag <t> ...]`

- Creates a pending task. `--tag` is repeatable. `--priority` optional (default: none).
- **Success (exit 0)**: prints confirmation including the new numeric id, e.g.
  `Added task #7: "Buy milk"`.
- **Errors**: empty/whitespace title → exit 1; invalid `--priority` value → exit 1 with accepted
  values listed.

### `task list [--state <s> | --all] [--priority <p>] [--tag <t> ...] [--json]`

- Lists tasks matching ALL supplied filters. Default (no `--state`, no `--all`): pending only.
- `--all` includes completed and pending. `--tag` repeatable (task must have every requested tag).
- **Success (exit 0)**:
  - Human (default): aligned table with columns `id`, `state`, `priority`, `tags`, `title`.
    Empty result prints a clear "no tasks" / "no matching tasks" line (still exit 0).
  - `--json`: a JSON array to stdout (see schema below). Empty result → `[]`.
- **Errors**: invalid `--state`/`--priority` value → exit 1.

### `task complete <id>`

- Sets a task to `completed`. Already completed → exit 0 with an "already completed" notice.
- **Errors**: unknown id → exit 1 (`Task #<id> not found`).

### `task reopen <id>`

- Sets a completed task back to `pending`. Already pending → exit 0 with an "already pending" notice.
- **Errors**: unknown id → exit 1.

### `task edit <id> [--title <t>] [--priority <p> | --clear-priority] [--tag <t> ... | --clear-tags]`

- Updates only the supplied fields; id and unspecified fields unchanged. At least one change flag
  required. `--clear-priority` sets priority to none; `--tag` (repeatable) replaces the full tag set;
  `--clear-tags` empties tags.
- **Success (exit 0)**: prints confirmation of the updated task.
- **Errors**: unknown id → exit 1; empty title → exit 1; invalid priority → exit 1; no change flags
  provided → exit 1.

### `task remove <id>`

- Permanently deletes one task by id (single-target; no bulk/wildcard — Principle III).
- **Success (exit 0)**: prints confirmation.
- **Errors**: unknown id → exit 1.

### `task help` / `task --help` / no args

- Prints usage for all commands to stdout, exit 0.

## JSON output schema (`list --json`)

```json
[
  {
    "id": 7,
    "title": "Buy milk",
    "state": "pending",
    "priority": "high",
    "tags": ["home", "errand"],
    "createdAt": "2026-07-06T12:00:00.000Z",
    "completedAt": null
  }
]
```

- `priority` is one of `"high" | "medium" | "low" | null`.
- `state` is `"pending" | "completed"`.
- `completedAt` is an ISO-8601 string when completed, otherwise `null`.
- Field names and types are stable; adding a field is a MINOR change, removing/renaming is MAJOR
  (Principle V) and must update this contract.

## Error output shape

- Human errors: a single line to stderr beginning with `Error:` and a corrective hint where useful.
- No stack traces reach the user under normal operation (Principle I).
