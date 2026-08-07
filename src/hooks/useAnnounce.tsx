import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Politeness = 'polite' | 'assertive';

interface AnnounceContextValue {
  announce: (message: string, politeness?: Politeness) => void;
}

const AnnounceContext = createContext<AnnounceContextValue | null>(null);

/**
 * A single pair of live regions for the whole app. Each message carries a
 * nonce so that announcing the same string twice still fires — screen readers
 * ignore a live region whose text content hasn't changed.
 */
export function AnnounceProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState({ text: '', nonce: 0 });
  const [assertive, setAssertive] = useState({ text: '', nonce: 0 });

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    const setter = politeness === 'assertive' ? setAssertive : setPolite;
    setter((previous) => ({ text: message, nonce: previous.nonce + 1 }));
  }, []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnounceContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        key={`polite-${polite.nonce}`}
      >
        {polite.text}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        key={`assertive-${assertive.nonce}`}
      >
        {assertive.text}
      </div>
    </AnnounceContext.Provider>
  );
}

export function useAnnounce(): (message: string, politeness?: Politeness) => void {
  const context = useContext(AnnounceContext);
  if (!context) throw new Error('useAnnounce must be used inside an AnnounceProvider');
  return context.announce;
}
