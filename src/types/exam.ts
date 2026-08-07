import type { ChapterId, Question } from './question';
import type { AttemptMode } from './progress';

export const EXAM_QUESTION_COUNT = 24;
export const EXAM_PASS_MARK = 18;
export const EXAM_DURATION_MS = 45 * 60 * 1000;

export interface SessionQuestion {
  question: Question;
  /** Option ids in the order they are shown, shuffled per session. */
  optionOrder: string[];
}

export interface SessionAnswerState {
  selected: string[];
  flagged: boolean;
  /** Accumulated ms this question has been on screen. */
  timeMs: number;
}

export interface ExamSession {
  id: string;
  mode: AttemptMode;
  seed: number;
  chapter?: ChapterId;
  questions: SessionQuestion[];
  answers: Record<string, SessionAnswerState>;
  index: number;
  startedAt: number;
  /** Absolute epoch ms the timer expires. Undefined for untimed practice. */
  endsAt?: number;
  /** Set once the candidate has submitted; the session becomes read-only. */
  submittedAt?: number;
}
