# Implementation Plan: Task Management CLI (CRUD + priorities & tags)

**Branch**: `001-task-crud` | **Date**: 2026-07-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-task-crud/spec.md`

## Summary

Deliver the `task` CLI so a single user can add, list (with filters), complete, re-open, edit,
and remove tasks that carry an optional priority (high/medium/low) and free-form tags. Each task
gets a sequential, non-reusing numeric identifier. Tasks persist in one per-user JSON store in the
OS user-config location, written atomically and guarded against overlapping invocations. The
implementation is a single TypeScript project layered as pure domain logic → storage → CLI/output,
built with `tsc`, run via `tsx`, and driven test-first with vitest.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 18+ (ES2022 target, NodeNext modules, strict)
**Primary Dependencies**: None new at runtime — CLI argument parsing via Node built-in
`node:util.parseArgs`; persistence via `node:fs`/`node:path`/`node:os`. Dev/tooling already present:
`tsx` (dev run), `tsc` (build), `vitest` (tests).
**Storage**: Single JSON file in the per-user OS config directory (e.g. `%APPDATA%` on Windows,
`$XDG_CONFIG_HOME` or `~/.config` on Linux, `~/Library/Application Support` on macOS), written
atomically (temp file + rename) with an exclusive lock file for overlapping invocations. Schema
carries a `version` field to enable forward migrations.
**Testing**: vitest (`npm test`), test-first per constitution — unit (domain, validation, storage,
formatting), integration (end-to-end CLI runs against a temp store via env override), contract
(CLI command surface: args, exit codes, JSON output shape).
**Target Platform**: Cross-platform CLI (Windows, macOS, Linux) run from a terminal.
**Project Type**: Single-project CLI (binary `task` → `dist/index.js`).
**Performance Goals**: Interactive CLI; every command completes well under 200 ms for a personal
store (hundreds–low thousands of tasks). No throughput targets.
**Constraints**: Offline, local-only, single user; no data loss or corruption on write, including
interrupted or overlapping invocations; minimal runtime dependencies (YAGNI).
**Scale/Scope**: Personal use — expected up to a few thousand tasks in one store; six commands
(add, list, complete, reopen, edit, remove) plus help.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution v1.0.0 — evaluated per principle:

- **I. CLI-First Experience** — PASS. Design routes primary output to stdout and errors to stderr,
  provides `--json` on **every** command (list → array; add/complete/reopen/edit → task object;
  remove → `{removed,id}`; errors → JSON error object on stderr), defines distinct exit codes
  (0 success, 1 user error, 2 internal error), and mandates actionable error messages (no raw stack
  traces). A shared JSON serializer keeps the surface uniform and small.
- **II. Test-First (NON-NEGOTIABLE)** — PASS (enforced in Phase 2 tasks). Every unit of domain
  logic and every command ships with vitest tests written first (Red → Green → Refactor). Contract
  and integration tests are generated before the corresponding implementation tasks.
- **III. Reliable Persistence** — PASS. Writes are atomic (temp + rename); the store is JSON with a
  `version` marker and a migration path; an exclusive lock file prevents corruption from overlapping
  runs; `remove` is explicit and single-target (no accidental bulk deletion).
- **IV. Simplicity & YAGNI** — PASS. Single project, layered but flat; zero new runtime dependencies
  (Node built-ins only); no speculative abstraction, plugins, or config beyond what the spec needs.
- **V. Stability & Compatibility** — PASS. SemVer for the tool; on-disk `version` field guarantees a
  newer binary reads older data via migration; CLI command/flag/output contracts are captured in
  `contracts/` so changes are visible and versioned.

**Technology & Quality Constraints** — PASS. TypeScript strict mode (already configured), `tsc`
must type-check cleanly, `vitest` must be green, dependencies stay minimal and lockfile-pinned.

No violations. Complexity Tracking left empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-task-crud/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── cli.md           # CLI command contract (args, exit codes, JSON shape)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created here)
```

### Source Code (repository root)

```text
src/
├── index.ts             # Executable entry (bin: task); wires argv → router → process exit code
├── cli/
│   ├── router.ts        # Parse argv (node:util.parseArgs), dispatch to a command handler
│   ├── args.ts          # Shared flag parsing/validation helpers (priority, tags, filters)
│   └── commands/
│       ├── add.ts
│       ├── list.ts
│       ├── complete.ts
│       ├── reopen.ts
│       ├── edit.ts
│       └── remove.ts
├── domain/
│   ├── task.ts          # Task type, Priority, State; pure validation (title, priority, tags)
│   ├── taskCollection.ts# Pure operations over a task set (add/find/update/complete/remove/filter)
│   └── errors.ts        # Typed domain errors (ValidationError, NotFoundError) → exit-code mapping
├── storage/
│   ├── paths.ts         # Resolve per-user config file path (OS-aware; env override for tests)
│   ├── schema.ts        # On-disk schema {version, nextId, tasks[]} + migration registry
│   └── repository.ts    # load() + save() with atomic write (temp+rename) and exclusive lock
└── output/
    └── format.ts        # Human-readable and --json renderers for tasks and results

tests/
├── unit/                # domain (task/validation/collection), storage (paths/schema/atomicity), format
├── integration/         # end-to-end CLI runs against a temp store (via env-overridden path)
└── contract/            # CLI surface: accepted args, exit codes, JSON output shape per contracts/cli.md
```

**Structure Decision**: Single-project CLI (Option 1). Layers are ordered by dependency direction
`domain` ← `storage` ← `cli`/`output`, with `domain` kept pure (no I/O) so it is fully unit-testable
and satisfies TDD cheaply. Storage is isolated behind `repository.ts` so atomicity, locking, and
migrations are testable in one place. This matches the existing scaffold (`src/` → `dist/`, bin
`task`) and honors Principle IV (simplicity) by avoiding extra packages or a service framework.

## Complexity Tracking

> No constitution violations. Section intentionally empty.
