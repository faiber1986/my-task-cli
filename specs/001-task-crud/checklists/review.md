# Requirements Quality Checklist: Task Management CLI

**Purpose**: PR-review validation of requirements *quality* (completeness, clarity, consistency,
measurability, coverage) across the CLI contract, persistence/integrity, error handling, and
edge-case coverage. These items test whether the requirements are well written — not whether the
code works.
**Created**: 2026-07-06
**Feature**: [spec.md](../spec.md)

## CLI & Command Contract (UX)

- [x] CHK001 Are the accepted values and formats for every flag (`--priority`, `--tag`, `--state`, `--all`, `--json`, edit's `--clear-*`) specified consistently across the spec and `contracts/cli.md`? [Consistency, Spec §FR-002/§FR-007]
- [x] CHK002 Is the default (human) output content defined for each command, distinct from `--json`? [Completeness, Spec §FR-006/§FR-013]
- [x] CHK003 Are exit-code semantics (0 success / 1 user error / 2 internal) defined for every command and every failure class? [Completeness, Spec §FR-013]
- [x] CHK004 Is the `--json` result shape specified for each command type (list array, task object, removal result, error object)? [Clarity, Contract §JSON output]
- [x] CHK005 Are help/usage requirements defined (what `task help` and the no-argument invocation must present)? [Coverage, Gap]
- [x] CHK006 Is precedence/conflict behavior specified when mutually exclusive flags are combined (`--state` with `--all`, `--priority` with `--clear-priority`, `--tag` with `--clear-tags`)? [Ambiguity, Spec §FR-009]
- [x] CHK007 Is the requirement for repeatable `--tag` (multiple tags in one command) explicitly stated? [Completeness, Spec §FR-003]

## Persistence & Data Integrity

- [x] CHK008 Are atomic-write requirements stated in objectively verifiable terms (no partially written file observable)? [Measurability, Spec §FR-014]
- [x] CHK009 Are requirements for overlapping/concurrent invocations defined so that no update is lost and the store is never corrupted? [Coverage, Spec §FR-014, Edge Cases]
- [x] CHK010 Is the on-disk schema-version + migration requirement documented, including behavior for a store written by a newer version? [Completeness, Clarifications 2026-07-06]
- [x] CHK011 Is the corrupt/unreadable-store requirement defined as "surface and refuse to overwrite" rather than silent reset? [Edge Case, Spec Edge Cases]
- [x] CHK012 Is the store location requirement unambiguous across operating systems and is the `MY_TASK_CLI_STORE` override behavior specified? [Clarity, Spec §FR-011, Assumptions]
- [x] CHK013 Is first-run behavior (no store file yet) specified as an empty store? [Coverage, Spec Edge Cases]
- [x] CHK014 Are the required fields that make a store "valid" documented (what a malformed-but-parseable store means)? [Completeness, Gap]

## Error Handling & Validation

- [x] CHK015 Are title validation requirements (empty/whitespace rejected) stated for BOTH add and edit? [Consistency, Spec §FR-001/§FR-009/§FR-012]
- [x] CHK016 Is invalid-priority handling specified, including that the message must list the accepted values? [Clarity, Spec §FR-012, Edge Cases]
- [x] CHK017 Are "not found" requirements consistent across complete, reopen, edit, and remove? [Consistency, Spec §FR-008/§FR-009/§FR-010]
- [x] CHK018 Is the requirement that a failed/invalid operation leaves stored data unchanged stated and objectively testable? [Measurability, Spec §FR-012/§SC-004]
- [x] CHK019 Are error-channel requirements (errors to stderr, no stack traces) specified? [Completeness, Contract §Error output]
- [x] CHK020 Is the JSON error object shape specified for all error classes (validation, not_found, internal)? [Completeness, Contract §Error output]
- [x] CHK021 Are requirements defined for malformed task-id input (non-numeric, zero, negative)? [Gap]

## Scenario & Edge-Case Coverage

- [x] CHK022 Are requirements defined for listing an empty store (clear message, not an error)? [Coverage, Spec Edge Cases]
- [x] CHK023 Are duplicate-title requirements specified (tasks remain distinct by id)? [Edge Case, Spec Edge Cases]
- [x] CHK024 Are tag normalization requirements (trim, drop empties, de-duplicate) defined measurably, including case-sensitivity? [Clarity, Spec Edge Cases, Clarifications 2026-07-06]
- [x] CHK025 Is the all-tasks-completed default-listing scenario addressed in requirements? [Coverage, Spec Edge Cases]
- [x] CHK026 Are the no-op scenarios (completing an already-completed task, re-opening an already-pending task) specified as non-error outcomes? [Coverage, Spec §US2]
- [x] CHK027 Is the id non-reuse-after-deletion requirement explicitly stated? [Completeness, Spec §FR-004, Clarifications 2026-07-06]
- [x] CHK028 Does each user story (US1–US5) define acceptance scenarios covering its primary AND exception flows? [Coverage, Spec §User Scenarios]

## Acceptance Criteria & Measurability

- [x] CHK029 Are all success criteria (SC-001…SC-007) measurable and technology-agnostic? [Measurability, Spec §Success Criteria]
- [x] CHK030 Is SC-001's "under 10 seconds" tied to a verifiable, non-ambiguous condition? [Ambiguity, Spec §SC-001]
- [x] CHK031 Does every functional requirement trace to at least one acceptance scenario or success criterion? [Traceability, Spec §Requirements]

## Consistency, Dependencies & Assumptions

- [x] CHK032 Do FR-015 (`--json` on every command) and `contracts/cli.md` agree for all six commands, with no command missing? [Consistency, Spec §FR-015]
- [x] CHK033 Are the scope-bounding assumptions (single user, two states, no due dates/reminders) documented and validated as intentional exclusions? [Assumption, Spec §Assumptions]
- [x] CHK034 Is the tag/filter case-sensitivity decision consistent across spec Edge Cases, the Clarifications log, and the CLI contract? [Consistency, Clarifications 2026-07-06]

## Notes

- Each item validates the *requirements*, not the implementation. Check off `[x]` when the spec
  (not the code) satisfies the item; annotate gaps inline.
- Traceability: ≥80% of items reference a spec section or a `[Gap]/[Ambiguity]/[Assumption]` marker.
- This checklist is a PR-review gate for spec quality; it complements `requirements.md` (the
  initial spec-quality checklist from `/speckit.specify`).

## Evaluation & Resolution — 2026-07-06

Evaluated all 34 items against `spec.md`: **22 PASS**, **12 GAP** — all gaps closed by amending the
spec (the behavior already existed; the requirement was simply not written down).

| Item | Gap | Closed by |
|------|-----|-----------|
| CHK003 | Exit-code scheme not in spec | FR-013 (stdout/stderr + meaningful exit codes: success / user error / internal) |
| CHK005 | No help/usage requirement | FR-016 (built-in help; no-arg shows help) |
| CHK006 | Conflicting edit flags undefined | FR-009 + Edge "Conflicting edit flags" |
| CHK010 | Schema version/migration not required | FR-017 (versioned store, migration, refuse newer version) |
| CHK012 | Store override not in spec | FR-011 (environment-variable override) |
| CHK014 | Structurally-invalid store undefined | Edge "Corrupt, unreadable, or structurally invalid" + FR-017 |
| CHK019 | stderr / no-stack-traces not in spec | FR-013 |
| CHK021 | Malformed id input undefined | Edge "Malformed identifier input" |
| CHK024 | Tag case-insensitivity unstated | FR-007 + Edge "Duplicate or empty tags" + Assumptions |
| CHK026 | Reopen no-op not specified | US2 acceptance scenario 5 |
| CHK030 | SC-001 ambiguous ("under 10 seconds") | SC-001 reworded to a verifiable condition |
| CHK034 | Case-sensitivity consistency | FR-007 + Edge + Assumptions now aligned |
