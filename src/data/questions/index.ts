import type { ChapterId, Question } from '@/types/question';

type Loader = () => Promise<{ questions: Question[] }>;

/**
 * Shard loaders must be literal dynamic imports or Rollup cannot statically
 * analyse them into separate chunks, and the whole bank ends up in the initial
 * bundle. Chapters are split further where a single file would get unwieldy.
 */
const SHARDS: Record<ChapterId, Loader[]> = {
  1: [() => import('./ch1')],
  2: [() => import('./ch2')],
  3: [
    () => import('./ch3a'),
    () => import('./ch3b'),
    () => import('./ch3c'),
    () => import('./ch3d'),
    () => import('./ch3e'),
  ],
  4: [
    () => import('./ch4a'),
    () => import('./ch4b'),
    () => import('./ch4c'),
    () => import('./ch4d'),
  ],
  5: [
    () => import('./ch5a'),
    () => import('./ch5b'),
    () => import('./ch5c'),
    () => import('./ch5d'),
  ],
};

const cache = new Map<ChapterId, Question[]>();

export async function loadChapter(chapter: ChapterId): Promise<Question[]> {
  const cached = cache.get(chapter);
  if (cached) return cached;

  const modules = await Promise.all(SHARDS[chapter].map((load) => load()));
  const questions = modules.flatMap((module) => module.questions);
  cache.set(chapter, questions);
  return questions;
}

/**
 * The whole bank. A mock exam draws from every chapter, so there is no way
 * around loading all of it — but the service worker precaches every shard, so
 * after the first visit this resolves from cache and works offline.
 */
export async function loadAll(): Promise<Question[]> {
  const chapters = await Promise.all(
    (Object.keys(SHARDS) as unknown as string[]).map((key) =>
      loadChapter(Number(key) as ChapterId),
    ),
  );
  return chapters.flat();
}

export function groupByChapter(questions: Question[]): Record<ChapterId, string[]> {
  const result = { 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<ChapterId, string[]>;
  for (const question of questions) result[question.chapter].push(question.id);
  return result;
}
