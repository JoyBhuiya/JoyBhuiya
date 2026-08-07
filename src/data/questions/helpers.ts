import type { ChapterId, Difficulty, Question } from '@/types/question';

const LETTERS = ['a', 'b', 'c', 'd', 'e'] as const;

/**
 * Builders for the question bank. Authoring 900 questions as raw object
 * literals invites transposed fields and mismatched answer ids; these keep each
 * entry to a single readable call and make the correct answer positional.
 */

function build(
  id: string,
  section: string,
  topic: string,
  type: Question['type'],
  stem: string,
  optionTexts: readonly string[],
  correctIndices: readonly number[],
  explanation: string,
  difficulty: Difficulty,
): Question {
  const chapter = Number(section.split('.')[0]) as ChapterId;
  return {
    id,
    chapter,
    section,
    topic,
    type,
    stem,
    options: optionTexts.map((text, index) => ({ id: LETTERS[index], text })),
    correct: correctIndices.map((index) => LETTERS[index]),
    explanation,
    difficulty,
  };
}

/** Pick one of four. The commonest form on the real test. */
export function single(
  id: string,
  section: string,
  topic: string,
  stem: string,
  options: readonly [string, string, string, string],
  correctIndex: 0 | 1 | 2 | 3,
  explanation: string,
  difficulty: Difficulty = 2,
): Question {
  return build(id, section, topic, 'single', stem, options, [correctIndex], explanation, difficulty);
}

/** "Is this statement true or false?" */
export function bool(
  id: string,
  section: string,
  topic: string,
  stem: string,
  answer: boolean,
  explanation: string,
  difficulty: Difficulty = 2,
): Question {
  return build(
    id,
    section,
    topic,
    'boolean',
    stem,
    ['True', 'False'],
    [answer ? 0 : 1],
    explanation,
    difficulty,
  );
}

/** "Select the TWO correct answers." Marked all-or-nothing, as on the real test. */
export function multi(
  id: string,
  section: string,
  topic: string,
  stem: string,
  options: readonly [string, string, string, string],
  correctIndices: readonly [number, number],
  explanation: string,
  difficulty: Difficulty = 3,
): Question {
  return build(id, section, topic, 'multi', stem, options, correctIndices, explanation, difficulty);
}
