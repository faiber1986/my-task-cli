<!--
Sync Impact Report
==================
Version change: (unversioned template) → 1.0.0
Bump rationale: Initial ratification of the project constitution (MAJOR baseline).

Modified principles: N/A (first adoption)
Added principles:
  - I. CLI-First Experience
  - II. Test-First (NON-NEGOTIABLE)
  - III. Reliable Persistence
  - IV. Simplicity & YAGNI
  - V. Stability & Compatibility
Added sections:
  - Technology & Quality Constraints
  - Development Workflow & Quality Gates
  - Governance

Templates reviewed for consistency:
  - .specify/templates/plan-template.md ✅ (Constitution Check gate is generic; reads this file at plan time)
  - .specify/templates/spec-template.md ✅ (no principle-specific references; no change needed)
  - .specify/templates/tasks-template.md ✅ (task categories cover tests/persistence/CLI; no change needed)
  - .specify/templates/commands/*.md ✅ (no outdated agent-specific references requiring update)

Deferred TODOs: none
-->

# my-task-cli Constitution

## Core Principles

### I. CLI-First Experience

The `task` binary is the product; its command-line interface is the primary contract with
the user and MUST be treated as such.

- Every feature is invoked through a clear, discoverable subcommand of `task`.
- Input arrives via arguments, flags, or stdin; primary output goes to stdout and all
  diagnostics/errors go to stderr.
- Every command MUST support human-readable output by default and machine-readable output
  via a `--json` flag, so the tool composes in scripts and pipelines.
- Exit codes MUST be meaningful: `0` on success, non-zero on failure, with distinct codes
  for user errors versus internal errors.
- Error messages MUST tell the user what went wrong and how to fix it; no bare stack traces
  reach the user in normal operation.

**Rationale**: This is a real tool meant for daily use. Predictable, scriptable, well-labeled
CLI behavior is what makes it trustworthy and pleasant, and it keeps the surface testable.

### II. Test-First (NON-NEGOTIABLE)

Test-Driven Development is mandatory for all production code.

- The cycle is strict: write the test → watch it fail (Red) → implement the minimum to pass
  (Green) → Refactor. No production code is written before a failing test justifies it.
- Every command and every unit of core logic ships with tests written first, run via
  `npm test` (vitest).
- A change MUST NOT be considered complete while any test is failing or missing for the
  behavior it introduces or modifies.
- Bug fixes begin with a failing regression test that reproduces the bug.

**Rationale**: TDD is the discipline this project is committed to. It keeps the CLI's behavior
specified, prevents regressions in a tool holding real user data, and forces small, verifiable
increments.

### III. Reliable Persistence

User task data is precious and MUST never be silently lost or corrupted.

- Writes to the task store MUST be atomic: write to a temporary file and rename into place,
  never partially overwrite the live data file.
- The data format MUST be readable and recoverable (human-inspectable, e.g. JSON) and carry a
  schema/version marker.
- Any change to the on-disk format MUST ship with a forward migration that upgrades existing
  data automatically and preserves every prior task.
- Destructive operations MUST be explicit; irreversible bulk actions require confirmation or
  an explicit `--force`/`--yes` flag.

**Rationale**: A task tool that loses or mangles data is worse than no tool. Atomicity,
versioned data, and migrations make trusting it with real work safe.

### IV. Simplicity & YAGNI

Build the smallest thing that satisfies the current, real need.

- Prefer standard library and already-present dependencies over new ones; each new dependency
  MUST justify its weight.
- Do not add abstraction, configuration, or extensibility for hypothetical futures. Add it
  when a concrete requirement demands it.
- Features are driven by actual use of the tool, not by speculation.

**Rationale**: This is a personal tool maintained by one person. Complexity is the main long-term
cost; keeping the design small keeps it maintainable and enjoyable.

### V. Stability & Compatibility

Existing users of the tool (including future-you) MUST not be surprised by breakage.

- The project follows Semantic Versioning (MAJOR.MINOR.PATCH).
- Removing or changing the meaning of a command, flag, or output contract is a MAJOR change and
  MUST be documented.
- On-disk data changes MUST remain backward-compatible via migration (see Principle III); a
  newer binary always reads data written by an older one.
- Breaking changes MUST be recorded in a changelog entry with the migration/upgrade path.

**Rationale**: Because the tool is used daily and owns persistent state, predictable evolution
matters more than moving fast. Explicit versioning makes upgrades safe.

## Technology & Quality Constraints

- Language & runtime: TypeScript compiled with `tsc`, run on Node.js; `tsx` for local dev.
- The TypeScript compiler MUST run in strict mode; the build (`npm run build`) MUST pass with
  no type errors before a change is complete.
- Testing framework is vitest; `npm test` MUST pass before any change is considered done.
- No linter/formatter errors are introduced; code matches the style of surrounding code.
- Dependencies are kept minimal (see Principle IV) and pinned via the lockfile.

## Development Workflow & Quality Gates

- Work follows the Spec-Driven Development flow provided by spec-kit:
  `/speckit.specify` → `/speckit.plan` → `/speckit.tasks` → `/speckit.implement`.
- Before implementation, the plan MUST pass the Constitution Check gate; any violation is either
  removed or explicitly justified in the plan's Complexity Tracking section.
- Definition of Done for any change:
  1. A failing test was written first and now passes (Principle II).
  2. `npm test` is green and `npm run build` type-checks cleanly.
  3. Data-format changes include a migration (Principle III).
  4. User-facing changes to commands/flags/output are reflected in help text and the changelog.
- Commits are small and scoped; commit messages describe intent.

## Governance

- This constitution supersedes ad-hoc practice. When a decision conflicts with a principle
  here, the principle wins unless the constitution is amended first.
- Amendments are made by editing this file, bumping the version per the policy below, and
  updating the Sync Impact Report at the top.
- Versioning policy for this document:
  - MAJOR: a principle is removed or redefined in a backward-incompatible way.
  - MINOR: a new principle or section is added, or guidance is materially expanded.
  - PATCH: clarifications, wording, or typo fixes with no change in meaning.
- Every plan and implementation is expected to comply with these principles; the Constitution
  Check in the planning workflow is the enforcement point. Deviations MUST be justified in
  writing within the plan, or the plan MUST be revised.

**Version**: 1.0.0 | **Ratified**: 2026-07-06 | **Last Amended**: 2026-07-06
