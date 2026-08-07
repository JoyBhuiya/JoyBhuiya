import { describe, expect, it } from 'vitest';
import type { Question } from '@/types/question';
import type { AttemptAnswer, ProgressState } from '@/types/progress';
import {
  chapterBreakdown,
  computeReadiness,
  isAnswerCorrect,
  lifetimeStats,
  passed,
  readinessBand,
  weakestSections,
  READINESS_UNPROVEN_CAP,
} from '@/lib/scoring';
import { createDefaultState } from '@/lib/storage';

function question(overrides: Partial<Question> = {}): Question {
  return {
    id: 'q-test',
    chapter: 1,
    section: '1.1',
    topic: 'Test',
    type: 'single',
    stem: 'Stem?',
    options: [
      { id: 'a', text: 'A' },
      { id: 'b', text: 'B' },
      { id: 'c', text: 'C' },
      { id: 'd', text: 'D' },
    ],
    correct: ['a'],
    explanation: 'Because.',
    difficulty: 1,
    ...overrides,
  };
}

function answer(overrides: Partial<AttemptAnswer> = {}): AttemptAnswer {
  return {
    questionId: 'q-test',
    chapter: 1,
    section: '1.1',
    selected: ['a'],
    correct: true,
    timeMs: 1000,
    flagged: false,
    ...overrides,
  };
}

describe('isAnswerCorrect', () => {
  it('accepts the right single answer', () => {
    expect(isAnswerCorrect(question(), ['a'])).toBe(true);
  });

  it('rejects a wrong single answer', () => {
    expect(isAnswerCorrect(question(), ['b'])).toBe(false);
  });

  it('treats an unanswered question as wrong', () => {
    expect(isAnswerCorrect(question(), [])).toBe(false);
  });

  it('marks select-two all-or-nothing, as the real test does', () => {
    const q = question({ type: 'multi', correct: ['a', 'c'] });
    expect(isAnswerCorrect(q, ['a', 'c'])).toBe(true);
    expect(isAnswerCorrect(q, ['a'])).toBe(false);
    expect(isAnswerCorrect(q, ['a', 'b'])).toBe(false);
  });

  it('ignores the order options were selected in', () => {
    const q = question({ type: 'multi', correct: ['a', 'c'] });
    expect(isAnswerCorrect(q, ['c', 'a'])).toBe(true);
  });

  it('rejects a superset of the correct answers', () => {
    const q = question({ type: 'multi', correct: ['a', 'c'] });
    expect(isAnswerCorrect(q, ['a', 'c', 'b'])).toBe(false);
  });
});

describe('passed', () => {
  it('needs exactly 18 of 24', () => {
    expect(passed(17, 24)).toBe(false);
    expect(passed(18, 24)).toBe(true);
  });

  it('applies the same 75% bar to other lengths', () => {
    expect(passed(15, 20)).toBe(true);
    expect(passed(14, 20)).toBe(false);
  });

  it('does not pass an empty attempt', () => {
    expect(passed(0, 0)).toBe(false);
  });
});

describe('chapterBreakdown', () => {
  it('groups by chapter and computes accuracy', () => {
    const rows = chapterBreakdown([
      answer({ chapter: 1, correct: true }),
      answer({ chapter: 1, correct: false }),
      answer({ chapter: 3, section: '3.1', correct: true }),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ key: '1', correct: 1, total: 2, accuracy: 0.5 });
    expect(rows[1]).toMatchObject({ key: '3', correct: 1, total: 1, accuracy: 1 });
  });
});

describe('weakestSections', () => {
  it('returns the worst sections first, ignoring one-off questions', () => {
    const rows = weakestSections([
      answer({ section: '3.1', correct: false }),
      answer({ section: '3.1', correct: false }),
      answer({ section: '3.2', correct: false }),
      answer({ section: '3.2', correct: true }),
      answer({ section: '4.1', correct: false }), // only one question — too thin to judge
    ]);
    expect(rows.map((r) => r.key)).toEqual(['3.1', '3.2']);
  });

  it('excludes sections answered perfectly', () => {
    const rows = weakestSections([
      answer({ section: '2.1', correct: true }),
      answer({ section: '2.1', correct: true }),
    ]);
    expect(rows).toHaveLength(0);
  });
});

describe('lifetimeStats', () => {
  it('counts distinct questions seen separately from total answers', () => {
    const state: ProgressState = {
      ...createDefaultState(),
      questions: {
        a: { seen: 3, correct: 2, lastSeenAt: 0 },
        b: { seen: 1, correct: 0, lastSeenAt: 0 },
      },
    };
    expect(lifetimeStats(state)).toEqual({ answered: 4, correct: 2, accuracy: 0.5, seen: 2 });
  });

  it('reports zero accuracy rather than NaN on an empty state', () => {
    expect(lifetimeStats(createDefaultState()).accuracy).toBe(0);
  });
});

describe('computeReadiness', () => {
  const byChapter = { 1: ['a'], 2: ['b'], 3: ['c'], 4: ['d'], 5: ['e'] } as Record<
    1 | 2 | 3 | 4 | 5,
    string[]
  >;

  it('is zero for a brand new user', () => {
    const readiness = computeReadiness(createDefaultState(), byChapter, 5);
    expect(readiness.score).toBe(0);
    expect(readiness.band).toBe('Not ready yet');
  });

  it('caps the score until two mock exams have been sat', () => {
    const state: ProgressState = {
      ...createDefaultState(),
      questions: Object.fromEntries(
        ['a', 'b', 'c', 'd', 'e'].map((id) => [id, { seen: 5, correct: 5, lastSeenAt: 0 }]),
      ),
      attempts: [
        {
          id: 'e1',
          mode: 'exam',
          finishedAt: 1,
          durationMs: 1,
          score: 24,
          total: 24,
          passed: true,
          seed: 1,
          answers: [],
        },
      ],
    };
    const readiness = computeReadiness(state, byChapter, 5);
    expect(readiness.score).toBeLessThanOrEqual(READINESS_UNPROVEN_CAP);
    expect(readiness.limitedBy).toContain('mock exam');
  });

  it('never exceeds 100 or drops below 0', () => {
    const state: ProgressState = {
      ...createDefaultState(),
      questions: Object.fromEntries(
        ['a', 'b', 'c', 'd', 'e'].map((id) => [id, { seen: 40, correct: 40, lastSeenAt: 0 }]),
      ),
      attempts: Array.from({ length: 3 }, (_, i) => ({
        id: `e${i}`,
        mode: 'exam' as const,
        finishedAt: i,
        durationMs: 1,
        score: 24,
        total: 24,
        passed: true,
        seed: 1,
        answers: [],
      })),
    };
    const readiness = computeReadiness(state, byChapter, 5);
    expect(readiness.score).toBeGreaterThanOrEqual(0);
    expect(readiness.score).toBeLessThanOrEqual(100);
    expect(readiness.limitedBy).toBeNull();
  });
});

describe('readinessBand', () => {
  it('maps scores onto the right plain-English band', () => {
    expect(readinessBand(10)).toBe('Not ready yet');
    expect(readinessBand(50)).toBe('Getting there');
    expect(readinessBand(70)).toBe('On track');
    expect(readinessBand(90)).toBe('Test ready');
  });
});
