import { PersonForm } from "@/components/person/PersonForm";
import { relationCopy } from "@/components/person/formTitle";
import { StarDisk } from "@/components/person/StarDisk";
import { Button } from "@/components/ui/Button";
import { connectCandidates } from "@/domain/graph";
import { searchPeople } from "@/domain/search";
import { catalogYear, displayName, emptyDraft, type CompassRelation } from "@/domain/types";
import { draftFromPerson, useFamilyStore } from "@/store/useFamilyStore";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export function PersonComposer() {
  const panel = useFamilyStore((s) => s.panel);
  const people = useFamilyStore((s) => s.people);
  const closePanel = useFamilyStore((s) => s.closePanel);
  const addRelated = useFamilyStore((s) => s.addRelated);
  const linkRelated = useFamilyStore((s) => s.linkRelated);
  const savePerson = useFamilyStore((s) => s.savePerson);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const fromId = panel.type === "form" ? panel.fromId : undefined;
  const relation = panel.type === "form" ? panel.relation : undefined;

  useEffect(() => {
    setMode("new");
  }, [fromId, relation]);

  if (panel.type !== "form") return null;

  const editing = panel.personId ? people.find((person) => person.id === panel.personId) : undefined;
  const relating = Boolean(panel.fromId && panel.relation && !panel.personId);

  async function onSubmit(draft: Parameters<typeof savePerson>[1]) {
    if (panel.type !== "form") return;
    if (panel.personId) {
      await savePerson(panel.personId, draft);
      toast.success("Person updated");
    } else if (panel.fromId && panel.relation) {
      await addRelated(panel.fromId, panel.relation, draft);
      toast.success("Relationship created");
    } else {
      await savePerson(undefined, draft);
      toast.success("Person added");
    }
  }

  return (
    <div className="grid gap-4">
      {relating ? (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="How to add this person">
          <ModeChip active={mode === "new"} onClick={() => setMode("new")}>
            New person
          </ModeChip>
          <ModeChip active={mode === "existing"} onClick={() => setMode("existing")}>
            Already here
          </ModeChip>
        </div>
      ) : null}
      {relating && mode === "existing" && panel.fromId && panel.relation ? (
        <ConnectExisting
          fromId={panel.fromId}
          relation={panel.relation}
          onCancel={closePanel}
          onConnect={async (toId) => {
            await linkRelated(panel.fromId!, panel.relation!, toId);
            toast.success(relationCopy[panel.relation!].done);
          }}
        />
      ) : (
        <PersonForm
          initial={editing ? draftFromPerson(editing) : emptyDraft()}
          submitLabel={editing ? "Save" : relating ? "Place in the sky" : "Place in the sky"}
          onCancel={closePanel}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}

function ConnectExisting({
  fromId,
  relation,
  onCancel,
  onConnect,
}: {
  fromId: string;
  relation: CompassRelation;
  onCancel: () => void;
  onConnect: (toId: string) => Promise<void>;
}) {
  const graph = useFamilyStore((s) => s.graph)();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const candidates = useMemo(() => connectCandidates(graph, fromId, relation), [graph, fromId, relation]);
  const hits = useMemo(() => {
    const q = query.trim();
    if (!q) return candidates;
    const matched = new Set(searchPeople(candidates, q).map((hit) => hit.person.id));
    return candidates.filter((person) => matched.has(person.id));
  }, [candidates, query]);

  useEffect(() => {
    input.current?.focus();
  }, []);

  return (
    <div className="grid gap-3">
      <p className="text-sm text-[var(--muted)]">{relationCopy[relation].connect}</p>
      <label className="flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] px-3 py-2">
        <MagnifyingGlass size={16} />
        <input
          ref={input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find them by name"
          className="w-full bg-transparent outline-none"
          aria-label="Search people already in the sky"
        />
      </label>
      <ul className="grid max-h-[42dvh] gap-1 overflow-auto">
        {hits.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              disabled={busyId !== null}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left disabled:opacity-40"
              onClick={async () => {
                setBusyId(person.id);
                setError("");
                try {
                  await onConnect(person.id);
                } catch {
                  setError("Could not connect those people. Try another star.");
                  setBusyId(null);
                }
              }}
            >
              <StarDisk person={person} size={36} />
              <span>
                <span className="catalog block text-xl leading-none">{displayName(person)}</span>
                <span className="text-xs text-[var(--muted)]">
                  {busyId === person.id ? "Connecting…" : catalogYear(person) || "No catalog year"}
                </span>
              </span>
            </button>
          </li>
        ))}
        {hits.length === 0 ? (
          <li className="px-2 text-sm text-[var(--muted)]">
            {candidates.length === 0
              ? "Everyone who can take this place is already connected."
              : "No one matches that catalog line."}
          </li>
        ) : null}
      </ul>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="flex justify-end">
        <Button type="button" tone="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ModeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-[var(--gold)] px-3 py-1 text-sm text-[var(--sky-deep)]"
          : "rounded-full border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] px-3 py-1 text-sm"
      }
    >
      {children}
    </button>
  );
}
