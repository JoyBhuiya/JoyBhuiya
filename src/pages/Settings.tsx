import { useRef, useState } from 'react';
import { useProgress } from '@/state/ProgressContext';
import { useTheme } from '@/state/ThemeContext';
import { normalise } from '@/lib/storage';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import type { ThemePreference } from '@/types/progress';
import { cn } from '@/lib/cn';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function Settings() {
  const { state, updateSettings, resetProgress, importState } = useProgress();
  const { preference, setPreference } = useTheme();
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `life-in-the-uk-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    setImportError(null);
    try {
      const parsed: unknown = JSON.parse(await file.text());
      importState(normalise(parsed));
    } catch {
      setImportError('That file could not be read. It should be a progress file exported here.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <p className="text-ink-faint font-mono text-xs tracking-widest uppercase">Settings</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Preferences</h1>

      <section className="mt-8" aria-labelledby="theme-heading">
        <h2 id="theme-heading" className="text-sm font-semibold">
          Appearance
        </h2>
        <div className="mt-3 flex gap-2" role="group" aria-labelledby="theme-heading">
          {THEMES.map((theme) => (
            <button
              key={theme.value}
              type="button"
              onClick={() => setPreference(theme.value)}
              aria-pressed={preference === theme.value}
              className={cn(
                'min-h-11 flex-1 rounded-[--radius] border-2 text-sm font-medium transition-colors',
                preference === theme.value
                  ? 'border-motorway bg-motorway text-on-motorway'
                  : 'border-line bg-surface text-ink hover:bg-surface-2',
              )}
            >
              {theme.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8" aria-labelledby="behaviour-heading">
        <h2 id="behaviour-heading" className="text-sm font-semibold">
          Behaviour
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          <Toggle
            label="Explain answers as I practise"
            description="Shows whether you were right, with the explanation, before moving on. Mock exams are never affected."
            checked={state.settings.instantFeedback}
            onChange={(instantFeedback) => updateSettings({ instantFeedback })}
          />
          <Toggle
            label="Announce time remaining"
            description="Reads out a warning at 10, 5 and 1 minute during a mock exam."
            checked={state.settings.timerAnnouncements}
            onChange={(timerAnnouncements) => updateSettings({ timerAnnouncements })}
          />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="data-heading">
        <h2 id="data-heading" className="text-sm font-semibold">
          Your data
        </h2>
        <p className="text-ink-muted mt-2 text-sm leading-relaxed">
          Everything is stored in this browser only — nothing is sent anywhere. That also means
          clearing your browser data will wipe your progress, so export a copy if it matters to
          you.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={exportProgress}>
            Export progress
          </Button>
          <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
            Import progress
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImport(file);
              event.target.value = '';
            }}
          />
          <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
            Reset everything
          </Button>
        </div>

        {importError && (
          <p role="alert" className="text-stop mt-3 text-sm">
            {importError}
          </p>
        )}
      </section>

      <Card className="mt-10">
        <CardBody>
          <h2 className="text-sm font-semibold">About these questions</h2>
          <p className="text-ink-muted mt-2 text-sm leading-relaxed">
            The real test questions are never published by the Home Office, and other sites’ banks
            are copyrighted. Every question here was written fresh from the factual content of the
            official handbook,{' '}
            <em>Life in the United Kingdom: A Guide for New Residents</em> (3rd edition). Use it to
            learn the material — but read the handbook too.
          </p>
          <p className="text-ink-faint mt-3 text-xs leading-relaxed">
            This is an independent study tool with no affiliation to the Home Office or UK Visas
            and Immigration.
          </p>
        </CardBody>
      </Card>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset everything?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetProgress();
                setConfirmReset(false);
              }}
            >
              Delete my progress
            </Button>
          </>
        }
      >
        <p>
          This deletes every attempt, your streak, your badges and your per-question stats. It
          cannot be undone. Export first if you might want it back.
        </p>
      </Dialog>
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="border-line bg-surface hover:bg-surface-2 flex cursor-pointer items-start gap-3 rounded-[--radius] border px-4 py-3.5 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-[--focus] has-[:focus-visible]:outline-offset-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'bg-motorway' : 'bg-surface-3',
        )}
      >
        <span
          className={cn(
            'h-5 w-5 rounded-full bg-white shadow-sm transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </span>
      <span className="flex-1">
        <span className="text-ink block text-sm font-medium">{label}</span>
        <span className="text-ink-muted mt-0.5 block text-xs leading-relaxed">{description}</span>
      </span>
    </label>
  );
}
