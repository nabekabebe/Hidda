import { ContextMenu } from "@/components/chrome/ContextMenu";
import { FilterPanel } from "@/components/chrome/FilterPanel";
import { InstrumentBar } from "@/components/chrome/InstrumentBar";
import { SearchPalette } from "@/components/chrome/SearchPalette";
import { SharePanel } from "@/components/chrome/SharePanel";
import { EmptySky } from "@/components/app/EmptySky";
import { formTitle } from "@/components/person/formTitle";
import { PersonComposer } from "@/components/person/PersonComposer";
import { ProfileSlip } from "@/components/person/ProfileSlip";
import { TreeCanvas } from "@/components/tree/TreeCanvas";
import { Button } from "@/components/ui/Button";
import { Modal, Sheet } from "@/components/ui/Overlay";
import { childrenOf, partnersOf } from "@/domain/graph";
import { displayName } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useIsMobile } from "@/lib/media";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

export function TreePage() {
  const people = useFamilyStore((s) => s.people);
  const atlasName = useFamilyStore((s) => s.atlasName);
  const access = useFamilyStore((s) => s.access);
  const shareMissing = useFamilyStore((s) => s.shareMissing);
  const placingLabel = useFamilyStore((s) => s.placingLabel);
  const setPlacingLabel = useFamilyStore((s) => s.setPlacingLabel);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const ready = useFamilyStore((s) => s.ready);
  const panel = useFamilyStore((s) => s.panel);
  const selectedId = useFamilyStore((s) => s.selectedId);
  const closePanel = useFamilyStore((s) => s.closePanel);
  const removePerson = useFamilyStore((s) => s.removePerson);
  const graph = useFamilyStore((s) => s.graph);
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [params] = useSearchParams();
  const mobile = useIsMobile();

  useEffect(() => {
    const focus = params.get("focus");
    if (focus) useFamilyStore.getState().centerOn(focus);
  }, [params]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        useFamilyStore.getState().setPanel({ type: "search" });
        return;
      }
      if (event.key === "Escape") {
        closePanel();
        setMenu(null);
        setPlacingLabel(false);
        return;
      }
      const typing = (event.target as HTMLElement).closest("input, textarea, select");
      if (typing) return;
      if (canEdit && event.key.toLowerCase() === "n") {
        useFamilyStore.getState().openForm({ fromId: useFamilyStore.getState().selectedId ?? undefined });
      }
      if (canEdit && event.key.toLowerCase() === "t") {
        setPlacingLabel(!useFamilyStore.getState().placingLabel);
      }
      if (event.key === "+" || event.key === "=") {
        const v = useFamilyStore.getState().viewport;
        useFamilyStore.getState().setViewport({ ...v, k: Math.min(1.8, v.k * 1.12) });
      }
      if (event.key === "-" || event.key === "_") {
        const v = useFamilyStore.getState().viewport;
        useFamilyStore.getState().setViewport({ ...v, k: Math.max(0.28, v.k / 1.12) });
      }
      if (event.key.toLowerCase() === "f") useFamilyStore.getState().fitTree();
      if (event.key.toLowerCase() === "h") window.location.assign("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closePanel, canEdit, setPlacingLabel]);

  if (!ready) {
    return <div className="grid h-full place-items-center text-[var(--muted)]">Charting the sky…</div>;
  }

  if (shareMissing) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="catalog text-4xl text-[var(--bone)]">This share link was not found</p>
        <p className="mt-4 max-w-[36ch] text-[var(--muted)]">Ask for a new link, or open the atlas this was copied from.</p>
        <div className="mt-8">
          <Button type="button" onClick={() => window.location.assign("/")}>
            Back home
          </Button>
        </div>
      </div>
    );
  }

  if (people.length === 0) return <EmptySky />;

  const selected = people.find((person) => person.id === selectedId);
  const formOpen = panel.type === "form";
  const searchOpen = panel.type === "search";
  const filtersOpen = panel.type === "filters";
  const shortcutsOpen = panel.type === "shortcuts";
  const shareOpen = panel.type === "share";
  const deleting = panel.type === "confirm-delete" ? people.find((person) => person.id === panel.personId) : undefined;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[var(--sky)]">
      <TreeCanvas
        onMenu={(event, id) => {
          event.preventDefault();
          setMenu({ id, x: event.clientX, y: event.clientY });
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-5 z-20 hidden justify-center md:flex">
        <p className="catalog text-sm uppercase tracking-[0.42em] text-[var(--bone)]">{atlasName}</p>
      </div>
      {access !== "owner" ? (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-20 flex justify-center md:top-12">
          <p className="catalog rounded-full bg-[color-mix(in_srgb,var(--sky)_70%,transparent)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
            {access === "view" ? "View only link" : "Editing a shared copy"}
          </p>
        </div>
      ) : null}
      {placingLabel ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
          <p className="catalog rounded-full bg-[color-mix(in_srgb,var(--sky)_70%,transparent)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
            Click the sky to place a label
          </p>
        </div>
      ) : null}
      <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 md:left-4 md:top-1/2 md:translate-x-0 md:-translate-y-1/2">
        <InstrumentBar />
      </div>
      {selected ? (
        <div className="absolute bottom-0 right-0 top-0 z-20 hidden w-[320px] p-4 md:block">
          <ProfileSlip person={selected} />
        </div>
      ) : null}
      {menu ? (
        <>
          <button className="fixed inset-0 z-40" aria-label="Dismiss menu" onClick={() => setMenu(null)} />
          <ContextMenu personId={menu.id} x={menu.x} y={menu.y} onClose={() => setMenu(null)} />
        </>
      ) : null}

      <Modal open={formOpen && !mobile} title={panel.type === "form" ? formTitle(panel) : "Place a person"} onClose={closePanel} wide>
        {formOpen ? <PersonComposer /> : null}
      </Modal>
      <Sheet open={formOpen && mobile} title={panel.type === "form" ? formTitle(panel) : "Place a person"} onClose={closePanel}>
        {formOpen ? <PersonComposer /> : null}
      </Sheet>
      <Modal open={searchOpen} title="Find someone" onClose={closePanel}>
        <SearchPalette onClose={closePanel} />
      </Modal>
      <Modal open={filtersOpen} title="Filter the sky" onClose={closePanel}>
        <FilterPanel />
      </Modal>
      <Modal open={shortcutsOpen} title="Shortcuts" onClose={closePanel}>
        <ul className="grid gap-2 text-sm">
          <li>⌘/Ctrl + K Search</li>
          <li>N Add person</li>
          <li>T Place a label</li>
          <li>Esc Close</li>
          <li>+ Zoom in</li>
          <li>- Zoom out</li>
          <li>F Fit tree</li>
          <li>H Home</li>
        </ul>
      </Modal>
      <Modal open={shareOpen && !mobile} title="Share and export" onClose={closePanel}>
        <SharePanel />
      </Modal>
      <Sheet open={shareOpen && mobile} title="Share and export" onClose={closePanel}>
        <SharePanel />
      </Sheet>
      <Modal open={Boolean(deleting)} title="Remove this star?" onClose={closePanel}>
        {deleting ? (
          <DeleteCopy personId={deleting.id} name={displayName(deleting)} onCancel={closePanel} onConfirm={async () => {
            await removePerson(deleting.id);
            toast.success("Person deleted");
          }} graph={graph()} />
        ) : null}
      </Modal>
      <Sheet open={panel.type === "profile" && mobile} title={selected ? displayName(selected) : "Catalog"} onClose={closePanel}>
        {selected ? <ProfileSlip person={selected} /> : null}
      </Sheet>
    </div>
  );
}

function DeleteCopy({
  personId,
  name,
  graph,
  onCancel,
  onConfirm,
}: {
  personId: string;
  name: string;
  graph: ReturnType<ReturnType<typeof useFamilyStore.getState>["graph"]>;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const kids = childrenOf(graph, personId).length;
  const partners = partnersOf(graph, personId).length;
  return (
    <div className="grid gap-4">
      <p className="text-sm leading-relaxed text-[var(--ink)]">
        Removing {name} also removes their connecting lines. Children ({kids}) and partners ({partners}) stay in the sky, but this person will no longer sit between them.
      </p>
      <div className="flex justify-end gap-2">
        <Button tone="ghost" onClick={onCancel}>Keep</Button>
        <Button tone="danger" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  );
}
