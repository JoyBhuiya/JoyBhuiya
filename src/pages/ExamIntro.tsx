import { useNavigate } from 'react-router-dom';
import { useSession } from '@/state/SessionContext';
import { useProgress } from '@/state/ProgressContext';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EXAM_PASS_MARK, EXAM_QUESTION_COUNT } from '@/types/exam';
import { formatDate } from '@/lib/format';

const RULES = [
  { label: 'Questions', value: `${EXAM_QUESTION_COUNT}` },
  { label: 'Time limit', value: '45 minutes' },
  { label: 'To pass', value: `${EXAM_PASS_MARK} correct` },
];

export default function ExamIntro() {
  const navigate = useNavigate();
  const { startExam, starting, session } = useSession();
  const { state } = useProgress();

  const exams = state.attempts.filter((a) => a.mode === 'exam');
  const lastExam = exams[0];
  const inProgress = session && !session.submittedAt && session.mode === 'exam';

  const begin = async () => {
    await startExam();
    navigate('/exam/run');
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="text-ink-faint font-mono text-xs tracking-widest uppercase">Mock exam</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Sit a full timed paper</h1>
      <p className="text-ink-muted mt-3 leading-relaxed">
        Same shape as the real thing: {EXAM_QUESTION_COUNT} questions drawn across all five
        chapters, 45 minutes on the clock, {EXAM_PASS_MARK} correct to pass. No feedback until you
        submit.
      </p>

      <dl className="mt-7 grid grid-cols-3 gap-3">
        {RULES.map((rule) => (
          <div
            key={rule.label}
            className="border-line bg-surface rounded-[--radius] border px-3 py-4 text-center"
          >
            <dt className="text-ink-faint text-[11px] tracking-wide uppercase">{rule.label}</dt>
            <dd className="text-ink mt-1 font-mono text-xl font-medium">{rule.value}</dd>
          </div>
        ))}
      </dl>

      {inProgress && (
        <Card className="border-warning bg-warning-soft mt-6">
          <CardBody>
            <p className="text-ink text-sm font-medium">You have an exam in progress.</p>
            <p className="text-ink-muted mt-1 text-sm">
              The clock has kept running. Starting a new exam will discard it.
            </p>
            <Button className="mt-3" size="sm" onClick={() => navigate('/exam/run')}>
              Resume exam
            </Button>
          </CardBody>
        </Card>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={begin} disabled={starting}>
          {starting ? 'Preparing paper…' : 'Start the exam'}
        </Button>
      </div>

      <div className="border-line mt-10 border-t pt-6">
        <h2 className="text-sm font-semibold">Before you start</h2>
        <ul className="text-ink-muted mt-3 flex flex-col gap-2 text-sm leading-relaxed">
          <li>
            The timer runs on the clock, not on this tab — closing it or locking your phone does
            not pause the exam.
          </li>
          <li>Flag anything you want to come back to, then use “Review all” before submitting.</li>
          <li>Unanswered questions are marked wrong, so guess rather than leave a blank.</li>
          <li>
            Keyboard: <kbd className="font-mono">1</kbd>–<kbd className="font-mono">4</kbd> to
            answer, <kbd className="font-mono">F</kbd> to flag, <kbd className="font-mono">R</kbd>{' '}
            to review, arrows to move.
          </li>
        </ul>
      </div>

      {lastExam && (
        <p className="text-ink-faint mt-6 text-sm">
          Last attempt: {lastExam.score}/{lastExam.total} on {formatDate(lastExam.finishedAt)} —{' '}
          <span className={lastExam.passed ? 'text-route' : 'text-stop'}>
            {lastExam.passed ? 'passed' : 'not passed'}
          </span>
          .
        </p>
      )}
    </div>
  );
}
