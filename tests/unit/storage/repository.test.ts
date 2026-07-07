import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { Repository } from '../../../src/storage/repository.js';
import { emptyStore } from '../../../src/storage/schema.js';
import { makeStorePath } from '../../helpers/tempStore.js';

describe('Repository', () => {
  it('load() returns an empty store when the file is missing', async () => {
    const repo = new Repository(makeStorePath());
    expect(await repo.load()).toEqual(emptyStore());
  });

  it('save() writes atomically and load() reads it back', async () => {
    const path = makeStorePath();
    const repo = new Repository(path);
    const data = { ...emptyStore(), nextId: 2 };
    await repo.save(data);
    // File is valid JSON on disk (no partial write).
    expect(() => JSON.parse(readFileSync(path, 'utf8'))).not.toThrow();
    expect((await repo.load()).nextId).toBe(2);
  });

  it('mutate() serializes overlapping writes without losing updates', async () => {
    const repo = new Repository(makeStorePath());
    // 20 concurrent increments of nextId under the lock.
    await Promise.all(
      Array.from({ length: 20 }, () =>
        repo.mutate((d) => ({ data: { ...d, nextId: d.nextId + 1 }, result: null })),
      ),
    );
    expect((await repo.load()).nextId).toBe(21);
  });
});
