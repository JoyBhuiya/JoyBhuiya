import type { ExamSession } from '@/types/exam';
import { cn } from '@/lib/cn';

/**
 * The jump-to-question grid. Full-size targets here, which is why the gantry
 * strip itself stays presentational.
 */
export function ReviewGrid({
  session,
  onSelect,
}: {
  session: ExamSession;
  onSelect: (index: number) => void;
}) {
  return (
    <ul className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {session.questions.map(({ question }, index) => {
        const answer = session.answers[question.id];
        const answered = (answer?.selected.length ?? 0) > 0;
        const flagged = answer?.flagged ?? false;
        const current = index === session.index;

        const status = flagged
          ? 'flagged for review'
          : answered
            ? 'answered'
            : 'not answered';

        return (
          <li key={question.id}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={current ? 'true' : undefined}
              aria-label={`Question ${index + 1}, ${status}`}
              className={cn(
                'tnum flex h-12 w-full items-center justify-center rounded-[--radius-sm] border-2 font-mono text-sm font-medium transition-colors',
                flagged && 'border-warning bg-warning-soft text-warning',
                !flagged && answered && 'border-motorway bg-motorway text-on-motorway',
                !flagged && !answered && 'border-line bg-surface text-ink-faint hover:bg-surface-2',
                current && 'ring-ink ring-2 ring-offset-2 ring-offset-[--paper]',
              )}
            >
              {index + 1}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
