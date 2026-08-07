import type { Attempt, ProgressState } from '@/types/progress';
import type { ChapterId } from '@/types/question';
import { CHAPTERS } from '@/data/chapters';
import { lifetimeStats } from './scoring';

export interface BadgeContext {
  state: ProgressState;
  lastAttempt?: Attempt;
  bankSize: number;
  questionsByChapter: Record<ChapterId, string[]>;
  now: number;
}

export type BadgeTier = 'bronze' | 'silver' | 'gold';

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  tier: BadgeTier;
  /** Hidden until earned. */
  secret?: boolean;
  /** Drives the progress bar on locked badges. */
  progress?: (ctx: BadgeContext) => { current: number; target: number };
  check: (ctx: BadgeContext) => boolean;
}

function examAttempts(state: ProgressState): Attempt[] {
  return state.attempts.filter((a) => a.mode === 'exam');
}

function countAnswered(state: ProgressState): number {
  return lifetimeStats(state).answered;
}

export const BADGES: readonly BadgeDef[] = [
  {
    id: 'first-steps',
    name: 'First steps',
    description: 'Answer your first question.',
    tier: 'bronze',
    check: (c) => countAnswered(c.state) >= 1,
  },
  {
    id: 'century',
    name: 'Century',
    description: 'Answer 100 questions.',
    tier: 'bronze',
    progress: (c) => ({ current: Math.min(countAnswered(c.state), 100), target: 100 }),
    check: (c) => countAnswered(c.state) >= 100,
  },
  {
    id: 'marathon',
    name: 'Marathon',
    description: 'Answer 500 questions.',
    tier: 'silver',
    progress: (c) => ({ current: Math.min(countAnswered(c.state), 500), target: 500 }),
    check: (c) => countAnswered(c.state) >= 500,
  },
  {
    id: 'completionist',
    name: 'Completionist',
    description: 'See every question in the bank at least once.',
    tier: 'gold',
    progress: (c) => ({ current: lifetimeStats(c.state).seen, target: c.bankSize }),
    check: (c) => c.bankSize > 0 && lifetimeStats(c.state).seen >= c.bankSize,
  },
  {
    id: 'first-mock',
    name: 'Dress rehearsal',
    description: 'Complete a full timed mock exam.',
    tier: 'bronze',
    check: (c) => examAttempts(c.state).length >= 1,
  },
  {
    id: 'first-pass',
    name: 'Pass mark',
    description: 'Score 18 or more on a mock exam.',
    tier: 'silver',
    check: (c) => examAttempts(c.state).some((a) => a.passed),
  },
  {
    id: 'full-house',
    name: 'Full house',
    description: 'Score 24 out of 24 on a mock exam.',
    tier: 'gold',
    check: (c) => examAttempts(c.state).some((a) => a.score === a.total && a.total > 0),
  },
  {
    id: 'untouchable',
    name: 'Untouchable',
    description: 'Pass three mock exams in a row.',
    tier: 'gold',
    check: (c) => {
      const exams = examAttempts(c.state);
      return exams.length >= 3 && exams.slice(0, 3).every((a) => a.passed);
    },
  },
  {
    id: 'comeback',
    name: 'Comeback',
    description: 'Pass a mock exam straight after failing one.',
    tier: 'silver',
    check: (c) => {
      const exams = examAttempts(c.state);
      for (let i = 0; i < exams.length - 1; i += 1) {
        if (exams[i].passed && !exams[i + 1].passed) return true;
      }
      return false;
    },
  },
  {
    id: 'fast-track',
    name: 'Fast track',
    description: 'Pass a mock exam with 15 minutes or more to spare.',
    tier: 'silver',
    check: (c) =>
      examAttempts(c.state).some((a) => a.passed && a.durationMs <= 30 * 60 * 1000),
  },
  {
    id: 'all-rounder',
    name: 'All-rounder',
    description: 'Reach 75% accuracy in all five chapters.',
    tier: 'gold',
    check: (c) =>
      CHAPTERS.every((chapter) => {
        const ids = c.questionsByChapter[chapter.id] ?? [];
        let seen = 0;
        let answered = 0;
        let correct = 0;
        for (const id of ids) {
          const stat = c.state.questions[id];
          if (!stat || stat.seen === 0) continue;
          seen += 1;
          answered += stat.seen;
          correct += stat.correct;
        }
        return seen >= 20 && answered > 0 && correct / answered >= 0.75;
      }),
  },
  {
    id: 'streak-3',
    name: 'Three in a row',
    description: 'Study on three consecutive days.',
    tier: 'bronze',
    progress: (c) => ({ current: Math.min(c.state.streak.longest, 3), target: 3 }),
    check: (c) => c.state.streak.longest >= 3,
  },
  {
    id: 'streak-7',
    name: 'Full week',
    description: 'Study on seven consecutive days.',
    tier: 'silver',
    progress: (c) => ({ current: Math.min(c.state.streak.longest, 7), target: 7 }),
    check: (c) => c.state.streak.longest >= 7,
  },
  {
    id: 'streak-30',
    name: 'Month on month',
    description: 'Study on thirty consecutive days.',
    tier: 'gold',
    progress: (c) => ({ current: Math.min(c.state.streak.longest, 30), target: 30 }),
    check: (c) => c.state.streak.longest >= 30,
  },
  {
    id: 'night-owl',
    name: 'Night owl',
    description: 'Finish a session between midnight and 4am.',
    tier: 'bronze',
    secret: true,
    check: (c) => {
      if (!c.lastAttempt) return false;
      const hour = new Date(c.lastAttempt.finishedAt).getHours();
      return hour >= 0 && hour < 4;
    },
  },
  {
    id: 'early-bird',
    name: 'Early bird',
    description: 'Finish a session between 5am and 7am.',
    tier: 'bronze',
    secret: true,
    check: (c) => {
      if (!c.lastAttempt) return false;
      const hour = new Date(c.lastAttempt.finishedAt).getHours();
      return hour >= 5 && hour < 7;
    },
  },
];

/**
 * Returns badge ids newly earned by this context. Already-earned badges are
 * filtered out, so calling this repeatedly is idempotent and a badge can never
 * be awarded twice.
 */
export function evaluateBadges(ctx: BadgeContext): string[] {
  return BADGES.filter((badge) => !(badge.id in ctx.state.badges) && badge.check(ctx)).map(
    (badge) => badge.id,
  );
}

export function getBadge(id: string): BadgeDef | undefined {
  return BADGES.find((b) => b.id === id);
}
