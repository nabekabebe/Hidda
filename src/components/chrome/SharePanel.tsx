import { createShareRecord } from "@/api/shareClient";
import { Button } from "@/components/ui/Button";
import { displayName } from "@/domain/types";
import { exportGedcom, importGedcom } from "@/domain/gedcom";
import { isShareRecord, normalizeSnapshot, sharePath, sliceSnapshot } from "@/domain/share";
import { captureSnapshotPng, downloadBlob, downloadDataUrl, fileSlug, pngDataUrlToPdfBlob } from "@/lib/exportAtlas";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useState } from "react";
import { toast } from "sonner";

export function SharePanel() {
  const snapshot = useFamilyStore((s) => s.snapshot);
  const selectedId = useFamilyStore((s) => s.selectedId);
  const people = useFamilyStore((s) => s.people);
  const atlasName = useFamilyStore((s) => s.atlasName);
  const setAtlasName = useFamilyStore((s) => s.setAtlasName);
  const importSnapshot = useFamilyStore((s) => s.importSnapshot);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const selected = people.find((person) => person.id === selectedId);
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [scope, setScope] = useState<"tree" | "branch">("tree");
  const [showLiving, setShowLiving] = useState(false);
  const [link, setLink] = useState("");
  const [remote, setRemote] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  function scopedSnapshot() {
    if (scope === "branch" && !selectedId) {
      toast.error("Select a person first to export their descendants.");
      return null;
    }
    return sliceSnapshot(snapshot(), scope === "branch" ? selectedId ?? undefined : undefined);
  }

  function exportName() {
    if (scope === "branch" && selected) return `${displayName(selected)} descendants`;
    return atlasName;
  }

  async function createLink() {
    const sliced = scopedSnapshot();
    if (!sliced) return;
    setBusy(true);
    try {
      const result = await createShareRecord({
        permission,
        scope,
        rootPersonId: scope === "branch" ? selectedId ?? undefined : undefined,
        snapshot: sliced,
        showLiving,
      });
      const url = `${window.location.origin}${sharePath(result.record.token)}`;
      setLink(url);
      setRemote(result.remote);
      await navigator.clipboard.writeText(url);
      toast.success(result.remote ? "Link copied" : "Link copied · works in this browser until a database is linked");
    } catch {
      toast.error("Could not create that link.");
    } finally {
      setBusy(false);
    }
  }

  function exportJson() {
    const sliced = scopedSnapshot();
    if (!sliced) return;
    const blob = new Blob([JSON.stringify(sliced, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${fileSlug(exportName())}.json`);
    toast.success("Catalog exported");
  }

  async function importJson(file?: File | null) {
    if (!file || !canEdit) return;
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const raw = isShareRecord(parsed) ? parsed.snapshot : parsed;
      if (!raw || typeof raw !== "object" || !Array.isArray((raw as { people?: unknown }).people)) {
        toast.error("That file does not look like a Hidda catalog.");
        return;
      }
      const next = normalizeSnapshot(raw);
      await importSnapshot(next);
      toast.success("Catalog restored");
    } catch {
      toast.error("Could not read that JSON backup.");
    }
  }

  function exportGed() {
    const sliced = scopedSnapshot();
    if (!sliced) return;
    const blob = new Blob([exportGedcom(sliced)], { type: "text/plain" });
    downloadBlob(blob, `${fileSlug(exportName())}.ged`);
    toast.success("GEDCOM exported");
  }

  async function importGed(file?: File | null) {
    if (!file || !canEdit) return;
    try {
      const { snapshot: next, skipped } = importGedcom(await file.text());
      if (next.people.length === 0) {
        toast.error("No people were found in that GEDCOM.");
        return;
      }
      await importSnapshot(next);
      toast.success(skipped.length ? `Imported · skipped ${skipped.join(", ")}` : "GEDCOM imported");
    } catch {
      toast.error("Could not read that GEDCOM file.");
    }
  }

  async function exportPng() {
    const sliced = scopedSnapshot();
    if (!sliced) return;
    setBusy(true);
    try {
      const { dataUrl } = await captureSnapshotPng(sliced, scope === "tree");
      downloadDataUrl(dataUrl, `${fileSlug(exportName())}.png`);
      toast.success(scope === "branch" ? "Branch exported" : "Sky exported");
    } catch {
      toast.error("Could not capture the sky.");
    } finally {
      setBusy(false);
    }
  }

  async function exportPdf() {
    const sliced = scopedSnapshot();
    if (!sliced) return;
    setBusy(true);
    try {
      const { dataUrl, background } = await captureSnapshotPng(sliced, scope === "tree");
      const pdf = await pngDataUrlToPdfBlob(dataUrl, background);
      downloadBlob(pdf, `${fileSlug(exportName())}.pdf`);
      toast.success(scope === "branch" ? "Branch PDF exported" : "Sky PDF exported");
    } catch {
      toast.error("Could not export a PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4">
      {canEdit ? (
        <label className="grid gap-1.5">
          <span className="text-sm text-[var(--muted)]">Atlas name</span>
          <input
            value={atlasName}
            onChange={(event) => void setAtlasName(event.target.value)}
            className="w-full rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color-mix(in_srgb,var(--sky)_40%,transparent)] px-3 py-2 text-[var(--ink)] outline-none"
          />
        </label>
      ) : (
        <p className="catalog text-2xl text-[var(--bone)]">{atlasName}</p>
      )}

      <fieldset className="grid gap-2">
        <legend className="text-sm text-[var(--muted)]">What to share or export</legend>
        <div className="flex flex-wrap gap-2">
          <Chip active={scope === "tree"} onClick={() => setScope("tree")}>
            Entire atlas
          </Chip>
          <Chip active={scope === "branch"} onClick={() => setScope("branch")} disabled={!selected}>
            {selected ? `Descendants of ${displayName(selected)}` : "This branch"}
          </Chip>
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="text-sm text-[var(--muted)]">People with the link can</legend>
        <div className="flex flex-wrap gap-2">
          <Chip active={permission === "view"} onClick={() => setPermission("view")}>
            Only view
          </Chip>
          <Chip active={permission === "edit"} onClick={() => setPermission("edit")}>
            Edit
          </Chip>
        </div>
      </fieldset>

      {permission === "view" ? (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={showLiving} onChange={(event) => setShowLiving(event.target.checked)} />
          Show names and dates for living people
        </label>
      ) : null}

      {link ? (
        <p className="break-all rounded-2xl bg-[color-mix(in_srgb,var(--sky)_40%,transparent)] px-3 py-2 text-sm text-[var(--ink)]">
          {link}
          {remote === false ? <span className="mt-1 block text-xs text-[var(--muted)]">Works on this device until a database is linked.</span> : null}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {canEdit ? (
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--ink)_16%,transparent)] px-4 py-2 text-sm">
            Import JSON
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void importJson(event.target.files?.[0])} />
          </label>
        ) : null}
        {canEdit ? (
          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--ink)_16%,transparent)] px-4 py-2 text-sm">
            Import GEDCOM
            <input type="file" accept=".ged,.gedcom,text/plain" className="sr-only" onChange={(event) => void importGed(event.target.files?.[0])} />
          </label>
        ) : null}
        <Button tone="ghost" type="button" disabled={busy} onClick={exportJson}>
          Export JSON
        </Button>
        <Button tone="ghost" type="button" disabled={busy} onClick={exportGed}>
          Export GEDCOM
        </Button>
        <Button tone="ghost" type="button" disabled={busy} onClick={() => void exportPng()}>
          Export PNG
        </Button>
        <Button tone="ghost" type="button" disabled={busy} onClick={() => void exportPdf()}>
          Export PDF
        </Button>
        <Button type="button" disabled={busy} onClick={() => void createLink()}>
          {busy ? "Working…" : "Copy share link"}
        </Button>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[var(--gold)] px-3 py-1 text-sm text-[var(--sky-deep)]"
          : "rounded-full border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] px-3 py-1 text-sm disabled:opacity-40"
      }
    >
      {children}
    </button>
  );
}
