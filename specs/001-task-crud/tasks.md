---
description: "Task list for Task Management CLI (001-task-crud)"
---

# Tasks: Task Management CLI (CRUD + priorities & tags)

**Input**: Design documents from `/specs/001-task-crud/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md

**Tests**: INCLUDED and mandatory. Constitution Principle II (Test-First, NON-NEGOTIABLE) requires
every unit of logic and every command to have tests written FIRST that FAIL before implementation
(Red → Green → Refactor).

**Organization**: Tasks are grouped by user story so each story is an independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US5 map to the spec's user stories
- Exact file paths are included in each task

## Path Conventions

Single-project CLI (per plan.md): source in `src/`, tests in `tests/` at repo root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project skeleton and test harness

- [ ] T001 Create source/test directory structure: `src/cli/commands/`, `src/domain/`, `src/storage/`, `src/output/`, `tests/unit/`, `tests/integration/`, `tests/contract/`, `tests/helpers/`
- [ ] T002 Add `vitest.config.ts` at repo root and ensure `tsconfig.json` type-checks test files; confirm `npm test` / `npm run build` / `npm run dev` work end-to-end
- [ ] T003 [P] Create hermetic store test helper in `tests/helpers/tempStore.ts` that sets `MY_TASK_CLI_STORE` to a fresh temp file and exposes a `runCli(args)` helper capturing stdout/stderr/exit code

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure domain types, storage layer, output, and CLI plumbing shared by ALL user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests for Foundational (write first, must FAIL) ⚠️

- [ ] T004 [P] Unit tests for Task validation/normalization (empty/whitespace title rejected, priority vocabulary, tag trim + case-insensitive de-dup) in `tests/unit/domain/task.test.ts`
- [ ] T005 [P] Unit tests for store path resolution (per-OS config dir + `MY_TASK_CLI_STORE` override) in `tests/unit/storage/paths.test.ts`
- [ ] T006 [P] Unit tests for schema: first-run empty store, migration registry upgrades old version, corrupt/unknown-version file is refused (never overwritten) in `tests/unit/storage/schema.test.ts`
- [ ] T007 [P] Unit tests for repository atomic write (temp+rename) and exclusive lock under overlapping writes (no lost update / no corruption) in `tests/unit/storage/repository.test.ts`
- [ ] T008 [P] Unit tests for output formatters: human table columns and `--json` shape per `contracts/cli.md` in `tests/unit/output/format.test.ts`
- [ ] T009 [P] Unit tests for `collection.find(id)` (found + NotFoundError) in `tests/unit/domain/collection.test.ts`

### Implementation for Foundational

- [ ] T010 [P] Define `Task`, `Priority`, `State` types and pure validation/normalization in `src/domain/task.ts`
- [ ] T011 [P] Define typed errors (`ValidationError`, `NotFoundError`, `StorageError`) and exit-code mapping (1 user / 2 internal) in `src/domain/errors.ts`
- [ ] T012 [P] Implement OS-aware store path with `MY_TASK_CLI_STORE` override in `src/storage/paths.ts`
- [ ] T013 Implement on-disk schema `{version,nextId,tasks[]}`, migration registry, and corrupt-file refusal in `src/storage/schema.ts` (depends on T010)
- [ ] T014 Implement repository `load()`/`save()` with atomic temp+rename and exclusive lock (retry + bounded timeout, release in `finally`) in `src/storage/repository.ts` (depends on T012, T013)
- [ ] T015 [P] Implement human and JSON formatters in `src/output/format.ts` (depends on T010)
- [ ] T016 Create `taskCollection.ts` scaffold: in-memory container over the store plus `find(id)` in `src/domain/taskCollection.ts` (depends on T010, T011)
- [ ] T017 Implement CLI entry + router skeleton: argv parse via `node:util.parseArgs`, command dispatch, help stub, and error→exit-code handling in `src/index.ts`, `src/cli/router.ts`, `src/cli/args.ts` (depends on T011, T014, T015)

**Checkpoint**: Foundation ready — user stories can now be implemented.

---

## Phase 3: User Story 1 - Capture and review tasks (Priority: P1) 🎯 MVP

**Goal**: Add tasks (optional priority + tags) and list them; data persists across runs.

**Independent Test**: Add several tasks (some with priority/tags), run `list` in a separate
invocation, and confirm all appear with id/state/priority/tags unchanged.

### Tests for User Story 1 (write first, must FAIL) ⚠️

- [ ] T018 [P] [US1] Contract test `task add` (accepts title/`--priority`/repeated `--tag`; rejects empty title and invalid priority; confirms new id) in `tests/contract/add.test.ts`
- [ ] T019 [P] [US1] Contract test `task list` default (pending only) and `--json` output shape in `tests/contract/list.test.ts`
- [ ] T020 [P] [US1] Integration test: add multiple tasks then list, and verify persistence across a second CLI invocation in `tests/integration/add-list.test.ts`
- [ ] T021 [P] [US1] Unit test `collection.add` (assigns sequential id from `nextId`, defaults state=pending/priority=null/tags=[]) in `tests/unit/domain/add.test.ts`
- [ ] T022 [P] [US1] Unit test `collection.list` default (pending only, no filters) in `tests/unit/domain/list.test.ts`

### Implementation for User Story 1

- [ ] T023 [US1] Implement `collection.add(title, priority?, tags?)` in `src/domain/taskCollection.ts` (depends on T016)
- [ ] T024 [US1] Implement `collection.list()` default pending view in `src/domain/taskCollection.ts`
- [ ] T025 [US1] Implement `add` command (parse flags, validate, save, confirm id) in `src/cli/commands/add.ts`
- [ ] T026 [US1] Implement `list` command (human table + `--json`) in `src/cli/commands/list.ts`
- [ ] T027 [US1] Register `add` and `list` in `src/cli/router.ts`

**Checkpoint**: MVP — add and list fully functional and persistent.

---

## Phase 4: User Story 2 - Complete & re-open tasks (Priority: P2)

**Goal**: Mark a task completed by id and re-open a completed task back to pending.

**Independent Test**: Complete a pending task, list shows it completed; re-open it, list shows it
pending again; both changes persist.

### Tests for User Story 2 (write first, must FAIL) ⚠️

- [ ] T028 [P] [US2] Contract test `complete`/`reopen` (success; already-in-state no-op notice; unknown id → exit 1) in `tests/contract/complete-reopen.test.ts`
- [ ] T029 [P] [US2] Integration test: complete then reopen, verifying state + `completedAt` persist across runs in `tests/integration/complete-reopen.test.ts`
- [ ] T030 [P] [US2] Unit test `collection.complete`/`reopen` (sets/clears `completedAt`, no-op when already in target state) in `tests/unit/domain/complete-reopen.test.ts`

### Implementation for User Story 2

- [ ] T031 [US2] Implement `collection.complete(id)` and `collection.reopen(id)` in `src/domain/taskCollection.ts`
- [ ] T032 [P] [US2] Implement `complete` command in `src/cli/commands/complete.ts`
- [ ] T033 [P] [US2] Implement `reopen` command in `src/cli/commands/reopen.ts`
- [ ] T034 [US2] Register `complete` and `reopen` in `src/cli/router.ts`

**Checkpoint**: US1 + US2 both independently functional.

---

## Phase 5: User Story 3 - Filter the list (Priority: P2)

**Goal**: Filter `list` by state, priority, and tag (case-insensitive, AND-combined).

**Independent Test**: With a mix of tasks, apply each filter individually and combined; only
matching tasks appear; a non-matching filter yields a clear empty result (exit 0).

### Tests for User Story 3 (write first, must FAIL) ⚠️

- [ ] T035 [P] [US3] Contract test list filters (`--state`, `--all`, `--priority`, repeated `--tag`, combined) in `tests/contract/list-filters.test.ts`
- [ ] T036 [P] [US3] Integration test filtered listing across mixed states/priorities/tags in `tests/integration/list-filters.test.ts`
- [ ] T037 [P] [US3] Unit test `collection.list` filters (case-insensitive exact, AND semantics, empty result) in `tests/unit/domain/filters.test.ts`

### Implementation for User Story 3

- [ ] T038 [US3] Extend `collection.list` with state/priority/tag filters in `src/domain/taskCollection.ts`
- [ ] T039 [US3] Extend `list` command and filter arg parsing/validation in `src/cli/commands/list.ts` and `src/cli/args.ts`

**Checkpoint**: US1–US3 independently functional.

---

## Phase 6: User Story 4 - Edit a task (Priority: P3)

**Goal**: Change title, priority (or clear it), and/or tags (or clear them) of a task by id; id and
unspecified fields unchanged.

**Independent Test**: Edit each attribute individually and combined; verify only intended fields
change, id stays, and changes persist.

### Tests for User Story 4 (write first, must FAIL) ⚠️

- [ ] T040 [P] [US4] Contract test `edit` (`--title`, `--priority`/`--clear-priority`, `--tag`/`--clear-tags`; no-change-flags error; empty title/invalid priority → exit 1; unknown id → exit 1) in `tests/contract/edit.test.ts`
- [ ] T041 [P] [US4] Integration test: edit persists and leaves id + untouched fields unchanged in `tests/integration/edit.test.ts`
- [ ] T042 [P] [US4] Unit test `collection.edit` partial updates (clear priority → null, replace tags exactly) in `tests/unit/domain/edit.test.ts`

### Implementation for User Story 4

- [ ] T043 [US4] Implement `collection.edit(id, changes)` in `src/domain/taskCollection.ts`
- [ ] T044 [US4] Implement `edit` command and register it in `src/cli/commands/edit.ts` and `src/cli/router.ts`

**Checkpoint**: US1–US4 independently functional.

---

## Phase 7: User Story 5 - Remove a task (Priority: P3)

**Goal**: Permanently delete one task by id (single-target; ids never reused).

**Independent Test**: Remove a task; it disappears from listings, others remain, deletion persists,
and a later `add` does not reuse the removed id.

### Tests for User Story 5 (write first, must FAIL) ⚠️

- [ ] T045 [P] [US5] Contract test `remove` (success confirmation; unknown id → exit 1; single-target only) in `tests/contract/remove.test.ts`
- [ ] T046 [P] [US5] Integration test: remove persists and a subsequent add does not reuse the removed id (`nextId` intact) in `tests/integration/remove.test.ts`
- [ ] T047 [P] [US5] Unit test `collection.remove` (task gone, `nextId` unchanged) in `tests/unit/domain/remove.test.ts`

### Implementation for User Story 5

- [ ] T048 [US5] Implement `collection.remove(id)` in `src/domain/taskCollection.ts`
- [ ] T049 [US5] Implement `remove` command and register it in `src/cli/commands/remove.ts` and `src/cli/router.ts`

**Checkpoint**: All user stories independently functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Cross-story quality, docs, and final validation

- [ ] T050 [P] Complete help/usage text for all commands (and no-arg → help) in `src/cli/commands/help.ts` and `src/cli/router.ts`
- [ ] T051 [P] Add `README.md` with install and usage examples for every command
- [ ] T052 [P] Remove the unused `nanoid` dependency from `package.json` and `package-lock.json` (sequential ids chosen — Principle IV minimal deps)
- [ ] T053 [P] Edge-case unit sweep (duplicate titles remain distinct, empty store message, all-completed default list, whitespace/duplicate tags) in `tests/unit/domain/edge-cases.test.ts`
- [ ] T054 Run `npm run build` (strict, zero type errors) and `npm test` (all green); refactor duplication across command handlers
- [ ] T055 Execute `quickstart.md` end-to-end against a temp store and confirm behavior matches `contracts/cli.md` (per /verify)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories.
- **User Stories (Phases 3–7)**: each depends only on Foundational. US3 extends US1's `list`, so
  US3 should follow US1. US1 (P1) is the MVP; US2/US3 (P2) next; US4/US5 (P3) last.
- **Polish (Phase 8)**: depends on all targeted user stories being complete.

### User Story Dependencies

- **US1 (P1)**: after Foundational. No dependency on other stories.
- **US2 (P2)**: after Foundational. Independent of US1 at the domain level (operates on ids).
- **US3 (P2)**: after Foundational; builds on the `list` command created in US1.
- **US4 (P3)**: after Foundational. Independent.
- **US5 (P3)**: after Foundational. Independent.

### Within Each User Story

- Tests are written FIRST and must FAIL before implementation (Principle II).
- Domain (`collection.*`) before command handlers; command handlers before router registration.

### Parallel Opportunities

- Setup: T003 is [P].
- Foundational tests T004–T009 are all [P] (different files).
- Foundational impl: T010, T011, T012, T015 are [P]; T013→(T010), T014→(T012,T013), T016→(T010,T011),
  T017→(T011,T014,T015) are sequential on their inputs.
- Within a story, all test tasks marked [P] run together; domain-vs-command tasks that touch the same
  file (`taskCollection.ts`, `router.ts`) are sequential.
- US2 command handlers T032/T033 are [P] (separate files) before the shared router edit T034.

---

## Parallel Example: User Story 1

```bash
# Write all US1 tests first (they must fail):
Task: "Contract test task add in tests/contract/add.test.ts"          # T018
Task: "Contract test task list in tests/contract/list.test.ts"        # T019
Task: "Integration test add+list persistence in tests/integration/add-list.test.ts"  # T020
Task: "Unit test collection.add in tests/unit/domain/add.test.ts"     # T021
Task: "Unit test collection.list in tests/unit/domain/list.test.ts"   # T022
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP and validate** add/list
   end-to-end against a temp store → demo the MVP.

### Incremental Delivery

Foundation → US1 (MVP) → US2 → US3 → US4 → US5, validating each story independently before the next.
Each story is a shippable increment that does not break earlier ones.

---

## Notes

- [P] = different files, no dependency on an incomplete task.
- Every story is independently completable and testable.
- Verify each test fails before implementing it (TDD, non-negotiable).
- Commit after each task or logical group; keep `npm test` green and `tsc` clean per the constitution.
