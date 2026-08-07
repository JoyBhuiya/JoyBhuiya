import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/state/SessionContext';
import { useProgress } from '@/state/ProgressContext';
import { useCountdown } from '@/hooks/useCountdown';
import { useAnnounce } from '@/hooks/useAnnounce';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Gantry, type GantryState } from '@/components/quiz/Gantry';
import { ReviewGrid } from '@/components/quiz/ReviewGrid';
import { Timer } from '@/components/quiz/Timer';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { isAnswerCorrect } from '@/lib/scoring';
import { cn } from '@/lib/cn';

function FlagIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 21V4.5h13l-2.5 4 2.5 4H5" />
    </svg>
  );
}

export default function SessionPage() {
  const navigate = useNavigate();
  const announce = useAnnounce();
  const { state } = useProgress();
  const { session, setAnswer, toggleFlag, goTo, next, previous, submit, abandon } = useSession();

  const [showReview, setShowReview] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isExam = session?.mode === 'exam';
  const instantFeedback = state.settings.instantFeedback && !isExam;

  const finish = useCallback(() => {
    const attemptId = submit();
    if (attemptId) navigate(`/results/${encodeURIComponent(attemptId)}`, { replace: true });
  }, [submit, navigate]);

  const { remainingMs } = useCountdown(session?.endsAt, () => {
    announce('Time is up. Your exam has been submitted.', 'assertive');
    finish();
  });

  // Reveal state belongs to the question, not the session.
  useEffect(() => setRevealed(false), [session?.index]);

  // Nothing to run — the user deep-linked or refreshed after finishing.
  useEffect(() => {
    if (!session) navigate('/', { replace: true });
  }, [session, navigate]);

  const current = session?.questions[session.index];
  const answer = current ? session?.answers[current.question.id] : undefined;
  const selected = answer?.selected ?? [];

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (!session || !current) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const order = current.optionOrder;
      if (/^[1-4]$/.test(event.key)) {
        const optionId = order[Number(event.key) - 1];
        if (optionId && !revealed) {
          event.preventDefault();
          if (current.question.type === 'multi') {
            setAnswer(
              current.question.id,
              selected.includes(optionId)
                ? selected.filter((id) => id !== optionId)
                : [...selected, optionId].slice(-2),
            );
          } else {
            setAnswer(current.question.id, [optionId]);
          }
        }
        return;
      }

      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'n') next();
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'p') previous();
      if (event.key.toLowerCase() === 'f') toggleFlag(current.question.id);
      if (event.key.toLowerCase() === 'r' && isExam) setShowReview((open) => !open);
    },
    [session, current, selected, revealed, setAnswer, next, previous, toggleFlag, isExam],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  if (!session || !current) return null;

  const total = session.questions.length;
  const unanswered = session.questions.filter(
    (q) => (session.answers[q.question.id]?.selected.length ?? 0) === 0,
  ).length;
  const flaggedCount = session.questions.filter(
    (q) => session.answers[q.question.id]?.flagged,
  ).length;

  const gantryStates: GantryState[] = session.questions.map((q) => {
    const a = session.answers[q.question.id];
    if (a?.flagged) return 'flagged';
    return (a?.selected.length ?? 0) > 0 ? 'answered' : 'empty';
  });

  const isLast = session.index === total - 1;
  const correctNow = isAnswerCorrect(current.question, selected);
  const canReveal = instantFeedback && selected.length > 0 && !revealed;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 pb-6">
      <header className="bg-paper sticky top-0 z-20 -mx-4 px-4 pt-4 pb-3">
        <div className="mb-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isExam ? setConfirmQuit(true) : abandon())}
            className="-ml-2"
          >
            {isExam ? 'Leave exam' : 'End practice'}
          </Button>

          <div className="ml-auto flex items-center gap-2">
            {isExam && (
              <Timer
                remainingMs={remainingMs}
                announcements={state.settings.timerAnnouncements}
              />
            )}
            <button
              type="button"
              onClick={() => toggleFlag(current.question.id)}
              aria-pressed={answer?.flagged ?? false}
              className={cn(
                'inline-flex min-h-11 items-center gap-1.5 rounded-[--radius] border px-3 text-sm font-medium transition-colors',
                answer?.flagged
                  ? 'border-warning bg-warning-soft text-warning'
                  : 'border-line bg-surface text-ink-muted hover:bg-surface-2',
              )}
            >
              <FlagIcon filled={answer?.flagged ?? false} />
              <span className="hidden sm:inline">{answer?.flagged ? 'Flagged' : 'Flag'}</span>
            </button>
          </div>
        </div>

        <Gantry
          states={gantryStates}
          currentIndex={session.index}
          passMark={isExam ? 18 : 0}
          label={`Progress: question ${session.index + 1} of ${total}, ${total - unanswered} answered.`}
        />
      </header>

      <div className={cn('flex-1 pt-8', isExam && 'pt-10')}>
        <QuestionCard
          question={current.question}
          optionOrder={current.optionOrder}
          selected={selected}
          onChange={(next) => setAnswer(current.question.id, next)}
          index={session.index}
          total={total}
          revealed={revealed}
        />

        {revealed && (
          <div
            role="status"
            className={cn(
              'mt-5 rounded-[--radius] border-l-4 px-4 py-3.5',
              correctNow ? 'border-route bg-route-soft' : 'border-stop bg-stop-soft',
            )}
          >
            <p className={cn('text-sm font-semibold', correctNow ? 'text-route' : 'text-stop')}>
              {correctNow ? 'Correct' : 'Not quite'}
            </p>
            <p className="text-ink mt-1.5 text-sm leading-relaxed">
              {current.question.explanation}
            </p>
          </div>
        )}
      </div>

      <div className="border-line bg-paper sticky bottom-0 mt-6 flex items-center gap-2 border-t py-3">
        <Button variant="secondary" onClick={previous} disabled={session.index === 0}>
          Back
        </Button>

        {isExam && (
          <Button variant="ghost" onClick={() => setShowReview(true)} className="hidden sm:inline-flex">
            Review all
          </Button>
        )}

        <div className="ml-auto flex gap-2">
          {canReveal && (
            <Button onClick={() => setRevealed(true)}>Check answer</Button>
          )}
          {!canReveal && !isLast && <Button onClick={next}>Next</Button>}
          {!canReveal && isLast && (
            <Button onClick={() => (isExam ? setConfirmSubmit(true) : finish())}>
              {isExam ? 'Finish exam' : 'See results'}
            </Button>
          )}
        </div>
      </div>

      <Dialog
        open={showReview}
        onClose={() => setShowReview(false)}
        title="Your answers"
        footer={<Button onClick={() => setShowReview(false)}>Close</Button>}
      >
        <p className="mb-4">
          {unanswered === 0 ? 'All questions answered.' : `${unanswered} still unanswered.`}
          {flaggedCount > 0 && ` ${flaggedCount} flagged for review.`}
        </p>
        <ReviewGrid
          session={session}
          onSelect={(index) => {
            goTo(index);
            setShowReview(false);
          }}
        />
      </Dialog>

      <Dialog
        open={confirmSubmit}
        onClose={() => setConfirmSubmit(false)}
        title="Finish and submit?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmSubmit(false)}>
              Keep going
            </Button>
            <Button onClick={finish}>Submit exam</Button>
          </>
        }
      >
        {unanswered > 0 ? (
          <p>
            You have {unanswered} unanswered {unanswered === 1 ? 'question' : 'questions'}. They
            will be marked wrong.
          </p>
        ) : (
          <p>All 24 questions are answered. You can still go back and change them.</p>
        )}
      </Dialog>

      <Dialog
        open={confirmQuit}
        onClose={() => setConfirmQuit(false)}
        title="Leave the exam?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmQuit(false)}>
              Stay
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                abandon();
                navigate('/', { replace: true });
              }}
            >
              Leave and discard
            </Button>
          </>
        }
      >
        <p>This attempt will be discarded and will not appear in your history.</p>
      </Dialog>
    </div>
  );
}
