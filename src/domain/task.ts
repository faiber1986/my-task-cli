import { ValidationError } from './errors.js';

export type Priority = 'high' | 'medium' | 'low';
export type State = 'pending' | 'completed';

export const PRIORITIES: readonly Priority[] = ['high', 'medium', 'low'];

export interface Task {
  id: number;
  title: string;
  state: State;
  priority: Priority | null;
  tags: string[];
  createdAt: string;
  completedAt: string | null;
}

/** A pure, storage-agnostic set of tasks plus the monotonic id counter. */
export interface TaskSet {
  nextId: number;
  tasks: Task[];
}

/** Trim a title; returns the normalized string (may be empty). */
export function normalizeTitle(raw: string): string {
  return (raw ?? '').trim();
}

/** Validate and return a non-empty title, or throw ValidationError. */
export function requireTitle(raw: string): string {
  const title = normalizeTitle(raw);
  if (title === '') {
    throw new ValidationError('Title must not be empty.');
  }
  return title;
}

/**
 * Parse a priority input. `null`/`undefined`/empty → null (no priority).
 * Accepts case-insensitive high/medium/low; anything else throws ValidationError.
 */
export function parsePriority(raw: string | null | undefined): Priority | null {
  if (raw == null) return null;
  const value = raw.trim().toLowerCase();
  if (value === '') return null;
  if ((PRIORITIES as readonly string[]).includes(value)) {
    return value as Priority;
  }
  throw new ValidationError(
    `Invalid priority "${raw}". Accepted values: ${PRIORITIES.join(', ')}.`,
  );
}

/** Trim tags, drop empties, and de-duplicate case-insensitively (first casing kept). */
export function normalizeTags(raw: readonly string[] | undefined): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of raw) {
    const trimmed = tag.trim();
    if (trimmed === '') continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}
