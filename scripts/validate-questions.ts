/**
 * Content gate. Runs in CI and fails the build on anything that would show a
 * candidate a broken or unanswerable question.
 *
 * This is the only automated defence against quality decay across the many
 * commits it takes to author the bank, so it errs towards strictness.
 */
import { readdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import type { Question } from '../src/types/question.ts';
import { CHAPTERS } from '../src/data/chapters.ts';

const here = dirname(fileURLToPath(import.meta.url));
const questionsDir = join(here, '..', 'src', 'data', 'questions');

const errors: string[] = [];
const warnings: string[] = [];

function fail(id: string, message: string) {
  errors.push(`${id}: ${message}`);
}

const shardFiles = readdirSync(questionsDir)
  .filter((name) => /^ch\d[a-z]?\.ts$/.test(name))
  .sort();

const all: Question[] = [];

for (const file of shardFiles) {
  const module: { questions?: Question[] } = await import(
    pathToFileURL(join(questionsDir, file)).href
  );
  if (!Array.isArray(module.questions)) {
    errors.push(`${file}: does not export a "questions" array`);
    continue;
  }
  all.push(...module.questions);
}

const seenIds = new Set<string>();
const normalisedStems = new Map<string, string>();
const validSections = new Set(CHAPTERS.flatMap((c) => c.sections.map((s) => s.id)));

for (const q of all) {
  if (seenIds.has(q.id)) fail(q.id, 'duplicate question id');
  seenIds.add(q.id);

  if (!q.stem?.trim()) fail(q.id, 'empty stem');
  if (!q.explanation || q.explanation.trim().length < 20) {
    fail(q.id, 'explanation is missing or too short to teach anything');
  }
  if (!validSections.has(q.section)) fail(q.id, `unknown section "${q.section}"`);
  if (q.chapter !== Number(q.section.split('.')[0])) {
    fail(q.id, `chapter ${q.chapter} does not match section ${q.section}`);
  }

  const optionIds = new Set(q.options.map((o) => o.id));
  if (optionIds.size !== q.options.length) fail(q.id, 'duplicate option ids');
  if (q.options.some((o) => !o.text?.trim())) fail(q.id, 'blank option text');

  const optionTexts = new Set(q.options.map((o) => o.text.trim().toLowerCase()));
  if (optionTexts.size !== q.options.length) fail(q.id, 'two options have identical text');

  for (const answer of q.correct) {
    if (!optionIds.has(answer)) fail(q.id, `correct answer "${answer}" is not one of the options`);
  }

  if (q.type === 'single' && q.correct.length !== 1) {
    fail(q.id, `single-answer question has ${q.correct.length} correct answers`);
  }
  if (q.type === 'multi' && q.correct.length !== 2) {
    fail(q.id, `select-two question has ${q.correct.length} correct answers`);
  }
  if (q.type === 'boolean') {
    if (q.correct.length !== 1) fail(q.id, 'true/false question must have one answer');
    if (q.options.length !== 2) fail(q.id, 'true/false question must have exactly two options');
    if (q.options[0].text !== 'True' || q.options[1].text !== 'False') {
      fail(q.id, 'true/false options must read exactly "True" then "False"');
    }
  }
  if (q.type !== 'boolean' && q.options.length !== 4) {
    fail(q.id, `expected 4 options, found ${q.options.length}`);
  }

  // Near-duplicate detection: same stem once punctuation and case are stripped.
  const key = q.stem.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
  const existing = normalisedStems.get(key);
  if (existing) fail(q.id, `stem duplicates ${existing}`);
  else normalisedStems.set(key, q.id);
}

// Per-chapter counts, so an unfinished chapter is visible rather than silent.
const byChapter = new Map<number, number>();
for (const q of all) byChapter.set(q.chapter, (byChapter.get(q.chapter) ?? 0) + 1);

const typeCounts = new Map<string, number>();
for (const q of all) typeCounts.set(q.type, (typeCounts.get(q.type) ?? 0) + 1);

console.log(`Question bank: ${all.length} questions across ${shardFiles.length} shards\n`);
for (const chapter of CHAPTERS) {
  const count = byChapter.get(chapter.id) ?? 0;
  const sections = new Set(all.filter((q) => q.chapter === chapter.id).map((q) => q.section));
  const missing = chapter.sections.filter((s) => !sections.has(s.id));
  console.log(
    `  Chapter ${chapter.id}  ${String(count).padStart(4)} questions  ` +
      `${sections.size}/${chapter.sections.length} sections covered`,
  );
  if (count === 0) warnings.push(`chapter ${chapter.id} has no questions yet`);
  else if (missing.length > 0) {
    warnings.push(
      `chapter ${chapter.id} has no questions for section${missing.length === 1 ? '' : 's'} ` +
        missing.map((s) => s.id).join(', '),
    );
  }
}

console.log('');
for (const [type, count] of [...typeCounts].sort()) {
  console.log(`  ${type.padEnd(8)} ${String(count).padStart(4)}  ${Math.round((count / all.length) * 100)}%`);
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  for (const warning of warnings) console.log(`  ! ${warning}`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} error${errors.length === 1 ? '' : 's'}:`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  process.exit(1);
}

console.log('\nAll checks passed.');
