import type { ProgressState, Settings } from '@/types/progress';

export const STORAGE_KEY = 'luk:v1';
export const CURRENT_VERSION = 1;

/** Attempts are capped so a heavy user can't fill the localStorage quota. */
export const MAX_ATTEMPTS = 100;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  instantFeedback: true,
  timerAnnouncements: true,
};

export function createDefaultState(): ProgressState {
  return {
    version: CURRENT_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    questions: {},
    attempts: [],
    streak: { current: 0, longest: 0, lastStudyDay: null },
    badges: {},
  };
}

/**
 * True once a write has failed. Safari private mode and a full quota both throw
 * on setItem; when that happens the app keeps working from memory rather than
 * crashing, and the UI can mention it once.
 */
let storageWritable = true;

export function isStorageWritable(): boolean {
  return storageWritable;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Coerces whatever is in localStorage into a valid ProgressState. Anything
 * unrecognised is replaced with its default rather than thrown away wholesale —
 * a single corrupted field should not cost someone their whole study history.
 */
export function normalise(raw: unknown): ProgressState {
  const base = createDefaultState();
  if (!isRecord(raw)) return base;

  const settings = isRecord(raw.settings) ? raw.settings : {};
  const theme = settings.theme;
  const streak = isRecord(raw.streak) ? raw.streak : {};

  return {
    version: CURRENT_VERSION,
    settings: {
      theme: theme === 'light' || theme === 'dark' || theme === 'system' ? theme : 'system',
      instantFeedback:
        typeof settings.instantFeedback === 'boolean'
          ? settings.instantFeedback
          : DEFAULT_SETTINGS.instantFeedback,
      timerAnnouncements:
        typeof settings.timerAnnouncements === 'boolean'
          ? settings.timerAnnouncements
          : DEFAULT_SETTINGS.timerAnnouncements,
    },
    questions: isRecord(raw.questions)
      ? Object.fromEntries(
          Object.entries(raw.questions).flatMap(([id, stat]) => {
            if (!isRecord(stat)) return [];
            const seen = typeof stat.seen === 'number' ? stat.seen : 0;
            const correct = typeof stat.correct === 'number' ? stat.correct : 0;
            const lastSeenAt = typeof stat.lastSeenAt === 'number' ? stat.lastSeenAt : 0;
            return [[id, { seen, correct, lastSeenAt }]] as const;
          }),
        )
      : {},
    attempts: Array.isArray(raw.attempts)
      ? (raw.attempts.filter(
          (a) => isRecord(a) && typeof a.id === 'string' && Array.isArray(a.answers),
        ) as ProgressState['attempts'])
      : [],
    streak: {
      current: typeof streak.current === 'number' ? streak.current : 0,
      longest: typeof streak.longest === 'number' ? streak.longest : 0,
      lastStudyDay: typeof streak.lastStudyDay === 'string' ? streak.lastStudyDay : null,
    },
    badges: isRecord(raw.badges)
      ? Object.fromEntries(
          Object.entries(raw.badges).filter(
            (entry): entry is [string, number] => typeof entry[1] === 'number',
          ),
        )
      : {},
  };
}

/**
 * Runs a stored payload forward through the version chain. Only v1 exists so
 * far; the chain is here so a future schema change has an obvious home and
 * existing users don't silently lose their progress.
 */
export function migrate(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  // No migrations yet — future steps go here, each bumping `version` by one.
  return raw;
}

export function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    return normalise(migrate(JSON.parse(raw)));
  } catch {
    // Unparseable payload. Start clean rather than leaving the app unusable.
    return createDefaultState();
  }
}

export function save(state: ProgressState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    storageWritable = true;
  } catch {
    storageWritable = false;
  }
}

export function clearAll(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing useful to do */
  }
}

/** Exported for tests, which need to reset the module-level flag. */
export function __resetStorageWritable(): void {
  storageWritable = true;
}
