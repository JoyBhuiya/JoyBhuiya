import { describe, expect, it } from 'vitest';
import type { Attempt, ProgressState } from '@/types/progress';
import type { ChapterId } from '@/types/question';
import { BADGES, evaluateBadges, getBadge, type BadgeContext } from '@/lib/badges';
import { createDefaultState } from '@/lib/storage';

const byChapter = { 1: ['a'], 2: ['b'], 3: ['c'], 4: ['d'], 5: ['e'] } as Record<
  ChapterId,
  string[]
>;

function exam(overrides: Partial<Attempt> = {}): Attempt {
  return {
    id: 'e1',
    mode: 'exam',
    finishedAt: new Date(2026, 7, 7, 14, 0).getTime(),
    durationMs: 40 * 60 * 1000,
    score: 20,
    total: 24,
    passed: true,
    seed: 1,
    answers: [],
    ...overrides,
  };
}

function context(state: Partial<ProgressState>, lastAttempt?: Attempt): BadgeContext {
  return {
    state: { ...createDefaultState(), ...state },
    lastAttempt,
    bankSize: 5,
    questionsByChapter: byChapter,
    now: Date.now(),
  };
}

describe('badge definitions', () => {
  it('has unique ids', () => {
    const ids = BADGES.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every badge a name and description', () => {
    for (const badge of BADGES) {
      expect(badge.name.length, badge.id).toBeGreaterThan(0);
      expect(badge.description.length, badge.id).toBeGreaterThan(10);
    }
  });

  it('keeps progress within its target', () => {
    const ctx = context({
      questions: { a: { seen: 1000, correct: 1000, lastSeenAt: 0 } },
      streak: { current: 100, longest: 100, lastStudyDay: null },
    });
    for (const badge of BADGES) {
      const progress = badge.progress?.(ctx);
      if (!progress) continue;
      expect(progress.current, badge.id).toBeLessThanOrEqual(progress.target);
    }
  });
});

describe('evaluateBadges', () => {
  it('awards nothing to a brand new user', () => {
    expect(evaluateBadges(context({}))).toEqual([]);
  });

  it('awards first-steps on the first answered question', () => {
    const earned = evaluateBadges(context({ questions: { a: { seen: 1, correct: 1, lastSeenAt: 0 } } }));
    expect(earned).toContain('first-steps');
  });

  it('never re-awards a badge that is already earned', () => {
    const earned = evaluateBadges(
      context({
        questions: { a: { seen: 1, correct: 1, lastSeenAt: 0 } },
        badges: { 'first-steps': 1 },
      }),
    );
    expect(earned).not.toContain('first-steps');
  });

  it('awards full-house only on a perfect paper', () => {
    expect(evaluateBadges(context({ attempts: [exam({ score: 23 })] }))).not.toContain('full-house');
    expect(evaluateBadges(context({ attempts: [exam({ score: 24 })] }))).toContain('full-house');
  });

  it('awards comeback when a pass immediately follows a failure', () => {
    // Attempts are stored newest first.
    const attempts = [exam({ id: 'e2', passed: true }), exam({ id: 'e1', passed: false })];
    expect(evaluateBadges(context({ attempts }))).toContain('comeback');
  });

  it('does not award comeback for two passes in a row', () => {
    const attempts = [exam({ id: 'e2', passed: true }), exam({ id: 'e1', passed: true })];
    expect(evaluateBadges(context({ attempts }))).not.toContain('comeback');
  });

  it('awards untouchable for three consecutive passes', () => {
    const attempts = [1, 2, 3].map((i) => exam({ id: `e${i}`, passed: true }));
    expect(evaluateBadges(context({ attempts }))).toContain('untouchable');
  });

  it('awards fast-track only when 15 minutes or more were left', () => {
    expect(
      evaluateBadges(context({ attempts: [exam({ durationMs: 29 * 60 * 1000 })] })),
    ).toContain('fast-track');
    expect(
      evaluateBadges(context({ attempts: [exam({ durationMs: 40 * 60 * 1000 })] })),
    ).not.toContain('fast-track');
  });

  it('awards completionist only once the whole bank has been seen', () => {
    const partial = Object.fromEntries(
      ['a', 'b', 'c'].map((id) => [id, { seen: 1, correct: 1, lastSeenAt: 0 }]),
    );
    expect(evaluateBadges(context({ questions: partial }))).not.toContain('completionist');

    const complete = Object.fromEntries(
      ['a', 'b', 'c', 'd', 'e'].map((id) => [id, { seen: 1, correct: 1, lastSeenAt: 0 }]),
    );
    expect(evaluateBadges(context({ questions: complete }))).toContain('completionist');
  });

  it('awards night-owl based on the attempt time, not the current time', () => {
    const lateAttempt = exam({ finishedAt: new Date(2026, 7, 7, 2, 30).getTime() });
    expect(evaluateBadges(context({ attempts: [lateAttempt] }, lateAttempt))).toContain('night-owl');
  });

  it('awards streak badges from the longest streak, not the current one', () => {
    const earned = evaluateBadges(
      context({ streak: { current: 1, longest: 7, lastStudyDay: '2026-08-07' } }),
    );
    expect(earned).toContain('streak-3');
    expect(earned).toContain('streak-7');
    expect(earned).not.toContain('streak-30');
  });
});

describe('getBadge', () => {
  it('finds a badge by id', () => {
    expect(getBadge('first-steps')?.name).toBe('First steps');
  });

  it('returns undefined for an unknown id', () => {
    expect(getBadge('nope')).toBeUndefined();
  });
});
