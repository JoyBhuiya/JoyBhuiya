import { useEffect, useMemo, useState } from 'react';
import type { ChapterId } from '@/types/question';
import { CHAPTERS } from '@/data/chapters';
import { groupByChapter, loadAll } from '@/data/questions';
import { useProgress } from '@/state/ProgressContext';
import { useSession } from '@/state/SessionContext';
import { chapterMastery, computeReadiness, lifetimeStats } from '@/lib/scoring';
import { displayedStreak } from '@/lib/streak';
import { BADGES, getBadge } from '@/lib/badges';
import { ReadinessGauge } from '@/components/dashboard/ReadinessGauge';
import { Gantry } from '@/components/quiz/Gantry';
import { Card, CardBody } from '@/components/ui/Card';
import { LinkButton, Button } from '@/components/ui/Button';
import { formatDate, pluralise } from '@/lib/format';
import { EXAM_PASS_MARK } from '@/types/exam';
import { cn } from '@/lib/cn';
import { useNavigate } from 'react-router-dom';

const EMPTY_BY_CHAPTER = { 1: [], 2: [], 3: [], 4: [], 5: [] } as Record<ChapterId, string[]>;

export default function Dashboard() {
  const navigate = useNavigate();
  const { state } = useProgress();
  const { session } = useSession();
  const [byChapter, setByChapter] = useState<Record<ChapterId, string[]>>(EMPTY_BY_CHAPTER);
  const [bankSize, setBankSize] = useState(0);

  useEffect(() => {
    void loadAll().then((all) => {
      setByChapter(groupByChapter(all));
      setBankSize(all.length);
    });
  }, []);

  const readiness = useMemo(
    () => computeReadiness(state, byChapter, bankSize),
    [state, byChapter, bankSize],
  );
  const stats = useMemo(() => lifetimeStats(state), [state]);
  const mastery = useMemo(() => chapterMastery(state, byChapter), [state, byChapter]);
  const streak = displayedStreak(state.streak);
  const exams = state.attempts.filter((a) => a.mode === 'exam');
  const earned = Object.keys(state.badges);
  const resumable = session && !session.submittedAt;
  const isNewcomer = stats.answered === 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      {isNewcomer ? (
        <header>
          <p className="text-ink-faint font-mono text-xs tracking-widest uppercase">
            24 questions · 45 minutes · {EXAM_PASS_MARK} to pass
          </p>
          <h1 className="mt-3 text-4xl leading-[1.05] font-semibold sm:text-5xl">
            Walk into the test
            <br />
            already knowing you’ll pass.
          </h1>

          {/*
            The pass mark is the whole point of the exercise, so show it rather
            than describing it: 24 blocks, and the line you have to get past.
          */}
          <div className="mt-9 max-w-xl">
            <Gantry
              states={Array.from({ length: 24 }, (_, i) => (i < 18 ? 'correct' : 'empty'))}
              label={`A mock exam is 24 questions. You need ${EXAM_PASS_MARK} right to pass.`}
            />
            <p className="text-ink-muted mt-8 leading-relaxed">
              {bankSize > 0 ? `${bankSize} practice questions` : 'Practice questions'} across all
              five chapters of the official handbook, full timed mock exams, and a readiness score
              that only says you’re ready once you’ve actually proved it.
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <LinkButton to="/practice" size="lg">
              Start practising
            </LinkButton>
            <LinkButton to="/exam" size="lg" variant="secondary">
              Sit a mock exam
            </LinkButton>
          </div>
        </header>
      ) : (
        <header>
          <p className="text-ink-faint font-mono text-xs tracking-widest uppercase">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Where you stand</h1>
        </header>
      )}

      {resumable && (
        <Card className="border-motorway bg-motorway-soft mt-8">
          <CardBody className="flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="text-ink text-sm font-semibold">
                You have an unfinished {session.mode === 'exam' ? 'mock exam' : 'practice set'}.
              </p>
              <p className="text-ink-muted mt-0.5 text-sm">
                Question {session.index + 1} of {session.questions.length}
                {session.endsAt && ' — the clock is still running.'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate(session.mode === 'exam' ? '/exam/run' : '/practice/run')}
            >
              Resume
            </Button>
          </CardBody>
        </Card>
      )}

      {!isNewcomer && (
        <>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card>
              <CardBody>
                <h2 className="text-ink-faint mb-4 text-[11px] font-semibold tracking-widest uppercase">
                  Readiness
                </h2>
                <ReadinessGauge readiness={readiness} />
              </CardBody>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Stat label="Day streak" value={streak} suffix={streak === 1 ? 'day' : 'days'} />
              <Stat
                label="Questions seen"
                value={stats.seen}
                suffix={bankSize > 0 ? `of ${bankSize}` : ''}
              />
              <Stat
                label="Accuracy"
                value={`${Math.round(stats.accuracy * 100)}%`}
                suffix="lifetime"
              />
              <Stat
                label="Mocks sat"
                value={exams.length}
                suffix={`${exams.filter((e) => e.passed).length} passed`}
              />
            </div>
          </div>

          <section className="mt-10" aria-labelledby="chapters-heading">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="chapters-heading" className="text-lg font-semibold">
                Chapter coverage
              </h2>
              <LinkButton to="/practice" variant="ghost" size="sm">
                Practise
              </LinkButton>
            </div>

            <ul className="mt-4 flex flex-col gap-4">
              {CHAPTERS.map((meta) => {
                const stat = mastery[meta.id];
                const coverage = stat.total > 0 ? stat.seen / stat.total : 0;
                return (
                  <li key={meta.id}>
                    <div className="mb-1.5 flex items-baseline gap-3">
                      <span
                        className="text-ink-faint shrink-0 font-mono text-xs"
                        aria-hidden="true"
                      >
                        {meta.id}
                      </span>
                      <span className="text-ink flex-1 text-sm font-medium">
                        {meta.shortTitle}
                      </span>
                      <span className="tnum text-ink-muted shrink-0 font-mono text-xs">
                        {stat.seen}/{stat.total}
                        {stat.seen > 0 && ` · ${Math.round(stat.accuracy * 100)}%`}
                      </span>
                    </div>
                    <div
                      className="bg-surface-3 relative h-2.5 overflow-hidden rounded-full"
                      role="img"
                      aria-label={`${meta.shortTitle}: ${stat.seen} of ${stat.total} questions seen${stat.seen > 0 ? `, ${Math.round(stat.accuracy * 100)}% accuracy` : ''}`}
                    >
                      <div
                        className="bg-motorway/35 absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                        style={{ width: `${coverage * 100}%` }}
                      />
                      <div
                        className={cn(
                          'absolute inset-y-0 left-0 rounded-full transition-[width] duration-500',
                          stat.accuracy >= 0.75
                            ? 'bg-route'
                            : stat.accuracy >= 0.5
                              ? 'bg-warning-bold'
                              : 'bg-stop',
                        )}
                        style={{ width: `${coverage * stat.accuracy * 100}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="text-ink-faint mt-3 text-xs">
              The pale bar is how much of each chapter you have seen; the solid bar is how much you
              have got right.
            </p>
          </section>
        </>
      )}

      <section className="mt-12" aria-labelledby="badges-heading">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="badges-heading" className="text-lg font-semibold">
            Achievements
          </h2>
          <span className="text-ink-faint font-mono text-xs">
            {earned.length}/{BADGES.length}
          </span>
        </div>

        <ul className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {BADGES.filter((badge) => !badge.secret || badge.id in state.badges)
            // A wall of sixteen greyed-out cards is a poor first impression;
            // show a handful until there is progress worth displaying.
            .slice(0, isNewcomer ? 6 : undefined)
            .map((badge) => {
            const unlockedAt = state.badges[badge.id];
            const unlocked = Boolean(unlockedAt);
            const progress = !unlocked && badge.progress
              ? badge.progress({
                  state,
                  bankSize,
                  questionsByChapter: byChapter,
                  now: Date.now(),
                })
              : null;

            return (
              <li
                key={badge.id}
                className={cn(
                  'rounded-[--radius] border px-3.5 py-3',
                  unlocked
                    ? 'border-route/40 bg-route-soft'
                    : 'border-line bg-surface opacity-70',
                )}
              >
                <p
                  className={cn(
                    'text-sm font-semibold',
                    unlocked ? 'text-route' : 'text-ink-muted',
                  )}
                >
                  {badge.name}
                </p>
                <p className="text-ink-muted mt-0.5 text-xs leading-snug">{badge.description}</p>
                {unlocked && (
                  <p className="text-ink-faint mt-1.5 font-mono text-[10px]">
                    {formatDate(unlockedAt)}
                  </p>
                )}
                {progress && progress.target > 0 && (
                  <div className="bg-surface-3 mt-2 h-1 overflow-hidden rounded-full">
                    <div
                      className="bg-ink-faint h-full rounded-full"
                      style={{
                        width: `${Math.min(100, (progress.current / progress.target) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {exams.length > 0 && (
        <p className="text-ink-faint mt-10 text-sm">
          You have sat {pluralise(exams.length, 'mock exam')}. Most recent:{' '}
          {exams[0].score}/{exams[0].total} on {formatDate(exams[0].finishedAt)}.{' '}
          {earned.length > 0 &&
            `Latest badge: ${getBadge(earned[earned.length - 1])?.name ?? '—'}.`}
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="border-line bg-surface flex flex-col justify-center rounded-[--radius-lg] border px-4 py-4">
      <p className="text-ink-faint text-[11px] font-semibold tracking-widest uppercase">{label}</p>
      <p className="tnum mt-1.5 font-mono text-2xl leading-none font-medium">{value}</p>
      {suffix && <p className="text-ink-faint mt-1 text-xs">{suffix}</p>}
    </div>
  );
}
