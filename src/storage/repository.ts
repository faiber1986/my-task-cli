import { promises as fs } from 'node:fs';
import path from 'node:path';
import { StoreData, emptyStore, parseStore } from './schema.js';
import { resolveStorePath } from './paths.js';
import { StorageError } from '../domain/errors.js';

const LOCK_TIMEOUT_MS = 2000;
const LOCK_RETRY_MS = 50;
const LOCK_STALE_MS = 30000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Persists the task store to a single JSON file with atomic writes and a lock. */
export class Repository {
  constructor(private readonly storePath: string = resolveStorePath()) {}

  /** Read the store; a missing file is an empty store (first run). */
  async load(): Promise<StoreData> {
    let raw: string;
    try {
      raw = await fs.readFile(this.storePath, 'utf8');
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return emptyStore();
      throw new StorageError(
        `Could not read task store at ${this.storePath}: ${(err as Error).message}`,
      );
    }
    return parseStore(raw, this.storePath);
  }

  /** Atomically write the store: temp file in the same dir, then rename. */
  async save(data: StoreData): Promise<void> {
    await fs.mkdir(path.dirname(this.storePath), { recursive: true });
    const tmp = `${this.storePath}.tmp-${process.pid}-${Date.now()}`;
    const json = `${JSON.stringify(data, null, 2)}\n`;
    await fs.writeFile(tmp, json, 'utf8');
    await fs.rename(tmp, this.storePath);
  }

  /**
   * Run a read-modify-write cycle under an exclusive lock so overlapping
   * invocations cannot lose an update or corrupt the file.
   */
  async mutate<T>(fn: (data: StoreData) => { data: StoreData; result: T }): Promise<T> {
    await fs.mkdir(path.dirname(this.storePath), { recursive: true });
    const lockPath = `${this.storePath}.lock`;
    await this.acquireLock(lockPath);
    try {
      const data = await this.load();
      const { data: next, result } = fn(data);
      await this.save(next);
      return result;
    } finally {
      await fs.rm(lockPath, { force: true });
    }
  }

  private async acquireLock(lockPath: string): Promise<void> {
    const deadline = Date.now() + LOCK_TIMEOUT_MS;
    for (;;) {
      try {
        const handle = await fs.open(lockPath, 'wx');
        await handle.writeFile(String(process.pid));
        await handle.close();
        return;
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        // EEXIST = lock held. On Windows a concurrent create/delete of the lock
        // can surface as EPERM/EBUSY (sharing violation / pending delete); treat
        // those as transient contention and retry rather than failing.
        const contention = code === 'EEXIST' || code === 'EPERM' || code === 'EBUSY';
        if (!contention) {
          throw new StorageError(`Could not acquire store lock: ${(err as Error).message}`);
        }
        // Reclaim a stale lock left behind by a crashed invocation.
        try {
          const stat = await fs.stat(lockPath);
          if (Date.now() - stat.mtimeMs > LOCK_STALE_MS) {
            await fs.rm(lockPath, { force: true });
            continue;
          }
        } catch {
          // Lock vanished between open and stat; retry immediately.
          continue;
        }
        if (Date.now() > deadline) {
          throw new StorageError(
            'Task store is locked by another invocation; try again in a moment.',
          );
        }
        await delay(LOCK_RETRY_MS + Math.random() * 20);
      }
    }
  }
}
