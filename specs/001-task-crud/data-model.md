# Data Model: Task Management CLI

**Feature**: `001-task-crud` | **Date**: 2026-07-06

Derived from the spec's Key Entities and Functional Requirements. Types are described
language-neutrally; the TypeScript equivalents live in `src/domain/`.

## Entity: Task

A single unit of work the user tracks.

| Field         | Type                          | Required | Notes |
|---------------|-------------------------------|----------|-------|
| `id`          | integer (≥ 1)                 | Yes      | Stable, sequential, never reused (FR-004). Assigned at creation. |
| `title`       | string                        | Yes      | Non-empty after trimming (FR-001, FR-012). |
| `state`       | `"pending"` \| `"completed"`  | Yes      | New tasks start `pending` (FR-005). |
| `priority`    | `"high"` \| `"medium"` \| `"low"` \| `null` | No | `null` means "no priority" (FR-002). |
| `tags`        | string[]                      | Yes      | May be empty. Trimmed, de-duplicated, order preserved (FR-003). |
| `createdAt`   | ISO-8601 timestamp string     | Yes      | Set at creation; supports ordering/review. |
| `completedAt` | ISO-8601 timestamp string \| null | Yes  | Set when completed, cleared to `null` on re-open. |

### Validation rules

- **Title**: reject if empty or whitespace-only, on both `add` and `edit` (FR-012).
- **Priority**: must be one of `high`, `medium`, `low` (case-insensitive input, stored lowercase),
  or absent/cleared → `null`. Any other value is rejected with a message listing accepted values.
- **Tags**: each tag is trimmed; empty results are dropped; duplicates within one task are removed
  (case-insensitive de-dup, first casing kept). No length/charset restriction beyond non-empty.
- **Id (as input to commands)**: must be a positive integer that exists in the store; otherwise a
  `NotFoundError` (FR-012, exit code 1).

### State transitions

```text
        complete
pending ─────────▶ completed
   ▲                   │
   └───────────────────┘
        reopen
```

- `complete`: `pending → completed`; sets `completedAt`. Completing an already-completed task is a
  no-op reported to the user (US2 scenario 2), not an error.
- `reopen`: `completed → pending`; clears `completedAt`. Re-opening a pending task is a no-op
  reported to the user, not an error.
- No other states exist (Assumptions: two states only).

## Entity: Task Store (persisted document)

The whole persisted collection for the single user.

| Field     | Type       | Notes |
|-----------|------------|-------|
| `version` | integer    | On-disk schema version; currently `1`. Drives migrations (FR-014, Principle V). |
| `nextId`  | integer ≥ 1| Monotonic counter for the next task id; never decremented. |
| `tasks`   | Task[]     | All tasks, pending and completed. |

- **Invariants**:
  - Every `task.id` is unique and `< nextId`.
  - `nextId` never decreases across the store's lifetime.
  - A missing store file is equivalent to `{ version: 1, nextId: 1, tasks: [] }` (first run).
- **Integrity**: written atomically (temp + rename) under an exclusive lock; a corrupt/unreadable
  file is surfaced as an error and never silently overwritten (research §3, §6).

## Derived views / operations (pure, in `domain/taskCollection.ts`)

- `add(title, priority?, tags?)` → new Task with `id = nextId`, `state = pending`; returns updated
  collection + created task.
- `find(id)` → Task or `NotFoundError`.
- `list(filters)` → tasks matching **all** supplied filters; default (no state filter and no
  `--all`) yields only `pending` (FR-006). Filters: `state`, `priority`, `tag` (case-insensitive,
  exact — research §7).
- `complete(id)` / `reopen(id)` → state transition per rules above.
- `edit(id, {title?, priority?, tags?})` → updates only supplied fields; unspecified fields and
  `id` unchanged (FR-009); clearing priority sets `null`; replacing tags sets the exact new set.
- `remove(id)` → removes the task; `nextId` unchanged (ids not reused).

## Filter model (CLI → domain)

| Filter     | Source flag(s)            | Match rule |
|------------|---------------------------|------------|
| state      | `--state pending\|completed`, or `--all` to include both | Exact, case-insensitive. Absent → pending only. |
| priority   | `--priority high\|medium\|low` | Exact, case-insensitive. |
| tag        | `--tag <name>` (repeatable) | Task must carry every requested tag; case-insensitive exact. |
