import type { ChapterId, Question } from '@/types/question';
import type { Attempt, AttemptAnswer, ProgressState } from '@/types/progress';
import { EXAM_PASS_MARK, EXAM_QUESTION_COUNT } from '@/types/exam';
import { CHAPTERS, getSectionTitle } from '@/data/chapters';

/**
 * A selection is correct only if it matches the answer set exactly — for
 * "select the TWO correct answers", picking one right option is still wrong,
 * which is how the real test marks it.
 */
export function isAnswerCorrect(question: Question, selected: readonly string[]): boolean {
  if (selected.length !== question.correct.length) return false;
  const chosen = new Set(selected);
  return question.correct.every((id) => chosen.has(id));
}

export function passed(score: number, total: number): boolean {
  if (total === EXAM_QUESTION_COUNT) return score >= EXAM_PASS_MARK;
  // Practice sets of other lengths use the same 75% bar.
  return total > 0 && score / total >= EXAM_PASS_MARK / EXAM_QUESTION_COUNT;
}

export interface BreakdownRow {
  key: string;
  title: string;
  correct: number;
  total: number;
  accuracy: number;
}

function summarise(
  answers: readonly AttemptAnswer[],
  keyOf: (a: AttemptAnswer) => string,
  titleOf: (key: string) => string,
): BreakdownRow[] {
  const buckets = new Map<string, { correct: number; total: number }>();
  for (const answer of answers) {
    const key = keyOf(answer);
    const bucket = buckets.get(key) ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (answer.correct) bucket.correct += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.entries()]
    .map(([key, { correct, total }]) => ({
      key,
      title: titleOf(key),
      correct,
      total,
      accuracy: total === 0 ? 0 : correct / total,
    }))
    .sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true }));
}

export function chapterBreakdown(answers: readonly AttemptAnswer[]): BreakdownRow[] {
  return summarise(
    answers,
    (a) => String(a.chapter),
    (key) => CHAPTERS.find((c) => String(c.id) === key)?.shortTitle ?? `Chapter ${key}`,
  );
}

export function sectionBreakdown(answers: readonly AttemptAnswer[]): BreakdownRow[] {
  return summarise(
    answers,
    (a) => a.section,
    (key) => getSectionTitle(key),
  );
}

/**
 * The sections worth revising next: weakest accuracy first, but only where
 * enough questions were asked for the number to mean anything.
 */
export function weakestSections(
  answers: readonly AttemptAnswer[],
  limit = 2,
  minQuestions = 2,
): BreakdownRow[] {
  return sectionBreakdown(answers)
    .filter((row) => row.total >= minQuestions && row.accuracy < 1)
    .sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
    .slice(0, limit);
}

export interface LifetimeStats {
  answered: number;
  correct: number;
  accuracy: number;
  /** Distinct questions seen at least once. */
  seen: number;
}

export function lifetimeStats(state: ProgressState): LifetimeStats {
  let answered = 0;
  let correct = 0;
  let seen = 0;
  for (const stat of Object.values(state.questions)) {
    answered += stat.seen;
    correct += stat.correct;
    if (stat.seen > 0) seen += 1;
  }
  return { answered, correct, accuracy: answered === 0 ? 0 : correct / answered, seen };
}

export function chapterMastery(
  state: ProgressState,
  questionsByChapter: Record<ChapterId, string[]>,
): Record<ChapterId, { seen: number; total: number; accuracy: number }> {
  const result = {} as Record<ChapterId, { seen: number; total: number; accuracy: number }>;
  for (const chapter of CHAPTERS) {
    const ids = questionsByChapter[chapter.id] ?? [];
    let seen = 0;
    let answered = 0;
    let correct = 0;
    for (const id of ids) {
      const stat = state.questions[id];
      if (!stat || stat.seen === 0) continue;
      seen += 1;
      answered += stat.seen;
      correct += stat.correct;
    }
    result[chapter.id] = {
      seen,
      total: ids.length,
      accuracy: answered === 0 ? 0 : correct / answered,
    };
  }
  return result;
}

export type ReadinessBand = 'Not ready yet' | 'Getting there' | 'On track' | 'Test ready';

export interface Readiness {
  score: number;
  band: ReadinessBand;
  /** Why the score is being held down, if it is. */
  limitedBy: string | null;
  examsSat: number;
}

export const READINESS_UNPROVEN_CAP = 60;
const MIN_EXAMS_FOR_FULL_SCORE = 2;
const MIN_PER_CHAPTER_FOR_FULL_SCORE = 20;

export function readinessBand(score: number): ReadinessBand {
  if (score >= 85) return 'Test ready';
  if (score >= 65) return 'On track';
  if (score >= 40) return 'Getting there';
  return 'Not ready yet';
}

/**
 * A single 0–100 readiness number, weighted towards evidence that actually
 * predicts passing: recent mock scores first, then how much of the bank has
 * been seen, then lifetime accuracy.
 *
 * It is deliberately capped until someone has sat two full mocks and covered
 * every chapter. Telling a candidate they are "test ready" off the back of
 * thirty easy practice questions would be actively harmful — this test gates
 * their immigration status.
 */
export function computeReadiness(
  state: ProgressState,
  questionsByChapter: Record<ChapterId, string[]>,
  bankSize: number,
): Readiness {
  const exams = state.attempts.filter((a) => a.mode === 'exam');
  const recent = exams.slice(0, 3);
  const examScore =
    recent.length === 0
      ? 0
      : recent.reduce((sum, a) => sum + (a.total === 0 ? 0 : a.score / a.total), 0) / recent.length;

  const stats = lifetimeStats(state);
  const coverage = bankSize === 0 ? 0 : Math.min(1, stats.seen / bankSize);

  const raw = 0.45 * examScore + 0.35 * coverage + 0.2 * stats.accuracy;
  const score = Math.round(raw * 100);

  const mastery = chapterMastery(state, questionsByChapter);
  const thinChapter = CHAPTERS.find(
    (c) => mastery[c.id].seen < Math.min(MIN_PER_CHAPTER_FOR_FULL_SCORE, mastery[c.id].total),
  );

  let limitedBy: string | null = null;
  if (exams.length < MIN_EXAMS_FOR_FULL_SCORE) {
    const remaining = MIN_EXAMS_FOR_FULL_SCORE - exams.length;
    limitedBy = `Sit ${remaining} more mock exam${remaining === 1 ? '' : 's'} to lift the cap`;
  } else if (thinChapter) {
    limitedBy = `Answer more questions on ${thinChapter.shortTitle} to lift the cap`;
  }

  const capped = limitedBy ? Math.min(score, READINESS_UNPROVEN_CAP) : score;

  return {
    score: capped,
    band: readinessBand(capped),
    limitedBy,
    examsSat: exams.length,
  };
}

export function attemptAccuracy(attempt: Attempt): number {
  return attempt.total === 0 ? 0 : attempt.score / attempt.total;
}
