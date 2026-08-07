import { useEffect, useRef } from 'react';
import { describeDuration, formatDuration } from '@/lib/format';
import { useAnnounce } from '@/hooks/useAnnounce';
import { cn } from '@/lib/cn';

const WARN_AT_MS = [10, 5, 1].map((m) => m * 60 * 1000);

export function Timer({
  remainingMs,
  announcements = true,
}: {
  remainingMs: number;
  announcements?: boolean;
}) {
  const announce = useAnnounce();
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!announcements) return;
    for (const threshold of WARN_AT_MS) {
      if (remainingMs <= threshold && !fired.current.has(threshold)) {
        fired.current.add(threshold);
        announce(`${describeDuration(threshold)} remaining.`);
      }
    }
  }, [remainingMs, announce, announcements]);

  const urgent = remainingMs <= 5 * 60 * 1000;
  const minutesLeft = Math.ceil(remainingMs / 60000);

  return (
    <div
      role="timer"
      // Per-second updates through a live region are unusable with a screen
      // reader. The label carries minute granularity; the polite announcements
      // above cover the thresholds that actually matter.
      aria-live="off"
      aria-label={`${minutesLeft} minute${minutesLeft === 1 ? '' : 's'} remaining`}
      className={cn(
        'tnum inline-flex items-center gap-2 rounded-[--radius] border px-3 py-1.5 font-mono text-[0.95rem] font-medium tabular-nums transition-colors',
        urgent ? 'border-stop bg-stop-soft text-stop' : 'border-line bg-surface-2 text-ink',
      )}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7.5V12l3 2" />
      </svg>
      <span>{formatDuration(remainingMs)}</span>
    </div>
  );
}
