import { describe, expect, it } from 'vitest';
import type { ChapterId, Question } from '@/types/question';
import type { QuestionStat } from '@/types/progress';
import { allocateQuotas, examQuotas, selectQuestions, weightFor } from '@/lib/selection';
import { createRng } from '@/lib/shuffle';
import { EXAM_QUESTION_COUNT } from '@/types/exam';

function pool(perChapter = 40): Question[] {
  const questions: Question[] = [];
  for (const chapter of [1, 2, 3, 4, 5] as ChapterId[]) {
    for (let i = 0; i < perChapter; i += 1) {
      questions.push({
        id: `q${chapter}-${i}`,
        chapter,
        section: `${chapter}.${(i % 3) + 1}`,
        topic: 'Topic',
        type: 'single',
        stem: `Question ${chapter}-${i}?`,
        options: [
          { id: 'a', text: 'A' },
          { id: 'b', text: 'B' },
          { id: 'c', text: 'C' },
          { id: 'd', text: 'D' },
        ],
        correct: ['a'],
        explanation: 'Because it is.',
        difficulty: 2,
      });
    }
  }
  return questions;
}

describe('allocateQuotas', () => {
  it('always sums to exactly the requested count', () => {
    const weights = { 1: 0.08, 2: 0.08, 3: 0.35, 4: 0.26, 5: 0.23 } as Record<ChapterId, number>;
    for (let count = 1; count <= 60; count += 1) {
      const quotas = allocateQuotas(count, weights);
      const total = Object.values(quotas).reduce((sum, n) => sum + n, 0);
      expect(total, `count=${count}`).toBe(count);
    }
  });

  it('gives history the largest share of a 24-question exam', () => {
    const quotas = examQuotas(EXAM_QUESTION_COUNT);
    expect(Object.values(quotas).reduce((a, b) => a + b, 0)).toBe(24);
    expect(quotas[3]).toBeGreaterThan(quotas[1]);
    expect(quotas[3]).toBeGreaterThan(quotas[2]);
  });

  it('falls back to an even split when all weights are zero', () => {
    const quotas = allocateQuotas(10, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<ChapterId, number>);
    expect(Object.values(quotas).reduce((a, b) => a + b, 0)).toBe(10);
  });
});

describe('weightFor', () => {
  const now = 1_000_000_000;

  it('ranks unseen questions above ones already answered correctly', () => {
    const mastered: QuestionStat = { seen: 3, correct: 3, lastSeenAt: 0 };
    expect(weightFor(undefined, now, 0)).toBeGreaterThan(weightFor(mastered, now, 0));
  });

  it('ranks questions answered wrong above ones answered right', () => {
    const wrong: QuestionStat = { seen: 2, correct: 0, lastSeenAt: 0 };
    const right: QuestionStat = { seen: 2, correct: 2, lastSeenAt: 0 };
    expect(weightFor(wrong, now, 0)).toBeGreaterThan(weightFor(right, now, 0));
  });

  it('damps a question that was just seen', () => {
    const justSeen: QuestionStat = { seen: 1, correct: 0, lastSeenAt: now - 1000 };
    const longAgo: QuestionStat = { seen: 1, correct: 0, lastSeenAt: now - 30 * 24 * 3600 * 1000 };
    expect(weightFor(justSeen, now, 0)).toBeLessThan(weightFor(longAgo, now, 0));
  });

  it('reduces weight as more questions are drawn from the same section', () => {
    expect(weightFor(undefined, now, 3)).toBeLessThan(weightFor(undefined, now, 0));
  });

  it('never returns a weight of zero, so nothing is permanently unreachable', () => {
    const mastered: QuestionStat = { seen: 50, correct: 50, lastSeenAt: now };
    expect(weightFor(mastered, now, 10)).toBeGreaterThan(0);
  });
});

describe('selectQuestions', () => {
  const stats: Record<string, QuestionStat> = {};

  it('returns the requested number of questions', () => {
    const picked = selectQuestions({ pool: pool(), count: 24, stats, rng: createRng(1) });
    expect(picked).toHaveLength(24);
  });

  it('never returns a duplicate within a session', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      const picked = selectQuestions({ pool: pool(), count: 24, stats, rng: createRng(seed) });
      expect(new Set(picked.map((q) => q.id)).size).toBe(picked.length);
    }
  });

  it('respects chapter quotas', () => {
    const quotas = examQuotas(24);
    const picked = selectQuestions({
      pool: pool(),
      count: 24,
      stats,
      rng: createRng(7),
      quotas,
    });
    for (const chapter of [1, 2, 3, 4, 5] as ChapterId[]) {
      const got = picked.filter((q) => q.chapter === chapter).length;
      expect(got, `chapter ${chapter}`).toBe(quotas[chapter]);
    }
  });

  it('is deterministic for a given seed', () => {
    const a = selectQuestions({ pool: pool(), count: 24, stats, rng: createRng(42) });
    const b = selectQuestions({ pool: pool(), count: 24, stats, rng: createRng(42) });
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id));
  });

  it('favours unseen questions over ones already mastered', () => {
    const all = pool(20);
    // Mark the first half of every chapter as answered correctly three times.
    const seen: Record<string, QuestionStat> = {};
    for (const q of all) {
      const index = Number(q.id.split('-')[1]);
      if (index < 10) seen[q.id] = { seen: 3, correct: 3, lastSeenAt: 0 };
    }

    let unseenPicked = 0;
    const runs = 60;
    for (let seed = 0; seed < runs; seed += 1) {
      const picked = selectQuestions({ pool: all, count: 10, stats: seen, rng: createRng(seed) });
      unseenPicked += picked.filter((q) => !(q.id in seen)).length;
    }
    // A neutral selector would land near 50%. The bias should push well past that.
    expect(unseenPicked / (runs * 10)).toBeGreaterThan(0.65);
  });

  it('honours the unseenOnly filter', () => {
    const all = pool(10);
    const seen: Record<string, QuestionStat> = {};
    for (const q of all.slice(0, 25)) seen[q.id] = { seen: 1, correct: 1, lastSeenAt: 0 };

    const picked = selectQuestions({
      pool: all,
      count: 10,
      stats: seen,
      rng: createRng(3),
      unseenOnly: true,
    });
    expect(picked.every((q) => !(q.id in seen))).toBe(true);
  });

  it('avoids excluded questions when there are enough alternatives', () => {
    const all = pool();
    const exclude = new Set(all.slice(0, 20).map((q) => q.id));
    const picked = selectQuestions({
      pool: all,
      count: 24,
      stats,
      rng: createRng(9),
      exclude,
    });
    expect(picked.some((q) => exclude.has(q.id))).toBe(false);
  });

  it('relaxes filters rather than returning a short set', () => {
    const all = pool(3); // 15 questions total
    const everythingSeen: Record<string, QuestionStat> = Object.fromEntries(
      all.map((q) => [q.id, { seen: 1, correct: 1, lastSeenAt: 0 }]),
    );
    const picked = selectQuestions({
      pool: all,
      count: 12,
      stats: everythingSeen,
      rng: createRng(5),
      unseenOnly: true, // nothing matches, so this has to be dropped
    });
    expect(picked).toHaveLength(12);
  });

  it('returns an empty array rather than throwing on an empty pool', () => {
    expect(selectQuestions({ pool: [], count: 24, stats, rng: createRng(1) })).toEqual([]);
  });

  it('caps at the pool size when asked for more than exists', () => {
    const all = pool(1); // 5 questions
    const picked = selectQuestions({ pool: all, count: 24, stats, rng: createRng(1) });
    expect(picked).toHaveLength(5);
  });
});
