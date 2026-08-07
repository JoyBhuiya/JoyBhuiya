import { LinkButton } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-24 text-center">
      <span
        className="bg-motorway text-on-motorway plate flex h-20 w-20 items-center justify-center font-display text-2xl font-semibold"
        aria-hidden="true"
      >
        404
      </span>
      <h1 className="mt-6 text-2xl font-semibold">No such page</h1>
      <p className="text-ink-muted mt-2 leading-relaxed">
        The link may be out of date. Everything is reachable from the dashboard.
      </p>
      <LinkButton to="/" className="mt-6">
        Back to the dashboard
      </LinkButton>
    </div>
  );
}
