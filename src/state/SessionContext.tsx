import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ChapterId, Question } from '@/types/question';
import type { Attempt, AttemptAnswer, AttemptMode } from '@/types/progress';
import {
  EXAM_DURATION_MS,
  EXAM_QUESTION_COUNT,
  type ExamSession,
  type SessionQuestion,
} from '@/types/exam';
import { createRng, randomSeed, seedFor, shuffle } from '@/lib/shuffle';
import { examQuotas, selectQuestions } from '@/lib/selection';
import { isAnswerCorrect, passed } from '@/lib/scoring';
import { evaluateBadges } from '@/lib/badges';
import { groupByChapter, loadAll, loadChapter } from '@/data/questions';
import { useProgress } from './ProgressContext';

const SESSION_KEY = 'luk:session:v1';

/** Serialised form — questions are re-hydrated from the bank by id on resume. */
interface StoredSession {
  id: string;
  mode: AttemptMode;
  seed: number;
  chapter?: ChapterId;
  questionIds: string[];
  optionOrders: Record<string, string[]>;
  answers: ExamSession['answers'];
  index: number;
  startedAt: number;
  endsAt?: number;
}

function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeStored(session: ExamSession | null): void {
  try {
    if (!session || session.submittedAt) {
      localStorage.removeItem(SESSION_KEY);
      return;
    }
    const stored: StoredSession = {
      id: session.id,
      mode: session.mode,
      seed: session.seed,
      chapter: session.chapter,
      questionIds: session.questions.map((q) => q.question.id),
      optionOrders: Object.fromEntries(
        session.questions.map((q) => [q.question.id, q.optionOrder]),
      ),
      answers: session.answers,
      index: session.index,
      startedAt: session.startedAt,
      endsAt: session.endsAt,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(stored));
  } catch {
    /* storage unavailable — the session simply won't survive a refresh */
  }
}

function buildSessionQuestions(questions: Question[], seed: number): SessionQuestion[] {
  return questions.map((question) => ({
    question,
    optionOrder:
      // True/false must stay in a fixed order; shuffling it reads as a glitch.
      question.type === 'boolean'
        ? question.options.map((o) => o.id)
        : shuffle(
            question.options.map((o) => o.id),
            createRng(seedFor(seed, question.id)),
          ),
  }));
}

export interface StartPracticeOptions {
  chapter?: ChapterId;
  count: number;
  weakOnly?: boolean;
  unseenOnly?: boolean;
}

interface SessionContextValue {
  session: ExamSession | null;
  starting: boolean;
  startExam: () => Promise<void>;
  startPractice: (options: StartPracticeOptions) => Promise<void>;
  setAnswer: (questionId: string, selected: string[]) => void;
  toggleFlag: (questionId: string) => void;
  goTo: (index: number) => void;
  next: () => void;
  previous: () => void;
  /** Grades the session, writes it to progress, and returns the attempt id. */
  submit: () => string | null;
  abandon: () => void;
  bankSize: number;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { state, commitAttempt } = useProgress();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [starting, setStarting] = useState(false);
  const [bankSize, setBankSize] = useState(0);

  // Kept in a ref so the per-question timer doesn't re-render on every tick.
  const questionEnteredAt = useRef<number>(Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    void loadAll().then((all) => setBankSize(all.length));
  }, []);

  // Restore an interrupted session. An exam whose clock has already expired is
  // discarded rather than resumed — resuming it would hand back a paper with
  // no time left and no way to submit honestly.
  useEffect(() => {
    const stored = readStored();
    if (!stored) return;
    if (stored.endsAt && Date.now() >= stored.endsAt) {
      writeStored(null);
      return;
    }

    let cancelled = false;
    void loadAll().then((all) => {
      if (cancelled) return;
      const byId = new Map(all.map((q) => [q.id, q]));
      const questions = stored.questionIds
        .map((id) => byId.get(id))
        .filter((q): q is Question => Boolean(q))
        .map((question) => ({
          question,
          optionOrder: stored.optionOrders[question.id] ?? question.options.map((o) => o.id),
        }));
      if (questions.length !== stored.questionIds.length) {
        writeStored(null);
        return;
      }
      questionEnteredAt.current = Date.now();
      setSession({
        id: stored.id,
        mode: stored.mode,
        seed: stored.seed,
        chapter: stored.chapter,
        questions,
        answers: stored.answers,
        index: stored.index,
        startedAt: stored.startedAt,
        endsAt: stored.endsAt,
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    writeStored(session);
  }, [session]);

  /** Folds the time spent on the question now on screen into its total. */
  const flushTiming = useCallback((current: ExamSession): ExamSession => {
    const now = Date.now();
    const elapsed = Math.max(0, now - questionEnteredAt.current);
    questionEnteredAt.current = now;
    const questionId = current.questions[current.index]?.question.id;
    if (!questionId) return current;
    const previous = current.answers[questionId] ?? { selected: [], flagged: false, timeMs: 0 };
    return {
      ...current,
      answers: {
        ...current.answers,
        [questionId]: { ...previous, timeMs: previous.timeMs + elapsed },
      },
    };
  }, []);

  const startExam = useCallback(async () => {
    setStarting(true);
    try {
      const pool = await loadAll();
      const seed = randomSeed();
      const previous = stateRef.current.attempts[0];
      const questions = selectQuestions({
        pool,
        count: EXAM_QUESTION_COUNT,
        stats: stateRef.current.questions,
        rng: createRng(seed),
        quotas: examQuotas(EXAM_QUESTION_COUNT),
        exclude: previous ? new Set(previous.answers.map((a) => a.questionId)) : undefined,
      });
      const startedAt = Date.now();
      questionEnteredAt.current = startedAt;
      setSession({
        id: `exam-${startedAt}-${seed}`,
        mode: 'exam',
        seed,
        questions: buildSessionQuestions(questions, seed),
        answers: {},
        index: 0,
        startedAt,
        endsAt: startedAt + EXAM_DURATION_MS,
      });
    } finally {
      setStarting(false);
    }
  }, []);

  const startPractice = useCallback(async (options: StartPracticeOptions) => {
    setStarting(true);
    try {
      const pool = options.chapter ? await loadChapter(options.chapter) : await loadAll();
      const seed = randomSeed();
      const questions = selectQuestions({
        pool,
        count: options.count,
        stats: stateRef.current.questions,
        rng: createRng(seed),
        weakOnly: options.weakOnly,
        unseenOnly: options.unseenOnly,
      });
      const startedAt = Date.now();
      questionEnteredAt.current = startedAt;
      setSession({
        id: `practice-${startedAt}-${seed}`,
        mode: 'practice',
        seed,
        chapter: options.chapter,
        questions: buildSessionQuestions(questions, seed),
        answers: {},
        index: 0,
        startedAt,
      });
    } finally {
      setStarting(false);
    }
  }, []);

  const setAnswer = useCallback((questionId: string, selected: string[]) => {
    setSession((current) => {
      if (!current || current.submittedAt) return current;
      const previous = current.answers[questionId] ?? { selected: [], flagged: false, timeMs: 0 };
      return {
        ...current,
        answers: { ...current.answers, [questionId]: { ...previous, selected } },
      };
    });
  }, []);

  const toggleFlag = useCallback((questionId: string) => {
    setSession((current) => {
      if (!current || current.submittedAt) return current;
      const previous = current.answers[questionId] ?? { selected: [], flagged: false, timeMs: 0 };
      return {
        ...current,
        answers: {
          ...current.answers,
          [questionId]: { ...previous, flagged: !previous.flagged },
        },
      };
    });
  }, []);

  const goTo = useCallback(
    (index: number) => {
      setSession((current) => {
        if (!current) return current;
        const clamped = Math.max(0, Math.min(index, current.questions.length - 1));
        if (clamped === current.index) return current;
        return { ...flushTiming(current), index: clamped };
      });
    },
    [flushTiming],
  );

  const step = useCallback(
    (delta: number) => {
      setSession((current) => {
        if (!current) return current;
        const clamped = Math.max(0, Math.min(current.index + delta, current.questions.length - 1));
        if (clamped === current.index) return current;
        return { ...flushTiming(current), index: clamped };
      });
    },
    [flushTiming],
  );

  const next = useCallback(() => step(1), [step]);
  const previous = useCallback(() => step(-1), [step]);

  const submit = useCallback((): string | null => {
    if (!session || session.submittedAt) return null;

    const finished = flushTiming(session);
    const finishedAt = Date.now();

    const answers: AttemptAnswer[] = finished.questions.map(({ question }) => {
      const answer = finished.answers[question.id] ?? { selected: [], flagged: false, timeMs: 0 };
      return {
        questionId: question.id,
        chapter: question.chapter,
        section: question.section,
        selected: answer.selected,
        correct: isAnswerCorrect(question, answer.selected),
        timeMs: answer.timeMs,
        flagged: answer.flagged,
      };
    });

    const score = answers.filter((a) => a.correct).length;
    const attempt: Attempt = {
      id: finished.id,
      mode: finished.mode,
      finishedAt,
      durationMs: finishedAt - finished.startedAt,
      score,
      total: answers.length,
      passed: passed(score, answers.length),
      seed: finished.seed,
      chapter: finished.chapter,
      answers,
    };

    // Badges are evaluated against the state this attempt will produce, so a
    // badge earned by the final question of a session unlocks immediately.
    void loadAll().then((all) => {
      const projected = { ...stateRef.current, attempts: [attempt, ...stateRef.current.attempts] };
      const earned = evaluateBadges({
        state: projected,
        lastAttempt: attempt,
        bankSize: all.length,
        questionsByChapter: groupByChapter(all),
        now: finishedAt,
      });
      commitAttempt(attempt, earned);
    });

    setSession({ ...finished, submittedAt: finishedAt });
    writeStored(null);
    return attempt.id;
  }, [session, flushTiming, commitAttempt]);

  const abandon = useCallback(() => {
    setSession(null);
    writeStored(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      starting,
      startExam,
      startPractice,
      setAnswer,
      toggleFlag,
      goTo,
      next,
      previous,
      submit,
      abandon,
      bankSize,
    }),
    [
      session,
      starting,
      startExam,
      startPractice,
      setAnswer,
      toggleFlag,
      goTo,
      next,
      previous,
      submit,
      abandon,
      bankSize,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside a SessionProvider');
  return context;
}
