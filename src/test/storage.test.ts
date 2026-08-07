import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createDefaultState,
  isStorageWritable,
  load,
  normalise,
  save,
  STORAGE_KEY,
  __resetStorageWritable,
} from '@/lib/storage';

beforeEach(() => {
  localStorage.clear();
  __resetStorageWritable();
  vi.restoreAllMocks();
});

describe('load', () => {
  it('returns defaults when nothing is stored', () => {
    expect(load()).toEqual(createDefaultState());
  });

  it('recovers from unparseable JSON rather than throwing', () => {
    localStorage.setItem(STORAGE_KEY, '{ not json');
    expect(() => load()).not.toThrow();
    expect(load()).toEqual(createDefaultState());
  });

  it('recovers when the stored value is not an object', () => {
    localStorage.setItem(STORAGE_KEY, '"a string"');
    expect(load()).toEqual(createDefaultState());
  });

  it('round-trips a saved state', () => {
    const state = createDefaultState();
    state.streak = { current: 4, longest: 9, lastStudyDay: '2026-08-07' };
    state.badges = { 'first-steps': 1234 };
    save(state);
    expect(load().streak).toEqual(state.streak);
    expect(load().badges).toEqual(state.badges);
  });
});

describe('normalise', () => {
  it('keeps valid fields and defaults the rest', () => {
    const result = normalise({
      settings: { theme: 'dark' },
      questions: { a: { seen: 2, correct: 1, lastSeenAt: 99 } },
      streak: { current: 3 },
    });
    expect(result.settings.theme).toBe('dark');
    expect(result.settings.instantFeedback).toBe(true);
    expect(result.questions.a).toEqual({ seen: 2, correct: 1, lastSeenAt: 99 });
    expect(result.streak).toEqual({ current: 3, longest: 0, lastStudyDay: null });
  });

  it('rejects an unrecognised theme value', () => {
    expect(normalise({ settings: { theme: 'neon' } }).settings.theme).toBe('system');
  });

  it('drops malformed question stats without losing the good ones', () => {
    const result = normalise({
      questions: { good: { seen: 1, correct: 1, lastSeenAt: 5 }, bad: 'nope' },
    });
    expect(Object.keys(result.questions)).toEqual(['good']);
  });

  it('drops attempts that are missing an id or answers', () => {
    const result = normalise({
      attempts: [{ id: 'ok', answers: [] }, { id: 'no-answers' }, { answers: [] }],
    });
    expect(result.attempts).toHaveLength(1);
    expect(result.attempts[0].id).toBe('ok');
  });

  it('drops badge entries that are not timestamps', () => {
    const result = normalise({ badges: { real: 123, fake: 'yes' } });
    expect(result.badges).toEqual({ real: 123 });
  });

  it('always stamps the current version', () => {
    expect(normalise({ version: 99 }).version).toBe(1);
  });
});

describe('save', () => {
  it('flags storage as unwritable when the quota is exceeded, without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    expect(() => save(createDefaultState())).not.toThrow();
    expect(isStorageWritable()).toBe(false);
  });
});
