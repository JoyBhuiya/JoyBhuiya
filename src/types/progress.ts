import type { ChapterId } from './question';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePreference;
  /** Practice mode only: reveal the answer as soon as one is chosen. */
  instantFeedback: boolean;
  /** Read out the timer at the 10, 5 and 1 minute marks. */
  timerAnnouncements: boolean;
}

export interface QuestionStat {
  seen: number;
  correct: number;
  /** Epoch ms. Used to damp questions that came up recently. */
  lastSeenAt: number;
}

export type AttemptMode = 'exam' | 'practice';

export interface AttemptAnswer {
  questionId: string;
  chapter: ChapterId;
  section: string;
  /** Option ids the candidate selected. Empty means unanswered. */
  selected: string[];
  correct: boolean;
  /** Milliseconds spent with this question on screen. */
  timeMs: number;
  flagged: boolean;
}

export interface Attempt {
  id: string;
  mode: AttemptMode;
  /** Epoch ms the attempt was submitted. */
  finishedAt: number;
  /** Total elapsed time in ms. */
  durationMs: number;
  score: number;
  total: number;
  passed: boolean;
  /** Seed used to shuffle options, so a replay looks identical to the sitting. */
  seed: number;
  /** Present for practice attempts scoped to one chapter. */
  chapter?: ChapterId;
  answers: AttemptAnswer[];
}

export interface StreakState {
  current: number;
  longest: number;
  /** Local calendar day, 'YYYY-MM-DD'. */
  lastStudyDay: string | null;
}

export interface ProgressState {
  version: 1;
  settings: Settings;
  questions: Record<string, QuestionStat>;
  attempts: Attempt[];
  streak: StreakState;
  /** Badge id → epoch ms it was unlocked. */
  badges: Record<string, number>;
}
