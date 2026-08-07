export type ChapterId = 1 | 2 | 3 | 4 | 5;

/**
 * Mirrors the formats the real test uses:
 *  - `single`  — pick one of four
 *  - `multi`   — "select the TWO correct answers"
 *  - `boolean` — "is this statement true or false?"
 */
export type QuestionType = 'single' | 'multi' | 'boolean';

export type Difficulty = 1 | 2 | 3;

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  /** Stable and never reused — per-question stats are keyed on it. */
  id: string;
  chapter: ChapterId;
  /** Handbook section number, e.g. '3.3'. */
  section: string;
  /** Human-readable section title, e.g. 'The Tudors and Stuarts'. */
  topic: string;
  type: QuestionType;
  stem: string;
  options: QuestionOption[];
  /** Option ids. One entry for single/boolean, exactly two for multi. */
  correct: string[];
  /** Always populated. Getting a question wrong is the moment someone learns. */
  explanation: string;
  difficulty: Difficulty;
}

export interface SectionMeta {
  id: string;
  title: string;
  blurb: string;
}

export interface ChapterMeta {
  id: ChapterId;
  title: string;
  shortTitle: string;
  blurb: string;
  /** Share of a 24-question mock exam, mirroring the real test's emphasis. */
  examWeight: number;
  sections: SectionMeta[];
}
