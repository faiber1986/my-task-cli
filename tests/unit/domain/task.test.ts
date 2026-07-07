import { describe, it, expect } from 'vitest';
import {
  normalizeTitle,
  requireTitle,
  parsePriority,
  normalizeTags,
} from '../../../src/domain/task.js';
import { ValidationError } from '../../../src/domain/errors.js';

describe('title validation', () => {
  it('trims a title', () => {
    expect(normalizeTitle('  Buy milk  ')).toBe('Buy milk');
  });

  it('rejects empty/whitespace titles', () => {
    expect(() => requireTitle('   ')).toThrow(ValidationError);
    expect(() => requireTitle('')).toThrow(ValidationError);
  });

  it('accepts a non-empty title', () => {
    expect(requireTitle('  Write spec ')).toBe('Write spec');
  });
});

describe('priority parsing', () => {
  it('returns null for missing/empty priority', () => {
    expect(parsePriority(null)).toBeNull();
    expect(parsePriority(undefined)).toBeNull();
    expect(parsePriority('  ')).toBeNull();
  });

  it('accepts high/medium/low case-insensitively and lowercases', () => {
    expect(parsePriority('HIGH')).toBe('high');
    expect(parsePriority('Medium')).toBe('medium');
    expect(parsePriority('low')).toBe('low');
  });

  it('rejects invalid priorities with accepted values listed', () => {
    expect(() => parsePriority('urgent')).toThrow(/high, medium, low/);
  });
});

describe('tag normalization', () => {
  it('trims, drops empties, and de-duplicates case-insensitively (first casing kept)', () => {
    expect(normalizeTags([' Work ', 'work', '', 'home', 'HOME'])).toEqual(['Work', 'home']);
  });

  it('returns [] for undefined', () => {
    expect(normalizeTags(undefined)).toEqual([]);
  });
});
