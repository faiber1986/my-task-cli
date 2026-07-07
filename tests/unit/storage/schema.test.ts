import { describe, it, expect } from 'vitest';
import { parseStore, migrate, emptyStore, CURRENT_VERSION } from '../../../src/storage/schema.js';
import { StorageError } from '../../../src/domain/errors.js';

describe('schema', () => {
  it('emptyStore is the current version with nextId 1', () => {
    expect(emptyStore()).toEqual({ version: CURRENT_VERSION, nextId: 1, tasks: [] });
  });

  it('parses a valid current-version store', () => {
    const raw = JSON.stringify({ version: 1, nextId: 4, tasks: [] });
    expect(parseStore(raw, '/x').nextId).toBe(4);
  });

  it('refuses invalid JSON without throwing away data', () => {
    expect(() => parseStore('{not json', '/x/tasks.json')).toThrow(StorageError);
    expect(() => parseStore('{not json', '/x/tasks.json')).toThrow(/not valid JSON/);
  });

  it('refuses an unrecognized shape (no version)', () => {
    expect(() => migrate({ tasks: [] }, '/x')).toThrow(/unrecognized format/);
  });

  it('refuses a newer version than the tool understands', () => {
    expect(() => migrate({ version: 99, nextId: 1, tasks: [] }, '/x')).toThrow(/newer version/);
  });

  it('refuses a same-version store missing required fields', () => {
    expect(() => migrate({ version: 1, tasks: 'nope' }, '/x')).toThrow(/missing required fields/);
  });
});
