# Feature Specification: Task Management CLI (CRUD + priorities & tags)

**Feature Branch**: `001-task-crud`
**Created**: 2026-07-06
**Status**: Draft
**Input**: User description: "Gestión de tareas por línea de comandos con el binario `task`. El usuario puede: agregar una tarea con un título y, opcionalmente, una prioridad (alta/media/baja) y una o más etiquetas; listar las tareas viendo su estado, prioridad y etiquetas, con posibilidad de filtrar por estado, por prioridad y por etiqueta; marcar una tarea como completada; editar el título, la prioridad o las etiquetas de una tarea existente; y eliminar una tarea. Cada tarea tiene un identificador estable para poder referenciarla. Las tareas se guardan de forma persistente entre ejecuciones. El objetivo es una herramienta personal confiable para uso diario."

## Clarifications

### Session 2026-07-06

- Q: What stable identifier scheme do tasks use? → A: Sequential number from a monotonic counter that never reuses numbers (deleting task 2 does not free the number 2).
- Q: What does `list` show by default (no filters)? → A: Only pending tasks; completed tasks are shown via an explicit flag (e.g. `--all`) or the state filter.
- Q: Can a completed task be re-opened (set back to pending)? → A: Yes; completion is reversible via an explicit re-open action.
- Q: Where is the task store persisted (persistence scope)? → A: A single per-user store in the user's home configuration location, shared across all working directories.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capture and review tasks (Priority: P1)

As a daily user, I want to quickly add a task with a title (and optionally a priority and
one or more tags) and later see all my tasks in a clear list, so that I can offload what I
need to do and review it at a glance.

**Why this priority**: Capturing and reviewing tasks is the irreducible core of the tool. If
only this story exists, the tool is already useful as a persistent personal to-do list.

**Independent Test**: Add several tasks (some with priority and tags, some without), then list
them; verify every added task appears with its title, state, priority, and tags, and that the
data survives a second, separate invocation of the tool.

**Acceptance Scenarios**:

1. **Given** an empty task store, **When** the user adds a task with a title only, **Then** the
   task is saved with a stable identifier, a state of "pending", no priority, and no tags, and a
   confirmation showing the new identifier is displayed.
2. **Given** an empty task store, **When** the user adds a task with a title, a priority, and two
   tags, **Then** the task is saved with those exact attributes and confirmed to the user.
3. **Given** several existing tasks, **When** the user lists tasks, **Then** each task is shown
   with its identifier, title, state, priority (or an indication of none), and tags.
4. **Given** tasks were added in a previous run, **When** the user lists tasks in a new run,
   **Then** all previously added tasks are shown unchanged.
5. **Given** the user adds a task with an empty or whitespace-only title, **When** the command is
   executed, **Then** the task is rejected with a clear error and nothing is saved.
6. **Given** the user adds a task with an invalid priority value, **When** the command is executed,
   **Then** the task is rejected with a clear error listing the accepted priority values.

---

### User Story 2 - Complete tasks (Priority: P2)

As a user, I want to mark a task as completed by its identifier, so that I can track progress and
distinguish what is done from what is still pending.

**Why this priority**: Marking work done is what turns a static list into a functioning task
tracker; it directly follows capture/review in value.

**Independent Test**: With existing pending tasks, mark one complete by its identifier, then list;
verify its state changed to "completed" while others remain pending, and the change persists across
runs.

**Acceptance Scenarios**:

1. **Given** a pending task, **When** the user marks it complete by its identifier, **Then** its
   state becomes "completed" and the change is confirmed.
2. **Given** a task that is already completed, **When** the user marks it complete again, **Then**
   the tool reports it was already completed and makes no harmful change.
3. **Given** no task matches the given identifier, **When** the user attempts to complete it,
   **Then** a clear "not found" error is shown and nothing changes.
4. **Given** a completed task, **When** the user re-opens it by its identifier, **Then** its state
   returns to "pending" and the change is confirmed and persists across runs.

---

### User Story 3 - Filter the list (Priority: P2)

As a user with many tasks, I want to filter the listing by state, by priority, and by tag, so that
I can focus on a relevant subset (e.g., only pending high-priority tasks tagged "work").

**Why this priority**: Once the list grows, unfiltered output becomes noise. Filtering makes the
tool usable at real daily volumes, but it depends on capture (P1) existing first.

**Independent Test**: Create a mix of tasks across states, priorities, and tags; apply each filter
individually and in combination; verify only matching tasks are shown and non-matching are excluded.

**Acceptance Scenarios**:

1. **Given** a mix of pending and completed tasks, **When** the user filters by state "pending",
   **Then** only pending tasks are shown.
2. **Given** tasks of different priorities, **When** the user filters by priority "high", **Then**
   only high-priority tasks are shown.
3. **Given** tasks with different tags, **When** the user filters by tag "work", **Then** only
   tasks carrying that tag are shown.
4. **Given** multiple filters are supplied together, **When** the user lists, **Then** only tasks
   matching all supplied filters are shown.
5. **Given** a filter that matches nothing, **When** the user lists, **Then** an empty result is
   communicated clearly rather than shown as an error.

---

### User Story 4 - Edit a task (Priority: P3)

As a user, I want to change the title, priority, or tags of an existing task by its identifier, so
that I can correct mistakes and keep tasks accurate without recreating them.

**Why this priority**: Editing improves quality-of-life but the tool is usable without it (a user
could delete and re-add); therefore it ranks below core capture, completion, and filtering.

**Independent Test**: Edit each attribute (title, priority, tags) of an existing task, one at a
time and in combination; verify only the intended attributes changed, the identifier stayed the
same, and changes persist.

**Acceptance Scenarios**:

1. **Given** an existing task, **When** the user changes its title, **Then** the title is updated
   and all other attributes (including the identifier) are unchanged.
2. **Given** an existing task, **When** the user changes its priority, **Then** the new priority is
   saved; when the user clears the priority, **Then** the task ends up with no priority.
3. **Given** an existing task, **When** the user replaces its tags, **Then** the task carries
   exactly the new set of tags.
4. **Given** no task matches the identifier, **When** the user attempts to edit, **Then** a clear
   "not found" error is shown and nothing changes.
5. **Given** an edit with an invalid priority or empty title, **When** executed, **Then** the edit
   is rejected with a clear error and the task remains unchanged.

---

### User Story 5 - Remove a task (Priority: P3)

As a user, I want to delete a task by its identifier, so that I can keep my list free of items that
are no longer relevant.

**Why this priority**: Removal keeps the list tidy but is the least frequent core operation and is
not required for the tool to deliver value.

**Independent Test**: Delete an existing task by identifier, then list; verify it no longer appears,
other tasks remain, and the deletion persists across runs.

**Acceptance Scenarios**:

1. **Given** an existing task, **When** the user removes it by identifier, **Then** it no longer
   appears in any listing and the removal is confirmed.
2. **Given** no task matches the identifier, **When** the user attempts removal, **Then** a clear
   "not found" error is shown and nothing changes.
3. **Given** a removal is a destructive action, **When** the user requests it, **Then** the action
   only proceeds under an explicit, intentional invocation (no accidental bulk deletion).

---

### Edge Cases

- **Empty store**: Listing when no tasks exist communicates "no tasks" clearly, not an error.
- **All tasks completed**: A default listing (pending-only) when every task is completed shows an
  empty result clearly; the completed tasks are still retrievable via the explicit flag/filter.
- **Duplicate titles**: Two tasks may share the same title; they remain distinct via their
  identifiers.
- **Unknown identifier**: Any operation referencing a non-existent identifier fails with a clear
  "not found" message and a non-zero result, changing nothing.
- **Whitespace/empty title**: Rejected on add and on edit.
- **Invalid priority value**: Rejected with a message listing accepted values (high, medium, low).
- **Duplicate or empty tags**: Repeated tags on one task are de-duplicated; empty tag values are
  ignored or rejected clearly.
- **Corrupt or unreadable data**: The tool reports the problem clearly and refuses to
  overwrite/destroy existing data rather than starting from scratch silently.
- **Overlapping invocations**: If two invocations run at nearly the same time, the store must not be
  left half-written or corrupted.
- **First run**: When no data exists yet, the tool behaves as an empty store and creates storage on
  the first successful write.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The tool MUST allow the user to add a task by providing a non-empty title.
- **FR-002**: The tool MUST allow the user to optionally assign a priority of high, medium, or low
  when adding a task; if omitted, the task has no priority.
- **FR-003**: The tool MUST allow the user to optionally assign one or more tags when adding a task;
  if omitted, the task has no tags.
- **FR-004**: The tool MUST assign every task a stable identifier that does not change for the life
  of the task and is used to reference it in all other operations. Identifiers are sequential
  numbers drawn from a monotonic counter that never reuses a number, so a removed task's identifier
  is never reassigned to a different task.
- **FR-005**: Every task MUST have a state that is either "pending" or "completed"; newly added
  tasks start as "pending".
- **FR-006**: The tool MUST allow the user to list tasks, showing for each its identifier, title,
  state, priority (or an explicit "none"), and tags. By default the listing shows only pending
  tasks; completed tasks are included only when the user requests them via an explicit flag (e.g.
  `--all`) or an explicit state filter.
- **FR-007**: The tool MUST allow the user to filter the listing by state, by priority, and by tag,
  individually or in combination, returning only tasks matching all supplied filters.
- **FR-008**: The tool MUST allow the user to mark a task as completed by its identifier, and MUST
  allow the user to re-open a completed task by its identifier, setting its state back to pending.
- **FR-009**: The tool MUST allow the user to edit an existing task's title, priority, and/or tags
  by its identifier, leaving the identifier and unspecified attributes unchanged.
- **FR-010**: The tool MUST allow the user to permanently remove a task by its identifier.
- **FR-011**: The tool MUST persist all tasks and their attributes in a single per-user store
  located in the user's home configuration location, so that the same tasks are available in all
  subsequent runs regardless of the working directory from which the tool is invoked.
- **FR-012**: The tool MUST validate inputs and reject invalid operations (empty title, invalid
  priority, unknown identifier) with a clear, actionable error message and without modifying stored
  data.
- **FR-013**: The tool MUST report success and failure distinctly so that both a human reading the
  output and an automated script can tell whether an operation succeeded.
- **FR-014**: The tool MUST protect stored data against loss or corruption on write, including when
  a write is interrupted or two invocations overlap.
- **FR-015**: The tool MUST provide machine-readable output for the listing so it can be used from
  scripts, in addition to a human-readable default.

### Key Entities

- **Task**: A single unit of work the user wants to track. Attributes: a stable identifier; a
  title (required, non-empty); a state (pending or completed); an optional priority (high, medium,
  or low); a set of zero or more tags. May carry timestamps for creation and completion to support
  ordering and review.
- **Tag**: A short free-form label used to group and filter tasks. A task may have several; the same
  tag may appear on many tasks.
- **Task Store**: The persistent collection of all tasks for the single user of this tool, retained
  between runs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a task and confirm it in the list in under 10 seconds using a single
  command each.
- **SC-002**: 100% of tasks added persist and reappear correctly after the tool is closed and run
  again.
- **SC-003**: A user can locate a specific subset of tasks (e.g., pending high-priority tasks with a
  given tag) with a single filtered listing command.
- **SC-004**: Every operation on a non-existent identifier fails clearly (never silently) and leaves
  stored data unchanged, in 100% of cases.
- **SC-005**: No task data is lost or corrupted across normal use, including interrupted or
  overlapping invocations, in 100% of tested cases.
- **SC-006**: A new user can perform the full lifecycle of a task (add → list → complete → edit →
  remove) using only the tool's built-in help, without external documentation.
- **SC-007**: The listing output can be consumed by a script (machine-readable form) without parsing
  human formatting, enabling at least basic automation (e.g., counting pending tasks).

## Assumptions

- **Single user, single machine**: This is a personal tool; there is exactly one user and one local
  task store. Multi-user, sync, and networked access are out of scope for this feature.
- **Storage location**: Tasks are stored in a single per-user store in the user's home
  configuration location (resolved by the OS convention for user config), shared across all working
  directories; the user does not manage the storage file manually. (Clarified 2026-07-06.)
- **Priority vocabulary**: The accepted priorities are exactly high, medium, and low; there is no
  numeric or custom priority scheme in this feature.
- **Two states only**: Tasks are either pending or completed; there is no "in progress", archived,
  or deleted-but-recoverable state in this feature. Both transitions are supported: pending →
  completed and completed → pending (re-open). (Clarified 2026-07-06.)
- **Tags are free-form**: Tags are simple text labels with no predefined taxonomy, hierarchy, or
  per-tag metadata.
- **Identifier scheme**: The stable identifier is a sequential number from a monotonic,
  non-reusing counter, short enough to type by hand to reference a task in other commands.
  (Clarified 2026-07-06.)
- **No due dates/reminders**: Scheduling, due dates, and notifications are out of scope for this
  feature and may be addressed in a later spec.
