import { ValidationError } from '../domain/errors.js';
import { State, Priority, parsePriority } from '../domain/task.js';
import { ListFilters } from '../domain/taskCollection.js';

export function parseId(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') {
    throw new ValidationError('Missing task id. Usage: task <command> <id>.');
  }
  if (!/^\d+$/.test(raw)) {
    throw new ValidationError(`Invalid task id "${raw}". Expected a positive integer.`);
  }
  const id = Number(raw);
  if (id < 1) throw new ValidationError(`Invalid task id "${raw}".`);
  return id;
}

export function parseStateValue(raw: string): State {
  const value = raw.trim().toLowerCase();
  if (value === 'pending' || value === 'completed') return value;
  throw new ValidationError(`Invalid state "${raw}". Accepted values: pending, completed.`);
}

/** Build list filters from parsed flag values. */
export function parseListFilters(
  values: Record<string, string | boolean | string[] | undefined>,
): ListFilters {
  const filters: ListFilters = {};
  if (typeof values.state === 'string') filters.state = parseStateValue(values.state);
  if (values.all === true) filters.all = true;
  if (typeof values.priority === 'string') {
    const priority = parsePriority(values.priority);
    if (priority) filters.priority = priority as Priority;
  }
  if (Array.isArray(values.tag) && values.tag.length) filters.tags = values.tag;
  return filters;
}
