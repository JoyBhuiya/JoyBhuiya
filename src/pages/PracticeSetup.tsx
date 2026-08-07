import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ChapterId } from '@/types/question';
import { CHAPTERS } from '@/data/chapters';
import { groupByChapter, loadAll } from '@/data/questions';
import { useSession } from '@/state/SessionContext';
import { useProgress } from '@/state/ProgressContext';
import { chapterMastery } from '@/lib/scoring';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const COUNTS = [10, 20, 30] as const;

export default function PracticeSetup() {
  const navigate = useNavigate();
  const { startPractice, starting } = useSession();
  const { state } = useProgress();

  const [chapter, setChapter] = useState<ChapterId | 'all'>('all');
  const [count, setCount] = useState<number>(20);
  const [focus, setFocus] = useState<'mixed' | 'weak' | 'unseen'>('mixed');
  const [byChapter, setByChapter] = useState<Record<ChapterId, string[]> | null>(null);

  useEffect(() => {
    void loadAll().then((all) => setByChapter(groupByChapter(all)));
  }, []);

  const mastery = byChapter ? chapterMastery(state, byChapter) : null;

  const begin = async () => {
    await startPractice({
      chapter: chapter === 'all' ? undefined : chapter,
      count,
      weakOnly: focus === 'weak',
      unseenOnly: focus === 'unseen',
    });
    navigate('/practice/run');
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-ink-faint font-mono text-xs tracking-widest uppercase">Practice</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Build a practice set</h1>
      <p className="text-ink-muted mt-3 leading-relaxed">
        No clock. Each answer is explained as you go, so this is where the learning happens.
      </p>

      <section className="mt-8" aria-labelledby="chapter-heading">
        <h2 id="chapter-heading" className="text-sm font-semibold">
          Which chapter?
        </h2>
        <ul className="mt-3 flex flex-col gap-2">
          <li>
            <button
              type="button"
              onClick={() => setChapter('all')}
              aria-pressed={chapter === 'all'}
              className={cn(
                'flex min-h-14 w-full items-center gap-3 rounded-[--radius] border-2 px-4 py-3 text-left transition-colors',
                chapter === 'all'
                  ? 'border-motorway bg-motorway-soft'
                  : 'border-line bg-surface hover:bg-surface-2',
              )}
            >
              <span className="flex-1">
                <span className="text-ink block text-[0.95rem] font-medium">Everything</span>
                <span className="text-ink-muted block text-xs">
                  Mixed questions from all five chapters
                </span>
              </span>
            </button>
          </li>

          {CHAPTERS.map((meta) => {
            const stats = mastery?.[meta.id];
            const coverage = stats && stats.total > 0 ? stats.seen / stats.total : 0;
            return (
              <li key={meta.id}>
                <button
                  type="button"
                  onClick={() => setChapter(meta.id)}
                  aria-pressed={chapter === meta.id}
                  className={cn(
                    'flex min-h-14 w-full items-center gap-3 rounded-[--radius] border-2 px-4 py-3 text-left transition-colors',
                    chapter === meta.id
                      ? 'border-motorway bg-motorway-soft'
                      : 'border-line bg-surface hover:bg-surface-2',
                  )}
                >
                  <span
                    className="bg-surface-3 text-ink-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-[--radius-sm] font-mono text-sm"
                    aria-hidden="true"
                  >
                    {meta.id}
                  </span>
                  <span className="flex-1">
                    <span className="text-ink block text-[0.95rem] font-medium">{meta.title}</span>
                    <span className="text-ink-muted block text-xs">{meta.blurb}</span>
                  </span>
                  {stats && stats.total > 0 && (
                    <span className="text-ink-faint tnum shrink-0 font-mono text-xs">
                      {Math.round(coverage * 100)}%
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <section aria-labelledby="count-heading">
          <h2 id="count-heading" className="text-sm font-semibold">
            How many questions?
          </h2>
          <div className="mt-3 flex gap-2">
            {COUNTS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCount(option)}
                aria-pressed={count === option}
                className={cn(
                  'tnum min-h-11 flex-1 rounded-[--radius] border-2 font-mono text-sm transition-colors',
                  count === option
                    ? 'border-motorway bg-motorway text-on-motorway'
                    : 'border-line bg-surface text-ink hover:bg-surface-2',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="focus-heading">
          <h2 id="focus-heading" className="text-sm font-semibold">
            What should it pick?
          </h2>
          <div className="mt-3 flex gap-2">
            {(
              [
                ['mixed', 'Mixed'],
                ['weak', 'Weak spots'],
                ['unseen', 'New to me'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFocus(value)}
                aria-pressed={focus === value}
                className={cn(
                  'min-h-11 flex-1 rounded-[--radius] border-2 px-2 text-xs font-medium transition-colors',
                  focus === value
                    ? 'border-motorway bg-motorway text-on-motorway'
                    : 'border-line bg-surface text-ink hover:bg-surface-2',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={begin} disabled={starting}>
        {starting ? 'Picking questions…' : `Start ${count} questions`}
      </Button>
    </div>
  );
}
