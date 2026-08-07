import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import App from '@/App';
import { ProgressProvider } from '@/state/ProgressContext';
import { ThemeProvider } from '@/state/ThemeContext';
import { SessionProvider } from '@/state/SessionContext';
import { AnnounceProvider } from '@/hooks/useAnnounce';
import Dashboard from '@/pages/Dashboard';
import ExamIntro from '@/pages/ExamIntro';
import SessionPage from '@/pages/Session';
import Results from '@/pages/Results';
import { EXAM_QUESTION_COUNT } from '@/types/exam';

function renderApp(initialPath = '/') {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <App />,
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'exam', element: <ExamIntro /> },
          { path: 'exam/run', element: <SessionPage /> },
          { path: 'results/:attemptId', element: <Results /> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  );

  return render(
    <ProgressProvider>
      <ThemeProvider>
        <AnnounceProvider>
          <SessionProvider>
            <RouterProvider router={router} />
          </SessionProvider>
        </AnnounceProvider>
      </ThemeProvider>
    </ProgressProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

/** Single-answer questions render radios, select-two questions render checkboxes. */
async function findOptions(): Promise<HTMLElement[]> {
  const radios = screen.queryAllByRole('radio');
  if (radios.length > 0) return radios;
  return screen.findAllByRole('checkbox');
}

describe('mock exam', () => {
  it('runs a full paper from start to results', async () => {
    const user = userEvent.setup();
    renderApp('/exam');

    await user.click(await screen.findByRole('button', { name: /start the exam/i }));

    // Every question is answerable and the counter advances.
    for (let i = 0; i < EXAM_QUESTION_COUNT; i += 1) {
      await screen.findByText(new RegExp(`Question ${i + 1} of ${EXAM_QUESTION_COUNT}`));
      const options = await findOptions();
      await user.click(options[0]);
      if (i < EXAM_QUESTION_COUNT - 1) {
        await user.click(screen.getByRole('button', { name: /^next$/i }));
      }
    }

    await user.click(screen.getByRole('button', { name: /finish exam/i }));
    await user.click(await screen.findByRole('button', { name: /submit exam/i }));

    // Results screen: a score out of 24 and a pass/fail verdict.
    await waitFor(() => {
      expect(screen.getByText(/\/24/)).toBeInTheDocument();
    });
    expect(screen.getByText(/^(Pass|Not passed)$/)).toBeInTheDocument();
  }, 60_000);

  it('keeps a selection when you navigate back to a question', async () => {
    const user = userEvent.setup();
    renderApp('/exam');
    await user.click(await screen.findByRole('button', { name: /start the exam/i }));

    await screen.findByText(/Question 1 of 24/);
    const first = (await findOptions())[1];
    await user.click(first);
    expect(first).toBeChecked();

    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await screen.findByText(/Question 2 of 24/);
    await user.click(screen.getByRole('button', { name: /^back$/i }));

    await screen.findByText(/Question 1 of 24/);
    const restored = (await findOptions())[1];
    expect(restored).toBeChecked();
  }, 30_000);

  it('reports the number of unanswered questions before submitting', async () => {
    const user = userEvent.setup();
    renderApp('/exam');
    await user.click(await screen.findByRole('button', { name: /start the exam/i }));

    // Jump straight to the last question via the review grid.
    await screen.findByText(/Question 1 of 24/);
    await user.click(screen.getByRole('button', { name: /review all/i }));
    await user.click(await screen.findByRole('button', { name: /^Question 24,/ }));

    await user.click(await screen.findByRole('button', { name: /finish exam/i }));
    expect(await screen.findByText(/24 unanswered questions/i)).toBeInTheDocument();
    expect(screen.getByText(/marked wrong/i)).toBeInTheDocument();
  }, 30_000);

  it('marks the flag button as pressed when a question is flagged', async () => {
    const user = userEvent.setup();
    renderApp('/exam');
    await user.click(await screen.findByRole('button', { name: /start the exam/i }));

    const flag = await screen.findByRole('button', { name: /^flag$/i });
    expect(flag).toHaveAttribute('aria-pressed', 'false');
    await user.click(flag);
    expect(await screen.findByRole('button', { name: /flagged/i })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  }, 30_000);
});

describe('exam accessibility', () => {
  it('groups options in a fieldset with a legend', async () => {
    const user = userEvent.setup();
    renderApp('/exam');
    await user.click(await screen.findByRole('button', { name: /start the exam/i }));

    await screen.findByText(/Question 1 of 24/);
    expect(screen.getByRole('group', { name: /select (one|the two) answers?/i })).toBeInTheDocument();
  }, 30_000);

  it('exposes the countdown as a timer with a minute-level label', async () => {
    const user = userEvent.setup();
    renderApp('/exam');
    await user.click(await screen.findByRole('button', { name: /start the exam/i }));

    const timer = await screen.findByRole('timer');
    expect(timer).toHaveAttribute('aria-label', expect.stringMatching(/\d+ minutes? remaining/));
    // A per-second live region would be unusable with a screen reader.
    expect(timer).toHaveAttribute('aria-live', 'off');
  }, 30_000);
});
