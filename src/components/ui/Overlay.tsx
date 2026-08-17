import { cn } from "@/lib/cn";
import { usePrefersReduced } from "@/lib/motion";
import { X } from "@phosphor-icons/react";
import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const reduce = usePrefersReduced();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-3 md:items-center">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-[rgb(2_8_16/0.62)]"
        style={{ opacity: 1, transition: reduce ? "none" : "opacity 250ms var(--ease-out)" }}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "glass atlas-scroll relative z-10 max-h-[88dvh] w-full overflow-auto rounded-[28px] p-5 md:p-6",
          wide ? "max-w-2xl" : "max-w-lg",
        )}
        style={{
          transformOrigin: "center",
          animation: reduce ? "none" : "modalIn 250ms var(--ease-out)",
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="modal-title" className="catalog text-3xl text-[var(--bone)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[var(--muted)]"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
      <style>{`@keyframes modalIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const reduce = usePrefersReduced();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end md:hidden">
      <button aria-label="Close" className="absolute inset-0 bg-[rgb(2_8_16/0.5)]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="glass atlas-scroll relative max-h-[82dvh] w-full overflow-auto rounded-t-[28px] p-5"
        style={{ transform: reduce ? undefined : undefined, animation: reduce ? "none" : "sheetIn 420ms var(--ease-drawer)" }}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-[color-mix(in_srgb,var(--ink)_18%,transparent)]" />
        <h2 className="catalog mb-4 text-3xl text-[var(--bone)]">{title}</h2>
        {children}
      </div>
      <style>{`@keyframes sheetIn { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
