import type { Readiness } from '@/lib/scoring';
import { cn } from '@/lib/cn';

const BAND_COLOUR: Record<Readiness['band'], string> = {
  'Not ready yet': 'text-stop',
  'Getting there': 'text-warning',
  'On track': 'text-motorway',
  'Test ready': 'text-route',
};

const BAND_STROKE: Record<Readiness['band'], string> = {
  'Not ready yet': 'var(--stop)',
  'Getting there': 'var(--warning)',
  'On track': 'var(--motorway)',
  'Test ready': 'var(--route)',
};

/**
 * A ring rather than a bar, because the number is a summary rather than a
 * position along a scale. The dashed track when the score is provisional is
 * doing real work: it tells the candidate the figure isn't trustworthy yet.
 */
export function ReadinessGauge({ readiness }: { readiness: Readiness }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const filled = (readiness.score / 100) * circumference;
  const provisional = readiness.limitedBy !== null;

  return (
    <div className="flex items-center gap-5">
      <svg
        viewBox="0 0 128 128"
        className="h-32 w-32 shrink-0 -rotate-90"
        role="img"
        aria-label={`Readiness ${readiness.score} out of 100. ${readiness.band}.`}
      >
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth="11"
          strokeDasharray={provisional ? '4 6' : undefined}
          strokeLinecap="round"
        />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke={BAND_STROKE[readiness.band]}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700"
        />
      </svg>

      <div className="min-w-0">
        <p className="tnum font-mono text-4xl leading-none font-medium">
          {readiness.score}
          <span className="text-ink-faint text-xl">/100</span>
        </p>
        <p className={cn('mt-1.5 text-sm font-semibold', BAND_COLOUR[readiness.band])}>
          {readiness.band}
        </p>
        <p className="text-ink-muted mt-1.5 text-xs leading-relaxed">
          {readiness.limitedBy ?? 'Based on your recent mocks, coverage and accuracy.'}
        </p>
      </div>
    </div>
  );
}
