import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Native <dialog> + showModal(). The platform supplies focus trapping, Escape
 * handling, background inertness and focus restoration — all the things a
 * hand-rolled modal gets subtly wrong.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="dialog-title"
      className="bg-surface text-ink border-line m-auto w-[min(30rem,calc(100vw-2rem))] rounded-[--radius-lg] border p-0 shadow-[--shadow-lg] backdrop:bg-black/50 backdrop:backdrop-blur-sm"
    >
      <div className="p-5">
        <h2 id="dialog-title" className="text-lg font-semibold">
          {title}
        </h2>
        <div className="text-ink-muted mt-2 text-sm leading-relaxed">{children}</div>
      </div>
      {footer && (
        <div className="border-line flex flex-wrap justify-end gap-2 border-t px-5 py-4">
          {footer}
        </div>
      )}
    </dialog>
  );
}
