import { Task, TaskSet } from '../domain/task.js';
import { StorageError } from '../domain/errors.js';

export const CURRENT_VERSION = 1;

/** The on-disk document: a versioned TaskSet. */
export interface StoreData extends TaskSet {
  version: number;
  nextId: number;
  tasks: Task[];
}

export function emptyStore(): StoreData {
  return { version: CURRENT_VERSION, nextId: 1, tasks: [] };
}

/** Ordered migrations keyed by the version they upgrade FROM. */
type Migration = (data: Record<string, unknown>) => Record<string, unknown>;
const migrations: Record<number, Migration> = {
  // No migrations yet; version 1 is the initial schema.
};

function validateShape(data: Record<string, unknown>, storePath: string): void {
  if (typeof data.nextId !== 'number' || !Array.isArray(data.tasks)) {
    throw new StorageError(
      `Task store at ${storePath} is missing required fields; refusing to overwrite it.`,
    );
  }
}

/** Upgrade a parsed document to the current schema, or throw StorageError. */
export function migrate(data: unknown, storePath: string): StoreData {
  if (typeof data !== 'object' || data === null || typeof (data as { version?: unknown }).version !== 'number') {
    throw new StorageError(
      `Task store at ${storePath} has an unrecognized format; refusing to overwrite it.`,
    );
  }
  let doc = data as Record<string, unknown>;
  const version = doc.version as number;
  if (version > CURRENT_VERSION) {
    throw new StorageError(
      `Task store at ${storePath} was written by a newer version (v${version}); upgrade the tool.`,
    );
  }
  let current = version;
  while (current < CURRENT_VERSION) {
    const step = migrations[current];
    if (!step) {
      throw new StorageError(`No migration available from store version ${current}.`);
    }
    doc = step(doc);
    current = doc.version as number;
  }
  validateShape(doc, storePath);
  return doc as unknown as StoreData;
}

/** Parse raw file contents into a validated, current-version StoreData. */
export function parseStore(raw: string, storePath: string): StoreData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new StorageError(
      `Task store at ${storePath} is not valid JSON; refusing to overwrite it.`,
    );
  }
  return migrate(parsed, storePath);
}
