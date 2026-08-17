import { cn } from "@/lib/cn";
import type { AtlasInscription } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";
import { X } from "@phosphor-icons/react";
import { useRef, useState, type PointerEvent } from "react";

export function InscriptionNode({
  item,
  selected,
  canEdit,
}: {
  item: AtlasInscription;
  selected: boolean;
  canEdit: boolean;
}) {
  const selectInscription = useFamilyStore((s) => s.selectInscription);
  const updateInscription = useFamilyStore((s) => s.updateInscription);
  const removeInscription = useFamilyStore((s) => s.removeInscription);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!canEdit) return;
    if ((event.target as HTMLElement).closest("input, button")) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: item.x, oy: item.y };
    selectInscription(item.id);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    event.stopPropagation();
    const k = useFamilyStore.getState().viewport.k;
    setOffset({
      x: (event.clientX - drag.current.x) / k,
      y: (event.clientY - drag.current.y) / k,
    });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (drag.current) {
      const k = useFamilyStore.getState().viewport.k;
      void updateInscription(item.id, {
        x: drag.current.ox + (event.clientX - drag.current.x) / k,
        y: drag.current.oy + (event.clientY - drag.current.y) / k,
      });
    }
    drag.current = null;
    setOffset({ x: 0, y: 0 });
  }

  return (
    <div
      data-inscription
      className={cn("absolute z-[2] min-w-40", selected && "z-10")}
      style={{ left: item.x + offset.x, top: item.y + offset.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className={cn("rounded-2xl px-3 py-2", selected && canEdit && "ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-[var(--sky)]")}>
        {canEdit ? (
          <input
            value={item.text}
            aria-label={item.kind === "title" ? "Atlas name" : "Section label"}
            onChange={(event) => void updateInscription(item.id, { text: event.target.value })}
            className={cn(
              "catalog w-[min(28rem,70vw)] bg-transparent text-[var(--bone)] outline-none",
              item.kind === "title"
                ? "text-3xl uppercase tracking-[0.14em]"
                : "text-xl uppercase tracking-[0.16em] text-[var(--gold)]",
            )}
          />
        ) : (
          <p
            className={cn(
              "catalog text-[var(--bone)]",
              item.kind === "title"
                ? "text-3xl uppercase tracking-[0.14em]"
                : "text-xl uppercase tracking-[0.16em] text-[var(--gold)]",
            )}
          >
            {item.text}
          </p>
        )}
      </div>
      {selected && canEdit ? (
        <div className="mt-1 flex gap-1">
          <button
            type="button"
            className="rounded-full px-2 py-1 text-xs text-[var(--gold)]"
            onClick={() => void updateInscription(item.id, { kind: item.kind === "title" ? "section" : "title" })}
          >
            {item.kind === "title" ? "Make section" : "Make title"}
          </button>
          <button
            type="button"
            className="rounded-full p-1 text-[var(--muted)]"
            aria-label="Remove label"
            onClick={() => void removeInscription(item.id)}
          >
            <X size={14} />
          </button>
        </div>
      ) : null}
    </div>
  );
}
