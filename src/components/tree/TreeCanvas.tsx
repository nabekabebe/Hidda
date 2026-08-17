import { RelLines } from "@/components/tree/RelLines";
import { MiniMap } from "@/components/tree/MiniMap";
import { PersonNode } from "@/components/tree/PersonNode";
import { InscriptionNode } from "@/components/tree/InscriptionNode";
import { NODE_H, NODE_W } from "@/domain/layout";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useCallback, useEffect, useRef, type MouseEvent } from "react";

export function TreeCanvas({
  onMenu,
}: {
  onMenu: (event: MouseEvent, id: string) => void;
}) {
  const people = useFamilyStore((s) => s.people);
  const inscriptions = useFamilyStore((s) => s.inscriptions);
  const layout = useFamilyStore((s) => s.layout)();
  const selectedId = useFamilyStore((s) => s.selectedId);
  const selectedInscriptionId = useFamilyStore((s) => s.selectedInscriptionId);
  const highlightId = useFamilyStore((s) => s.highlightId);
  const visibleIds = useFamilyStore((s) => s.visibleIds)();
  const focusMode = useFamilyStore((s) => s.focusMode);
  const requestFit = useFamilyStore((s) => s.requestFit);
  const requestCenterId = useFamilyStore((s) => s.requestCenterId);
  const setViewport = useFamilyStore((s) => s.setViewport);
  const view = useFamilyStore((s) => s.viewport);
  const select = useFamilyStore((s) => s.select);
  const selectInscription = useFamilyStore((s) => s.selectInscription);
  const placingLabel = useFamilyStore((s) => s.placingLabel);
  const addInscription = useFamilyStore((s) => s.addInscription);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const wrap = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const apply = useCallback((next: { x: number; y: number; k: number }) => {
    setViewport(next);
  }, [setViewport]);

  function fit() {
    const el = wrap.current;
    if (!el || layout.width === 0) return;
    let minX = 0;
    let minY = 0;
    let maxX = layout.width;
    let maxY = layout.height;
    for (const item of inscriptions) {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + 320);
      maxY = Math.max(maxY, item.y + 80);
    }
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    const vw = el.clientWidth;
    const vh = el.clientHeight;
    const k = Math.min(vw / width, vh / height) * 0.9;
    apply({
      x: (vw - (minX + width) * k) / 2 - minX * k,
      y: Math.max(24, (vh - (minY + height) * k) / 2 - minY * k),
      k: Math.min(1.1, Math.max(0.35, k)),
    });
  }

  function center(id: string) {
    const el = wrap.current;
    const pos = layout.positions.get(id);
    if (!el || !pos) return;
    apply({
      x: el.clientWidth / 2 - (pos.x + NODE_W / 2) * view.k,
      y: el.clientHeight / 2 - (pos.y + 48) * view.k,
      k: Math.max(view.k, 0.92),
    });
  }

  useEffect(() => {
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestFit, people.length]);

  useEffect(() => {
    if (requestCenterId) center(requestCenterId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestCenterId]);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      const delta = event.deltaY > 0 ? 0.92 : 1.08;
      const k = Math.min(1.8, Math.max(0.28, view.k * delta));
      const x = px - ((px - view.x) / view.k) * k;
      const y = py - ((py - view.y) / view.k) * k;
      apply({ x, y, k });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [view, apply]);

  return (
    <div
      ref={wrap}
      className="relative h-full w-full touch-none overflow-hidden bg-[var(--sky)]"
      style={{ cursor: placingLabel ? "crosshair" : undefined }}
      onPointerDown={(event) => {
        if (placingLabel) return;
        if ((event.target as HTMLElement).closest("button, a, input, [data-inscription]")) return;
        drag.current = { x: event.clientX, y: event.clientY, vx: view.x, vy: view.y };
        (event.currentTarget as HTMLDivElement).setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!drag.current) return;
        apply({
          ...view,
          x: drag.current.vx + (event.clientX - drag.current.x),
          y: drag.current.vy + (event.clientY - drag.current.y),
        });
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onClick={(event) => {
        if (placingLabel && canEdit) {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left - view.x) / view.k;
          const y = (event.clientY - rect.top - view.y) / view.k;
          void addInscription({ x, y, kind: "section" });
          return;
        }
        if (event.target === event.currentTarget) {
          select(null);
          selectInscription(null);
        }
      }}
    >
      <div
        data-atlas-export
        className="absolute left-0 top-0 origin-top-left will-change-transform"
        style={{
          width: layout.width,
          height: layout.height,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.k})`,
        }}
      >
        <RelLines edges={layout.edges} positions={layout.positions} />
        {inscriptions.map((item) => (
          <div key={item.id} data-inscription>
            <InscriptionNode item={item} selected={selectedInscriptionId === item.id} canEdit={canEdit} />
          </div>
        ))}
        {people.map((person) => {
          const pos = layout.positions.get(person.id);
          if (!pos) return null;
          const ghost = !visibleIds.has(person.id) || (focusMode && selectedId !== person.id);
          return (
            <div key={person.id} className="absolute" style={{ left: pos.x, top: pos.y, width: NODE_W, height: NODE_H }}>
              <PersonNode
                person={person}
                selected={selectedId === person.id}
                highlight={highlightId === person.id}
                ghost={ghost}
                onOpenMenu={onMenu}
              />
            </div>
          );
        })}
      </div>
      <div className="pointer-events-auto absolute bottom-4 right-4 hidden md:block">
        <MiniMap
          people={people}
          positions={layout.positions}
          viewport={view}
          width={layout.width}
          height={layout.height}
          viewW={wrap.current?.clientWidth ?? 1200}
          viewH={wrap.current?.clientHeight ?? 800}
          onJump={(x, y) => {
            const el = wrap.current;
            if (!el) return;
            apply({
              x: el.clientWidth / 2 - x * view.k,
              y: el.clientHeight / 2 - y * view.k,
              k: view.k,
            });
          }}
        />
      </div>
    </div>
  );
}
