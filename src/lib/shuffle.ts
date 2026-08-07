/**
 * Seeded shuffling. Option order is randomised per session, but the seed is
 * stored on the attempt so reviewing a past sitting reproduces exactly the
 * layout that was sat — otherwise "you picked B" means nothing on review.
 */

/** mulberry32 — small, fast, good enough for shuffling a quiz. */
export function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates. Returns a new array; the input is untouched. */
export function shuffle<T>(items: readonly T[], rng: () => number): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0;
}

/**
 * Derives a per-question RNG from the session seed so each question's option
 * order is independent, yet the whole session is reproducible from one number.
 */
export function seedFor(sessionSeed: number, questionId: string): number {
  let hash = sessionSeed >>> 0;
  for (let i = 0; i < questionId.length; i += 1) {
    hash = (Math.imul(hash ^ questionId.charCodeAt(i), 0x01000193) >>> 0) + 1;
  }
  return hash >>> 0;
}
