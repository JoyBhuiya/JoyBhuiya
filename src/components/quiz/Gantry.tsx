import { EXAM_PASS_MARK } from '@/types/exam';
import { cn } from '@/lib/cn';

/**
 * The gantry.
 *
 * A strip of one block per question with a hard rule drawn after the 18th —
 * the pass mark, made physically present in the interface rather than left as
 * a number in the rules. It appears twice: as a progress strip during the exam
 * (how far along you are, against how far you need to get) and as a score bar
 * on the results screen (whether you actually crossed the line).
 *
 * It is deliberately presentational. At 375px each block is about 12px wide,
 * far below a usable tap target, so navigation lives in the review grid where
 * the targets are full size.
 */

export type GantryState = 'empty' | 'answered' | 'flagged' | 'correct' | 'incorrect';

const FILL: Record<GantryState, string> = {
  empty: 'bg-surface-3',
  answered: 'bg-motorway',
  flagged: 'bg-warning-bold',
  correct: 'bg-route',
  incorrect: 'bg-stop',
};

interface GantryProps {
  states: GantryState[];
  /** Draws the ring around the question currently on screen. */
  currentIndex?: number;
  passMark?: number;
  label: string;
  className?: string;
}

export function Gantry({
  states,
  currentIndex,
  passMark = EXAM_PASS_MARK,
  label,
  className,
}: GantryProps) {
  const total = states.length;
  const showPassMark = passMark > 0 && passMark < total;

  return (
    <div
      className={cn('relative flex h-9 w-full items-stretch gap-[2px] pt-[5px]', className)}
      role="img"
      aria-label={label}
    >
      {states.map((state, index) => (
        <div key={index} className="relative flex-1">
          <div className={cn('h-full w-full rounded-[2px] transition-colors duration-200', FILL[state])} />
          {/*
            A ring around the current segment disappears once that segment is
            filled. A marker sitting above the strip stays legible whatever the
            segment beneath it is doing.
          */}
          {index === currentIndex && (
            <div className="bg-ink absolute -top-[5px] right-0 left-0 h-[3px] rounded-full" />
          )}
        </div>
      ))}

      {showPassMark && (
        <div
          className="pointer-events-none absolute inset-y-0"
          style={{ left: `calc(${(passMark / total) * 100}% - 1px)` }}
          aria-hidden="true"
        >
          <div className="bg-ink h-full w-[2px]" />
          <div className="bg-ink text-paper absolute top-full left-1/2 mt-1 -translate-x-1/2 rounded-[3px] px-1.5 py-0.5 font-mono text-[10px] leading-none font-medium whitespace-nowrap">
            {passMark} to pass
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Results variant: correct answers stack from the left so the bar reads as a
 * score against the pass line, not as a list of questions in order.
 */
export function ScoreGantry({
  score,
  total,
  passMark = EXAM_PASS_MARK,
  className,
}: {
  score: number;
  total: number;
  passMark?: number;
  className?: string;
}) {
  const states: GantryState[] = Array.from({ length: total }, (_, index) =>
    index < score ? 'correct' : 'incorrect',
  );
  return (
    <Gantry
      states={states}
      passMark={passMark}
      label={`Score: ${score} out of ${total}. Pass mark is ${passMark}.`}
      className={className}
    />
  );
}
