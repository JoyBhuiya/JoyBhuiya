import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from '@/state/ThemeContext';
import { useProgress } from '@/state/ProgressContext';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/practice', label: 'Practice' },
  { to: '/exam', label: 'Mock exam' },
  { to: '/history', label: 'History' },
  { to: '/settings', label: 'Settings' },
];

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </svg>
  );
}

function ThemeToggle() {
  const { resolved, setPreference } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      className="text-ink-muted hover:text-ink hover:bg-surface-2 inline-flex h-11 w-11 items-center justify-center rounded-[--radius] transition-colors"
      aria-label={`Switch to ${next} theme`}
    >
      {resolved === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function Wordmark() {
  return (
    <NavLink to="/" className="group flex items-center gap-2.5" aria-label="Life in the UK — home">
      <span
        className="bg-motorway text-on-motorway plate flex h-9 w-9 shrink-0 items-center justify-center font-display text-[15px] font-semibold"
        aria-hidden="true"
      >
        UK
      </span>
      <span className="font-display text-ink hidden text-[15px] leading-tight font-semibold sm:block">
        Life in the UK
        <span className="text-ink-faint block text-[11px] font-normal tracking-wide uppercase">
          Test practice
        </span>
      </span>
    </NavLink>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const { storageWritable } = useProgress();

  // The exam runner owns the whole viewport; chrome would only get in the way.
  const isExamRunner = pathname.startsWith('/exam/run');

  useEffect(() => {
    if (!isExamRunner) window.scrollTo(0, 0);
  }, [pathname, isExamRunner]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="bg-motorway text-on-motorway sr-only rounded-[--radius] px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
      >
        Skip to main content
      </a>

      {!isExamRunner && (
        <header className="bg-surface/90 border-line sticky top-0 z-30 border-b backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-2.5">
            <Wordmark />
            <nav className="ml-auto hidden items-center gap-0.5 md:flex" aria-label="Main">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'rounded-[--radius] px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-motorway-soft text-motorway'
                        : 'text-ink-muted hover:text-ink hover:bg-surface-2',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className={cn('ml-auto md:ml-1')}>
              <ThemeToggle />
            </div>
          </div>
        </header>
      )}

      {!storageWritable && !isExamRunner && (
        <p
          role="status"
          className="bg-warning-soft text-ink border-warning/40 border-b px-4 py-2 text-center text-sm"
        >
          Your browser is blocking saved data, so progress will be lost when you close this tab.
        </p>
      )}

      <main id="main" className="flex-1" tabIndex={-1}>
        <Outlet />
      </main>

      {!isExamRunner && (
        <>
          <nav
            className="bg-surface/95 border-line sticky bottom-0 z-30 border-t backdrop-blur-md md:hidden"
            aria-label="Main"
          >
            <ul className="mx-auto flex max-w-5xl">
              {NAV.map((item) => (
                <li key={item.to} className="flex-1">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      cn(
                        'flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors',
                        isActive ? 'text-motorway' : 'text-ink-faint hover:text-ink',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <footer className="border-line text-ink-faint border-t px-4 py-8 text-center text-xs">
            <p className="mx-auto max-w-2xl leading-relaxed">
              An independent study tool. Not affiliated with, endorsed by, or connected to the Home
              Office or UK Visas and Immigration. Questions are written from the factual content of
              the official handbook and are not real test questions.
            </p>
          </footer>
        </>
      )}
    </div>
  );
}
