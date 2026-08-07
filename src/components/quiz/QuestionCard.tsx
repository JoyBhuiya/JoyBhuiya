import { useEffect, useRef } from 'react';
import type { Question } from '@/types/question';
import { cn } from '@/lib/cn';

interface QuestionCardProps {
  question: Question;
  optionOrder: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  index: number;
  total: number;
  /** Practice mode: the answer has been revealed and inputs are locked. */
  revealed?: boolean;
  disabled?: boolean;
}

const KEY_HINTS = ['1', '2', '3', '4'];

export function QuestionCard({
  question,
  optionOrder,
  selected,
  onChange,
  index,
  total,
  revealed = false,
  disabled = false,
}: QuestionCardProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isMulti = question.type === 'multi';

  // Focus the heading, not the first option: a screen reader landing on a radio
  // announces the group part-way through and skips the question itself.
  useEffect(() => {
    headingRef.current?.focus();
  }, [question.id]);

  const toggle = (optionId: string) => {
    if (disabled || revealed) return;
    if (!isMulti) {
      onChange([optionId]);
      return;
    }
    if (selected.includes(optionId)) {
      onChange(selected.filter((id) => id !== optionId));
    } else if (selected.length < 2) {
      onChange([...selected, optionId]);
    } else {
      // Two already chosen: replace the older one so the control never dead-ends.
      onChange([selected[1], optionId]);
    }
  };

  const optionsById = new Map(question.options.map((o) => [o.id, o]));

  return (
    <div>
      <p className="text-ink-faint mb-2 font-mono text-xs tracking-wide uppercase">
        Question {index + 1} of {total}
        {isMulti && <span className="text-warning ml-2 font-semibold">Select two</span>}
      </p>

      <h2
        ref={headingRef}
        tabIndex={-1}
        className="text-ink text-xl leading-snug font-semibold outline-none sm:text-[1.4rem]"
      >
        {question.stem}
      </h2>

      <fieldset className="mt-5 border-0 p-0" disabled={disabled || revealed}>
        <legend className="sr-only">
          {isMulti ? 'Select the two correct answers' : 'Select one answer'}
        </legend>

        <ul className="flex flex-col gap-2.5">
          {optionOrder.map((optionId, position) => {
            const option = optionsById.get(optionId);
            if (!option) return null;

            const isSelected = selected.includes(optionId);
            const isCorrect = question.correct.includes(optionId);
            const showAsCorrect = revealed && isCorrect;
            const showAsWrong = revealed && isSelected && !isCorrect;

            return (
              <li key={optionId}>
                <label
                  className={cn(
                    'group flex min-h-14 cursor-pointer items-center gap-3 rounded-[--radius] border-2 px-4 py-3 transition-colors',
                    'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[--focus] has-[:focus-visible]:outline-offset-2',
                    showAsCorrect && 'border-route bg-route-soft',
                    showAsWrong && 'border-stop bg-stop-soft',
                    !revealed &&
                      isSelected &&
                      'border-motorway bg-motorway-soft',
                    !revealed &&
                      !isSelected &&
                      'border-line bg-surface hover:border-line-strong hover:bg-surface-2',
                    revealed && !showAsCorrect && !showAsWrong && 'border-line bg-surface opacity-70',
                    (disabled || revealed) && 'cursor-default',
                  )}
                >
                  <input
                    type={isMulti ? 'checkbox' : 'radio'}
                    name={`q-${question.id}`}
                    value={optionId}
                    checked={isSelected}
                    onChange={() => toggle(optionId)}
                    className="sr-only"
                  />

                  <span
                    aria-hidden="true"
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center border-2 font-mono text-xs font-medium',
                      isMulti ? 'rounded-[4px]' : 'rounded-full',
                      showAsCorrect && 'border-route bg-route text-on-route',
                      showAsWrong && 'border-stop bg-stop text-on-stop',
                      !revealed && isSelected && 'border-motorway bg-motorway text-on-motorway',
                      !revealed && !isSelected && 'border-line-strong text-ink-faint',
                      revealed && !showAsCorrect && !showAsWrong && 'border-line-strong text-ink-faint',
                    )}
                  >
                    {showAsCorrect ? '✓' : showAsWrong ? '✕' : KEY_HINTS[position] ?? ''}
                  </span>

                  <span className="text-ink flex-1 text-[0.975rem] leading-snug">
                    {option.text}
                  </span>

                  {/* Never colour alone — every state carries a text label too. */}
                  {showAsCorrect && (
                    <span className="text-route shrink-0 text-xs font-semibold whitespace-nowrap">
                      Correct answer
                    </span>
                  )}
                  {showAsWrong && (
                    <span className="text-stop shrink-0 text-xs font-semibold whitespace-nowrap">
                      Your answer
                    </span>
                  )}
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
    </div>
  );
}
