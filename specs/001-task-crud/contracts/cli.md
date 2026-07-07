# CLI Contract: `task`

**Feature**: `001-task-crud` | **Date**: 2026-07-06

The `task` binary is the external interface (Constitution Principle I). This contract defines the
command surface, exit codes, and machine-readable output shape. Contract tests in
`tests/contract/` assert against this document.

## Conventions

- Invocation: `task <command> [args] [flags]`.
- Primary results → **stdout**; all errors/diagnostics → **stderr**.
- **`--json` is supported on every command** (Constitution Principle I). By default output is
  human-readable; with `--json` the command emits a single machine-readable JSON value to stdout
  (see "JSON output" below). Errors under `--json` emit a JSON error object to stderr.
- **Exit codes**: `0` success · `1` user error (validation, not found) · `2` internal error
  (I/O failure, corrupt store, lock timeout).
- Priority values: `high | medium | low` (case-insensitive input). State values:
  `pending | completed` (case-insensitive input). Tags: case-insensitive exact match on filter.
- Store path override for tests/power users: environment variable `MY_TASK_CLI_STORE`.

## Commands

### `task add <title> [--priority <p>] [--tag <t> ...] [--json]`

- Creates a pending task. `--tag` is repeatable. `--priority` optional (default: none).
- **Success (exit 0)**: default prints confirmation including the new numeric id, e.g.
  `Added task #7: "Buy milk"`. With `--json`, prints the created task object.
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

### `task complete <id> [--json]`

- Sets a task to `completed`. Already completed → exit 0 with an "already completed" notice.
- **Success (exit 0)**: default prints a confirmation; with `--json`, prints the updated task object.
- **Errors**: unknown id → exit 1 (`Task #<id> not found`).

### `task reopen <id> [--json]`

- Sets a completed task back to `pending`. Already pending → exit 0 with an "already pending" notice.
- **Success (exit 0)**: default prints a confirmation; with `--json`, prints the updated task object.
- **Errors**: unknown id → exit 1.

### `task edit <id> [--title <t>] [--priority <p> | --clear-priority] [--tag <t> ... | --clear-tags] [--json]`

- Updates only the supplied fields; id and unspecified fields unchanged. At least one change flag
  required. `--clear-priority` sets priority to none; `--tag` (repeatable) replaces the full tag set;
  `--clear-tags` empties tags.
- **Success (exit 0)**: default prints confirmation of the updated task; with `--json`, prints the
  updated task object.
- **Errors**: unknown id → exit 1; empty title → exit 1; invalid priority → exit 1; no change flags
  provided → exit 1.

### `task remove <id> [--json]`

- Permanently deletes one task by id (single-target; no bulk/wildcard — Principle III).
- **Success (exit 0)**: default prints confirmation; with `--json`, prints
  `{ "removed": true, "id": <id> }`.
- **Errors**: unknown id → exit 1.

### `task help` / `task --help` / no args

- Prints usage for all commands to stdout, exit 0.

## JSON output

`--json` is available on every command. The shapes below are stable; adding a field is a MINOR
change, removing/renaming is MAJOR (Principle V) and must update this contract.

### Task object (shared building block)

```json
{
  "id": 7,
  "title": "Buy milk",
  "state": "pending",
  "priority": "high",
  "tags": ["home", "errand"],
  "createdAt": "2026-07-06T12:00:00.000Z",
  "completedAt": null
}
```

- `priority` is one of `"high" | "medium" | "low" | null`.
- `state` is `"pending" | "completed"`.
- `completedAt` is an ISO-8601 string when completed, otherwise `null`.

### Per-command `--json` result

- `list --json` → a JSON **array** of task objects (empty result → `[]`).
- `add`, `complete`, `reopen`, `edit` `--json` → the single affected **task object** (as above).
- `remove --json` → `{ "removed": true, "id": <id> }`.
- No-op notices (e.g. completing an already-completed task) still return the task object with a
  `0` exit code.

## Error output shape

- Human errors (default): a single line to stderr beginning with `Error:` and a corrective hint
  where useful.
- Under `--json`, errors emit a JSON object to **stderr**:
  `{ "error": { "code": "validation" | "not_found" | "internal", "message": "<text>" } }`,
  with the same exit code as the human path (1 for user errors, 2 for internal).
- No stack traces reach the user under normal operation (Principle I).
