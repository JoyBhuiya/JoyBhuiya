import { describe, expect, it } from 'vitest';
import { daysBetween, displayedStreak, recordStudyDay } from '@/lib/streak';
import { localDayKey } from '@/lib/format';
import type { StreakState } from '@/types/progress';

const fresh: StreakState = { current: 0, longest: 0, lastStudyDay: null };

describe('daysBetween', () => {
  it('counts consecutive days', () => {
    expect(daysBetween('2026-08-07', '2026-08-08')).toBe(1);
  });

  it('handles a month boundary', () => {
    expect(daysBetween('2026-08-31', '2026-09-01')).toBe(1);
  });

  it('handles a year boundary', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('handles a leap day', () => {
    expect(daysBetween('2028-02-28', '2028-02-29')).toBe(1);
    expect(daysBetween('2028-02-29', '2028-03-01')).toBe(1);
  });

  it('counts across a British Summer Time transition', () => {
    // BST begins on the last Sunday in March. Using UTC dates here would
    // produce an off-by-one and silently break streaks for a day each spring.
    expect(daysBetween('2026-03-28', '2026-03-29')).toBe(1);
    expect(daysBetween('2026-10-24', '2026-10-25')).toBe(1);
  });
});

describe('recordStudyDay', () => {
  it('starts a streak at one', () => {
    expect(recordStudyDay(fresh, '2026-08-07')).toEqual({
      current: 1,
      longest: 1,
      lastStudyDay: '2026-08-07',
    });
  });

  it('extends the streak on the following day', () => {
    const day1 = recordStudyDay(fresh, '2026-08-07');
    expect(recordStudyDay(day1, '2026-08-08').current).toBe(2);
  });

  it('does not count a second session on the same day', () => {
    const day1 = recordStudyDay(fresh, '2026-08-07');
    expect(recordStudyDay(day1, '2026-08-07')).toBe(day1);
  });

  it('resets to one after a missed day', () => {
    const day1 = recordStudyDay(fresh, '2026-08-07');
    const day2 = recordStudyDay(day1, '2026-08-08');
    expect(recordStudyDay(day2, '2026-08-10').current).toBe(1);
  });

  it('remembers the longest streak after a reset', () => {
    let state = recordStudyDay(fresh, '2026-08-01');
    state = recordStudyDay(state, '2026-08-02');
    state = recordStudyDay(state, '2026-08-03');
    state = recordStudyDay(state, '2026-08-10');
    expect(state.current).toBe(1);
    expect(state.longest).toBe(3);
  });
});

describe('displayedStreak', () => {
  it('shows the streak when you studied today', () => {
    const state = { current: 5, longest: 5, lastStudyDay: '2026-08-07' };
    expect(displayedStreak(state, '2026-08-07')).toBe(5);
  });

  it('still shows the streak the day after, since today is not over', () => {
    const state = { current: 5, longest: 5, lastStudyDay: '2026-08-07' };
    expect(displayedStreak(state, '2026-08-08')).toBe(5);
  });

  it('shows zero once the run is genuinely broken', () => {
    const state = { current: 5, longest: 5, lastStudyDay: '2026-08-07' };
    expect(displayedStreak(state, '2026-08-09')).toBe(0);
  });

  it('shows zero when nothing has been studied', () => {
    expect(displayedStreak(fresh)).toBe(0);
  });
});

describe('localDayKey', () => {
  it('formats as YYYY-MM-DD in local time', () => {
    expect(localDayKey(new Date(2026, 7, 7))).toBe('2026-08-07');
  });

  it('pads single-digit months and days', () => {
    expect(localDayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses the local date late at night, not the UTC one', () => {
    // 23:30 local on the 7th is the 8th in UTC for anywhere east of Greenwich.
    // Using toISOString() here would break streaks for those users.
    expect(localDayKey(new Date(2026, 7, 7, 23, 30))).toBe('2026-08-07');
  });
});
