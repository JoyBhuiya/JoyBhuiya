import type { ChapterId, Question } from '@/types/question';
import type { QuestionStat } from '@/types/progress';
import { CHAPTERS } from '@/data/chapters';

const UNSEEN_BOOST = 2.5;
const MASTERED_DAMP = 0.4;
const MASTERY_STREAK = 3;
const RECENT_MS = 6 * 60 * 60 * 1000;
const FULL_RECOVERY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Splits `count` across chapters by weight using the largest-remainder method,
 * so the quotas always sum to exactly `count`. Rounding each weight
 * independently gives 23 or 25 questions for a 24-question exam roughly half
 * the time, which would be an obvious bug in an exam-realistic mock.
 */
export function allocateQuotas(
  count: number,
  weights: Record<ChapterId, number>,
): Record<ChapterId, number> {
  const ids = CHAPTERS.map((c) => c.id);
  const totalWeight = ids.reduce((sum, id) => sum + (weights[id] ?? 0), 0);
  if (totalWeight <= 0) {
    const even = Math.floor(count / ids.length);
    const quotas = Object.fromEntries(ids.map((id) => [id, even])) as Record<ChapterId, number>;
    let remainder = count - even * ids.length;
    for (const id of ids) {
      if (remainder <= 0) break;
      quotas[id] += 1;
      remainder -= 1;
    }
    return quotas;
  }

  const exact = ids.map((id) => ({ id, value: (count * (weights[id] ?? 0)) / totalWeight }));
  const quotas = Object.fromEntries(exact.map((e) => [e.id, Math.floor(e.value)])) as Record<
    ChapterId,
    number
  >;
  let assigned = exact.reduce((sum, e) => sum + Math.floor(e.value), 0);

  const byRemainder = exact
    .map((e) => ({ id: e.id, remainder: e.value - Math.floor(e.value) }))
    .sort((a, b) => b.remainder - a.remainder || a.id - b.id);

  let i = 0;
  while (assigned < count && byRemainder.length > 0) {
    quotas[byRemainder[i % byRemainder.length].id] += 1;
    assigned += 1;
    i += 1;
  }
  return quotas;
}

/** Questions seen very recently are damped, recovering to full weight over a week. */
function recencyDecay(lastSeenAt: number | undefined, now: number): number {
  if (!lastSeenAt) return 1;
  const age = now - lastSeenAt;
  if (age >= FULL_RECOVERY_MS) return 1;
  if (age <= RECENT_MS) return 0.25;
  const span = FULL_RECOVERY_MS - RECENT_MS;
  return 0.25 + 0.75 * ((age - RECENT_MS) / span);
}

/**
 * How badly this question deserves to come up next. Higher is likelier.
 *
 * Unseen questions lead, then questions the candidate keeps getting wrong.
 * Questions answered right several times running are suppressed but never
 * eliminated — the bank is for revising, not just for finding gaps.
 */
export function weightFor(
  stat: QuestionStat | undefined,
  now: number,
  pickedFromSection: number,
): number {
  let weight = 1;

  if (!stat || stat.seen === 0) {
    weight *= UNSEEN_BOOST;
  } else {
    const accuracy = stat.correct / stat.seen;
    weight *= 1 + 2 * (1 - accuracy);
    weight *= recencyDecay(stat.lastSeenAt, now);
    if (accuracy === 1 && stat.seen >= MASTERY_STREAK) weight *= MASTERED_DAMP;
  }

  // Spread across sections so a history block isn't eight Tudor questions.
  weight *= 1 / (1 + 0.6 * pickedFromSection);

  return Math.max(weight, 0.001);
}

/**
 * Efraimidis–Spirakis A-Res: sample k items proportional to weight without
 * replacement in a single pass, by taking the top k of `random ** (1 / weight)`.
 * Repeated roulette-wheel draws with rejection would be slower and subtly
 * biased once items are removed.
 */
function weightedSample<T>(
  items: readonly T[],
  k: number,
  weightOf: (item: T) => number,
  rng: () => number,
): T[] {
  return items
    .map((item) => ({ item, key: Math.pow(rng(), 1 / weightOf(item)) }))
    .sort((a, b) => b.key - a.key)
    .slice(0, k)
    .map((entry) => entry.item);
}

export interface SelectionOptions {
  pool: Question[];
  count: number;
  stats: Record<string, QuestionStat>;
  rng: () => number;
  now?: number;
  /** Per-chapter quotas. Omit to draw from the whole pool at once. */
  quotas?: Record<ChapterId, number>;
  /** Ids to avoid — typically everything from the previous attempt. */
  exclude?: ReadonlySet<string>;
  /** Restrict to questions never answered correctly. */
  weakOnly?: boolean;
  /** Restrict to questions never seen. */
  unseenOnly?: boolean;
}

function drawFrom(
  pool: Question[],
  count: number,
  stats: Record<string, QuestionStat>,
  rng: () => number,
  now: number,
): Question[] {
  const picked: Question[] = [];
  const sectionCounts = new Map<string, number>();
  let remaining = pool.slice();

  // Draw greedily so the section-spread penalty responds to what has already
  // been picked. Oversampling then trimming would ignore that feedback.
  while (picked.length < count && remaining.length > 0) {
    const [chosen] = weightedSample(
      remaining,
      1,
      (q) => weightFor(stats[q.id], now, sectionCounts.get(q.section) ?? 0),
      rng,
    );
    if (!chosen) break;
    picked.push(chosen);
    sectionCounts.set(chosen.section, (sectionCounts.get(chosen.section) ?? 0) + 1);
    remaining = remaining.filter((q) => q.id !== chosen.id);
  }

  return picked;
}

/**
 * Picks `count` questions. Never returns duplicates, and never throws — if the
 * filters are too tight to fill the request, it relaxes them in order
 * (exclusions first, then the weak/unseen filter, then quotas) rather than
 * handing back a short exam.
 */
export function selectQuestions(options: SelectionOptions): Question[] {
  const { pool, count, stats, rng, quotas, exclude, weakOnly, unseenOnly } = options;
  const now = options.now ?? Date.now();

  if (count <= 0 || pool.length === 0) return [];

  const matchesFilter = (q: Question): boolean => {
    const stat = stats[q.id];
    if (unseenOnly) return !stat || stat.seen === 0;
    if (weakOnly) return !stat || stat.seen === 0 || stat.correct < stat.seen;
    return true;
  };

  // Progressively looser candidate sets. The first that can fill the request wins.
  const tiers: Question[][] = [
    pool.filter((q) => matchesFilter(q) && !exclude?.has(q.id)),
    pool.filter((q) => matchesFilter(q)),
    pool.filter((q) => !exclude?.has(q.id)),
    pool,
  ];
  const candidates = tiers.find((tier) => tier.length >= count) ?? pool;

  if (!quotas) return drawFrom(candidates, Math.min(count, candidates.length), stats, rng, now);

  const picked: Question[] = [];
  const used = new Set<string>();

  for (const chapter of CHAPTERS) {
    const quota = quotas[chapter.id] ?? 0;
    if (quota <= 0) continue;
    const chapterPool = candidates.filter((q) => q.chapter === chapter.id && !used.has(q.id));
    for (const question of drawFrom(chapterPool, quota, stats, rng, now)) {
      picked.push(question);
      used.add(question.id);
    }
  }

  // A thin chapter can leave the exam short. Backfill from everything else so
  // the candidate always sits a full-length paper.
  if (picked.length < count) {
    const rest = candidates.filter((q) => !used.has(q.id));
    for (const question of drawFrom(rest, count - picked.length, stats, rng, now)) {
      picked.push(question);
      used.add(question.id);
    }
  }

  return picked.slice(0, count);
}

export function examQuotas(count: number): Record<ChapterId, number> {
  const weights = Object.fromEntries(CHAPTERS.map((c) => [c.id, c.examWeight])) as Record<
    ChapterId,
    number
  >;
  return allocateQuotas(count, weights);
}
