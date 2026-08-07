import { Link } from 'react-router-dom';
import { useProgress } from '@/state/ProgressContext';
import { LinkButton } from '@/components/ui/Button';
import { formatDateTime, formatDuration } from '@/lib/format';
import { EXAM_PASS_MARK } from '@/types/exam';
import { getChapter } from '@/data/chapters';
import { cn } from '@/lib/cn';

export default function History() {
  const { state } = useProgress();
  const exams = state.attempts.filter((a) => a.mode === 'exam');

  if (state.attempts.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">No attempts yet</h1>
        <p className="text-ink-muted mt-2 leading-relaxed">
          Once you finish a practice set or a mock exam, it will show up here so you can watch the
          trend.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <LinkButton to="/practice">Start practising</LinkButton>
          <LinkButton to="/exam" variant="secondary">
            Sit a mock exam
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-ink-faint font-mono text-xs tracking-widest uppercase">History</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Everything you’ve sat</h1>

      {exams.length >= 2 && <ExamTrend exams={exams} />}

      <ul className="mt-8 flex flex-col gap-2">
        {state.attempts.map((attempt) => {
          const accuracy = attempt.total === 0 ? 0 : attempt.score / attempt.total;
          return (
            <li key={attempt.id}>
              <Link
                to={`/results/${encodeURIComponent(attempt.id)}`}
                className="border-line bg-surface hover:bg-surface-2 flex min-h-16 items-center gap-4 rounded-[--radius] border px-4 py-3 transition-colors"
              >
                <span
                  className={cn(
                    'tnum flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[--radius-sm] font-mono text-sm font-medium',
                    attempt.passed ? 'bg-route-soft text-route' : 'bg-stop-soft text-stop',
                  )}
                  aria-hidden="true"
                >
                  {attempt.score}
                  <span className="text-[10px] opacity-70">/{attempt.total}</span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="text-ink block text-sm font-medium">
                    {attempt.mode === 'exam'
                      ? 'Mock exam'
                      : attempt.chapter
                        ? `Practice — ${getChapter(attempt.chapter).shortTitle}`
                        : 'Practice — mixed'}
                  </span>
                  <span className="text-ink-faint block text-xs">
                    {formatDateTime(attempt.finishedAt)} · {formatDuration(attempt.durationMs)} ·{' '}
                    {Math.round(accuracy * 100)}%
                  </span>
                </span>

                <span
                  className={cn(
                    'shrink-0 text-xs font-semibold',
                    attempt.passed ? 'text-route' : 'text-stop',
                  )}
                >
                  {attempt.passed ? 'Pass' : 'Fail'}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * A sparkline of mock scores against the pass mark. Oldest on the left, so it
 * reads as a trend rather than as the reverse-chronological list below it.
 */
function ExamTrend({ exams }: { exams: ReturnType<typeof useProgress>['state']['attempts'] }) {
  const points = exams.slice(0, 12).reverse();
  const width = 100;
  const height = 34;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const y = (score: number, total: number) => height - (score / total) * height;
  const passY = y(EXAM_PASS_MARK, 24);

  const path = points
    .map((a, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${y(a.score, a.total)}`)
    .join(' ');

  return (
    <figure className="border-line bg-surface mt-8 rounded-[--radius-lg] border px-4 py-4">
      <figcaption className="text-ink-faint mb-3 text-[11px] font-semibold tracking-widest uppercase">
        Mock exam scores — oldest first
      </figcaption>
      <svg
        viewBox={`-2 -2 ${width + 4} ${height + 4}`}
        className="h-20 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Mock scores over time: ${points.map((a) => `${a.score} out of ${a.total}`).join(', ')}. Pass mark ${EXAM_PASS_MARK}.`}
      >
        <line
          x1="0"
          x2={width}
          y1={passY}
          y2={passY}
          stroke="var(--ink-faint)"
          strokeWidth="0.7"
          strokeDasharray="3 2"
        />
        <path d={path} fill="none" stroke="var(--motorway)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        {points.map((a, i) => (
          <circle
            key={a.id}
            cx={i * step}
            cy={y(a.score, a.total)}
            r="2"
            fill={a.passed ? 'var(--route)' : 'var(--stop)'}
          />
        ))}
      </svg>
      <p className="text-ink-faint mt-1 text-xs">
        The dashed line is the {EXAM_PASS_MARK}-mark pass threshold.
      </p>
    </figure>
  );
}
