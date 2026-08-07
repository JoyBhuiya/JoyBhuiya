import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Attempt, ProgressState, Settings } from '@/types/progress';
import { createDefaultState, isStorageWritable, load, save, MAX_ATTEMPTS } from '@/lib/storage';
import { recordStudyDay } from '@/lib/streak';
import { localDayKey } from '@/lib/format';

type Action =
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'commitAttempt'; attempt: Attempt; badges: string[]; day: string }
  | { type: 'reset' }
  | { type: 'replace'; state: ProgressState };

function reducer(state: ProgressState, action: Action): ProgressState {
  switch (action.type) {
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };

    case 'commitAttempt': {
      const questions = { ...state.questions };
      for (const answer of action.attempt.answers) {
        const previous = questions[answer.questionId] ?? { seen: 0, correct: 0, lastSeenAt: 0 };
        questions[answer.questionId] = {
          seen: previous.seen + 1,
          correct: previous.correct + (answer.correct ? 1 : 0),
          lastSeenAt: action.attempt.finishedAt,
        };
      }

      const badges = { ...state.badges };
      for (const id of action.badges) {
        if (!(id in badges)) badges[id] = action.attempt.finishedAt;
      }

      return {
        ...state,
        questions,
        badges,
        attempts: [action.attempt, ...state.attempts].slice(0, MAX_ATTEMPTS),
        streak: recordStudyDay(state.streak, action.day),
      };
    }

    case 'reset':
      return createDefaultState();

    case 'replace':
      return action.state;

    default:
      return state;
  }
}

interface ProgressContextValue {
  state: ProgressState;
  updateSettings: (patch: Partial<Settings>) => void;
  /**
   * Records a finished session. `badges` is computed by the caller, which has
   * the question bank in hand, so the reducer stays pure and synchronous.
   */
  commitAttempt: (attempt: Attempt, badges: string[]) => void;
  resetProgress: () => void;
  importState: (state: ProgressState) => void;
  storageWritable: boolean;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [storageWritable, setStorageWritable] = useState(true);
  const firstRender = useRef(true);

  // Debounced so a burst of answers doesn't serialise the whole blob repeatedly.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      save(state);
      setStorageWritable(isStorageWritable());
    }, 400);
    return () => clearTimeout(timer);
  }, [state]);

  // A pending debounce would be lost if the tab closes mid-session.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') save(state);
    };
    document.addEventListener('visibilitychange', flush);
    return () => document.removeEventListener('visibilitychange', flush);
  }, [state]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    dispatch({ type: 'settings', patch });
  }, []);

  const commitAttempt = useCallback((attempt: Attempt, badges: string[]) => {
    dispatch({ type: 'commitAttempt', attempt, badges, day: localDayKey() });
  }, []);

  const resetProgress = useCallback(() => dispatch({ type: 'reset' }), []);
  const importState = useCallback(
    (next: ProgressState) => dispatch({ type: 'replace', state: next }),
    [],
  );

  const value = useMemo(
    () => ({
      state,
      updateSettings,
      commitAttempt,
      resetProgress,
      importState,
      storageWritable,
    }),
    [state, updateSettings, commitAttempt, resetProgress, importState, storageWritable],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);
  if (!context) throw new Error('useProgress must be used inside a ProgressProvider');
  return context;
}
