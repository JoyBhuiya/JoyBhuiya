import { useEffect, useRef, useState } from 'react';

/**
 * Counts down to an absolute timestamp.
 *
 * The remaining time is always recomputed from the wall clock rather than
 * decremented, so a backgrounded tab, a throttled interval or a locked phone
 * cannot gift the candidate extra time. It also re-syncs when the tab becomes
 * visible again, so the display is never stale on return.
 */
export function useCountdown(endsAt: number | undefined, onExpire?: () => void) {
  const [now, setNow] = useState(() => Date.now());
  const expired = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    expired.current = false;
  }, [endsAt]);

  useEffect(() => {
    if (!endsAt) return;

    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (!expired.current && current >= endsAt) {
        expired.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [endsAt]);

  if (!endsAt) return { remainingMs: Number.POSITIVE_INFINITY, isExpired: false };

  // A device clock moved backwards would otherwise show more time than the
  // candidate started with; clamping keeps the paper honest in both directions.
  const remainingMs = Math.max(0, endsAt - now);
  return { remainingMs, isExpired: remainingMs === 0 };
}
