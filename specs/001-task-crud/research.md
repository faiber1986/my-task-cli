# Research: Task Management CLI

**Feature**: `001-task-crud` | **Date**: 2026-07-06

All decisions favor zero new runtime dependencies (Constitution Principle IV) and reliable
persistence (Principle III). No `NEEDS CLARIFICATION` items remain from the spec; the items below
record the technical choices behind the plan.

## 1. CLI argument parsing

- **Decision**: Use Node's built-in `node:util.parseArgs` for flags/positionals; implement a thin
  router that maps the first positional (`add`, `list`, `complete`, `reopen`, `edit`, `remove`,
  `help`) to a handler.
- **Rationale**: Built-in since Node 18, no dependency, covers `--flag`, `--flag value`, repeated
  flags (for multiple `--tag`), and positionals. Satisfies YAGNI and minimal-deps constraint.
- **Alternatives considered**: `commander`/`yargs` (richer help/subcommands but add a dependency and
  more surface than six commands need); hand-rolled `process.argv` parsing (more error-prone for
  repeated/optional flags).

## 2. Per-user store location

- **Decision**: Resolve an OS-appropriate user-config directory manually in `storage/paths.ts`:
  Windows → `%APPDATA%`; macOS → `~/Library/Application Support`; Linux/other → `$XDG_CONFIG_HOME`
  or `~/.config`. Store file at `<configDir>/my-task-cli/tasks.json`. Allow an environment override
  (e.g. `MY_TASK_CLI_STORE`) so tests and power users can redirect the store.
- **Rationale**: Matches the clarified "single per-user store, shared across working directories".
  Manual resolution avoids a dependency (e.g. `env-paths`). The env override makes integration tests
  hermetic (each test points at a temp file) without touching the real store.
- **Alternatives considered**: `env-paths` package (adds a dependency for a few lines of logic);
  storing in `~/.my-task-cli` (simpler but ignores platform conventions); per-directory file
  (rejected by clarification).

## 3. Atomic writes + concurrency safety

- **Decision**: On save, serialize the whole store, write to a temp file in the same directory, then
  `fs.rename` over the target (atomic on the same filesystem). Guard read-modify-write cycles with an
  exclusive lock file created via `fs.open(..., 'wx')`; on contention, retry with short backoff and a
  bounded timeout, then fail clearly. Always release the lock in a `finally`.
- **Rationale**: Principle III requires no corruption on interrupted or overlapping writes. Temp+rename
  guarantees readers never see a partial file; the exclusive lock serializes concurrent invocations so
  one run's update cannot clobber another's. Both use only `node:fs`.
- **Alternatives considered**: `proper-lockfile` (robust but a dependency); writing in place (risks
  partial/corrupt file on crash); no lock (two overlapping runs could lose one run's change — violates
  Principle III).

## 4. Sequential, non-reusing identifiers

- **Decision**: Persist a `nextId` counter in the store. `add` assigns `nextId` to the new task and
  increments it; removing a task never decrements or reuses. IDs are positive integers displayed as-is.
- **Rationale**: Implements the clarification directly; keeps IDs short and typeable; guarantees an ID
  never refers to two different tasks over time (Principle V stability of references).
- **Alternatives considered**: `max(existing ids)+1` (would reuse an id after deleting the highest —
  violates non-reuse); random short ids via `nanoid` (rejected by clarification; also an unused dep).

## 5. On-disk schema + migration path

- **Decision**: Store shape `{ "version": 1, "nextId": <int>, "tasks": [ ... ] }`. `repository.load()`
  reads `version` and runs an ordered migration registry to upgrade older shapes to the current one
  before returning; unknown/newer versions fail clearly rather than guessing. A missing file is treated
  as an empty store `{version:1, nextId:1, tasks:[]}` (first-run behavior).
- **Rationale**: Principle III (versioned, recoverable data) and Principle V (newer binary always reads
  older data via migration). JSON keeps the file human-inspectable.
- **Alternatives considered**: Unversioned array of tasks (no safe evolution path); SQLite (overkill for
  a personal tool, adds a dependency and binary format).

## 6. Corrupt / unreadable store handling

- **Decision**: If the file exists but is not valid JSON or fails schema validation, the tool reports a
  clear error naming the store path and refuses to overwrite it (non-zero exit). It never silently
  resets to an empty store.
- **Rationale**: Principle III forbids silent data loss; surfacing the problem lets the user recover
  (inspect/fix/restore) before any write.
- **Alternatives considered**: Auto-reinitialize on parse error (silent data loss — rejected); attempt
  partial recovery (out of scope, risky).

## 7. Tag & filter matching semantics (resolves the deferred clarification)

- **Decision**: Tags are stored trimmed and de-duplicated per task, preserving the case the user typed.
  Tag matching for filtering is **case-insensitive** and exact (no substring), so `--tag Work` matches a
  task tagged `work`. Empty/whitespace-only tags are ignored. Priority and state filter values are
  likewise matched case-insensitively against the fixed vocabularies.
- **Rationale**: Case-insensitive filtering is the least surprising for a personal tool typed by hand,
  and prevents duplicate-looking tags from fragmenting filters. Exact (not substring) keeps filters
  predictable and testable. This closes the item deferred during `/speckit.clarify`.
- **Alternatives considered**: Case-sensitive tags (surprising: `Work` ≠ `work`); substring matching
  (ambiguous, harder to assert in tests).

## 8. Output formats

- **Decision**: Default output is human-readable (aligned columns for `list`; concise confirmations for
  mutations). **`--json` is supported on every command** (Constitution Principle I): `list --json`
  emits a JSON array of task objects; `add`/`complete`/`reopen`/`edit --json` emit the affected task
  object; `remove --json` emits `{ "removed": true, "id": <id> }`. Errors under `--json` emit
  `{ "error": { "code", "message" } }` to stderr. All diagnostics/errors go to stderr. Exit codes:
  `0` success; `1` user error (validation, not-found); `2` internal error (I/O, corrupt store, lock
  timeout). A shared `--json` handling helper keeps this uniform across commands.
- **Rationale**: Principle I mandates that every command support human-readable output by default and
  machine-readable output via `--json` so the tool composes in scripts and pipelines. A single shared
  serializer keeps the surface small (Principle IV) while satisfying the MUST.
- **Alternatives considered**: `--json` only on `list` (rejected — conflicts with Principle I's
  "every command MUST support `--json`"; flagged CRITICAL by `/speckit.analyze`); JSON-only output
  (worse day-to-day UX).
