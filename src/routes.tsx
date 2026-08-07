import { lazy, Suspense, type ReactNode } from 'react';
import { createHashRouter } from 'react-router-dom';
import App from './App';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PracticeSetup = lazy(() => import('./pages/PracticeSetup'));
const Session = lazy(() => import('./pages/Session'));
const ExamIntro = lazy(() => import('./pages/ExamIntro'));
const Results = lazy(() => import('./pages/Results'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status">
      <span className="text-ink-faint text-sm">Loading…</span>
    </div>
  );
}

function Screen({ children }: { children: ReactNode }) {
  return <Suspense fallback={<Loading />}>{children}</Suspense>;
}

/**
 * Hash routing. GitHub Pages has no server-side rewrite, so a deep link to
 * /results/abc under browser routing would 404 on a cold load. The usual
 * workaround — copying index.html to 404.html — does not work here because the
 * site is served from a sub-path (/JoyBhuiya/), so relative asset URLs resolve
 * against the wrong depth. Hash routes sidestep the problem entirely and keep
 * shared links working.
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Screen><Dashboard /></Screen> },
      { path: 'practice', element: <Screen><PracticeSetup /></Screen> },
      { path: 'practice/run', element: <Screen><Session /></Screen> },
      { path: 'exam', element: <Screen><ExamIntro /></Screen> },
      { path: 'exam/run', element: <Screen><Session /></Screen> },
      { path: 'results/:attemptId', element: <Screen><Results /></Screen> },
      { path: 'history', element: <Screen><History /></Screen> },
      { path: 'settings', element: <Screen><Settings /></Screen> },
      { path: '*', element: <Screen><NotFound /></Screen> },
    ],
  },
]);
