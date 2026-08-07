import type { StreakState } from '@/types/progress';
import { localDayKey } from './format';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDayKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** Whole calendar days between two day keys. Negative if `b` precedes `a`. */
export function daysBetween(a: string, b: string): number {
  const from = parseDayKey(a);
  const to = parseDayKey(b);
  if (!from || !to) return Number.NaN;
  return Math.round((to.getTime() - from.getTime()) / DAY_MS);
}

/**
 * Records a study session on `today`.
 *
 * Same day → no change (studying twice doesn't earn two days).
 * Next day → the streak extends.
 * Any longer gap → the streak restarts at 1.
 */
export function recordStudyDay(streak: StreakState, today = localDayKey()): StreakState {
  if (streak.lastStudyDay === today) return streak;

  const gap = streak.lastStudyDay ? daysBetween(streak.lastStudyDay, today) : Number.NaN;
  const current = gap === 1 ? streak.current + 1 : 1;

  return {
    current,
    longest: Math.max(streak.longest, current),
    lastStudyDay: today,
  };
}

/**
 * A streak shown on the dashboard should reflect reality: if the last study day
 * was before yesterday, the run is already broken and displaying the old number
 * would be a lie.
 */
export function displayedStreak(streak: StreakState, today = localDayKey()): number {
  if (!streak.lastStudyDay) return 0;
  const gap = daysBetween(streak.lastStudyDay, today);
  return gap === 0 || gap === 1 ? streak.current : 0;
}
