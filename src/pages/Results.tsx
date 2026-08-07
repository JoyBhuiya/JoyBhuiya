import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Question } from '@/types/question';
import { useProgress } from '@/state/ProgressContext';
import { loadAll } from '@/data/questions';
import { chapterBreakdown, weakestSections } from '@/lib/scoring';
import { ScoreGantry } from '@/components/quiz/Gantry';
import { Card, CardBody } from '@/components/ui/Card';
import { Button, LinkButton } from '@/components/ui/Button';
import { formatDuration, formatDateTime } from '@/lib/format';
import { EXAM_PASS_MARK } from '@/types/exam';
import { cn } from '@/lib/cn';

type Filter = 'all' | 'wrong' | 'flagged';

export default function Results() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { state } = useProgress();
  const [bank, setBank] = useState<Map<string, Question> | null>(null);
  const [filter, setFilter] = useState<Filter>('wrong');

  useEffect(() => {
    void loadAll().then((all) => setBank(new Map(all.map((q) => [q.id, q]))));
  }, []);

  const attempt = useMemo(
    () => state.attempts.find((a) => a.id === attemptId),
    [state.attempts, attemptId],
  );

  const previous = useMemo(() => {
    if (!attempt) return undefined;
    return state.attempts.find(
      (a) => a.mode === attempt.mode && a.finishedAt < attempt.finishedAt,
    );
  }, [state.attempts, attempt]);

  if (!attempt) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">That result isn’t here</h1>
        <p className="text-ink-muted mt-2">
          It may have been cleared, or the link may be from another device.
        </p>
        <LinkButton to="/history" className="mt-6">
          See your history
        </LinkButton>
      </div>
    );
  }

  const isExam = attempt.mode === 'exam';
  const chapters = chapterBreakdown(attempt.answers);
  const weak = weakestSections(attempt.answers);
  const delta = previous ? attempt.score / attempt.total - previous.score / previous.total : null;

  const visible = attempt.answers.filter((answer) => {
    if (filter === 'wrong') return !answer.correct;
    if (filter === 'flagged') return answer.flagged;
    return true;
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <p className="text-ink-faint font-mono text-xs tracking-widest uppercase">
        {isExam ? 'Mock exam result' : 'Practice result'} · {formatDateTime(attempt.finishedAt)}
      </p>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="tnum font-mono text-5xl font-medium sm:text-6xl">
          {attempt.score}
          <span className="text-ink-faint text-3xl sm:text-4xl">/{attempt.total}</span>
        </h1>
        <p
          className={cn(
            'rounded-[--radius] px-3 py-1 text-sm font-semibold',
            attempt.passed ? 'bg-route-soft text-route' : 'bg-stop-soft text-stop',
          )}
        >
          {attempt.passed ? 'Pass' : 'Not passed'}
        </p>
        {delta !== null && (
          <p className="text-ink-muted text-sm">
            {delta >= 0 ? '▲' : '▼'} {Math.abs(Math.round(delta * 100))} points vs your last{' '}
            {isExam ? 'exam' : 'practice set'}
          </p>
        )}
      </div>

      <div className="mt-8 mb-9">
        <ScoreGantry
          score={attempt.score}
          total={attempt.total}
          passMark={isExam ? EXAM_PASS_MARK : Math.ceil(attempt.total * 0.75)}
        />
      </div>

      <dl className="border-line grid grid-cols-3 gap-px overflow-hidden rounded-[--radius] border">
        <div className="bg-surface px-3 py-3 text-center">
          <dt className="text-ink-faint text-[11px] tracking-wide uppercase">Time taken</dt>
          <dd className="tnum mt-0.5 font-mono text-lg">{formatDuration(attempt.durationMs)}</dd>
        </div>
        <div className="bg-surface px-3 py-3 text-center">
          <dt className="text-ink-faint text-[11px] tracking-wide uppercase">Accuracy</dt>
          <dd className="tnum mt-0.5 font-mono text-lg">
            {Math.round((attempt.score / attempt.total) * 100)}%
          </dd>
        </div>
        <div className="bg-surface px-3 py-3 text-center">
          <dt className="text-ink-faint text-[11px] tracking-wide uppercase">Flagged</dt>
          <dd className="tnum mt-0.5 font-mono text-lg">
            {attempt.answers.filter((a) => a.flagged).length}
          </dd>
        </div>
      </dl>

      {weak.length > 0 && (
        <section className="mt-9" aria-labelledby="weak-heading">
          <h2 id="weak-heading" className="text-lg font-semibold">
            Revise these next
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {weak.map((row) => (
              <li
                key={row.key}
                className="border-line bg-surface flex items-center gap-3 rounded-[--radius] border px-4 py-3"
              >
                <span className="text-ink-faint shrink-0 font-mono text-xs">{row.key}</span>
                <span className="text-ink flex-1 text-sm font-medium">{row.title}</span>
                <span className="tnum text-stop shrink-0 font-mono text-sm">
                  {row.correct}/{row.total}
                </span>
              </li>
            ))}
          </ul>
          <LinkButton to="/practice" variant="secondary" size="sm" className="mt-3">
            Practise these topics
          </LinkButton>
        </section>
      )}

      <section className="mt-9" aria-labelledby="chapters-heading">
        <h2 id="chapters-heading" className="text-lg font-semibold">
          By chapter
        </h2>
        <ul className="mt-3 flex flex-col gap-3">
          {chapters.map((row) => (
            <li key={row.key}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="text-ink text-sm font-medium">{row.title}</span>
                <span className="tnum text-ink-muted font-mono text-xs">
                  {row.correct}/{row.total}
                </span>
              </div>
              <div
                className="bg-surface-3 h-2 overflow-hidden rounded-full"
                role="img"
                aria-label={`${row.title}: ${row.correct} of ${row.total} correct`}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-[width] duration-500',
                    row.accuracy >= 0.75 ? 'bg-route' : row.accuracy >= 0.5 ? 'bg-warning-bold' : 'bg-stop',
                  )}
                  style={{ width: `${Math.max(row.accuracy * 100, 2)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="review-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="review-heading" className="text-lg font-semibold">
            Question review
          </h2>
          <div className="flex gap-1.5" role="group" aria-label="Filter questions">
            {(
              [
                ['wrong', 'Got wrong'],
                ['flagged', 'Flagged'],
                ['all', 'All'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                aria-pressed={filter === value}
                className={cn(
                  'min-h-9 rounded-[--radius-sm] border px-3 text-xs font-medium transition-colors',
                  filter === value
                    ? 'border-motorway bg-motorway text-on-motorway'
                    : 'border-line bg-surface text-ink-muted hover:bg-surface-2',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 && (
          <p className="text-ink-muted mt-4 text-sm">
            {filter === 'wrong'
              ? 'Nothing wrong here — a clean sheet.'
              : 'No questions match that filter.'}
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-3">
          {visible.map((answer) => {
            const question = bank?.get(answer.questionId);
            if (!question) return null;
            const chosen = question.options.filter((o) => answer.selected.includes(o.id));
            const right = question.options.filter((o) => question.correct.includes(o.id));

            return (
              <Card as="li" key={answer.questionId}>
                <CardBody>
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                        answer.correct ? 'bg-route text-on-route' : 'bg-stop text-on-stop',
                      )}
                      aria-hidden="true"
                    >
                      {answer.correct ? '✓' : '✕'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink text-[0.95rem] leading-snug font-medium">
                        <span className="sr-only">
                          {answer.correct ? 'Correct. ' : 'Incorrect. '}
                        </span>
                        {question.stem}
                      </p>

                      {!answer.correct && (
                        <p className="text-stop mt-2 text-sm">
                          <span className="font-medium">You said:</span>{' '}
                          {chosen.length > 0
                            ? chosen.map((o) => o.text).join(' + ')
                            : 'nothing — left blank'}
                        </p>
                      )}
                      <p className="text-route mt-1 text-sm">
                        <span className="font-medium">Answer:</span>{' '}
                        {right.map((o) => o.text).join(' + ')}
                      </p>
                      <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                        {question.explanation}
                      </p>
                      <p className="text-ink-faint mt-2 font-mono text-[11px]">
                        {question.section} · {question.topic} ·{' '}
                        {formatDuration(answer.timeMs)} spent
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </ul>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <LinkButton to={isExam ? '/exam' : '/practice'}>
          {isExam ? 'Sit another exam' : 'Another practice set'}
        </LinkButton>
        <Button variant="secondary" onClick={() => window.print()}>
          Print this result
        </Button>
        <Link
          to="/"
          className="text-ink-muted hover:text-ink inline-flex min-h-11 items-center px-2 text-sm underline"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
