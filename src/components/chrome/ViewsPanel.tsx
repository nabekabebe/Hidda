import { StarDisk } from "@/components/person/StarDisk";
import { Button } from "@/components/ui/Button";
import { generationIndex } from "@/domain/graph";
import { eventsForPerson, eventLabel } from "@/domain/events";
import { isDisconnected, relationToHome } from "@/domain/kin";
import { fanPeople, pedigreeSlots } from "@/domain/pedigree";
import { familyGroupSheet, narrativeReport, peopleCsv, uniquePlaces } from "@/domain/reports";
import { downloadBlob, fileSlug } from "@/lib/exportAtlas";
import { catalogYear, displayName, type Person } from "@/domain/types";
import { cn } from "@/lib/cn";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type Tab = "index" | "pedigree" | "fan" | "timeline" | "reports" | "map";

export function ViewsPanel() {
  const [tab, setTab] = useState<Tab>("index");
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        {(["index", "pedigree", "fan", "timeline", "reports", "map"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={
              tab === item
                ? "rounded-full bg-[var(--gold)] px-3 py-1 text-sm text-[var(--sky-deep)]"
                : "rounded-full border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] px-3 py-1 text-sm"
            }
          >
            {item === "index" ? "People" : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
      {tab === "index" ? <PeopleIndex /> : null}
      {tab === "pedigree" ? <PedigreeView /> : null}
      {tab === "fan" ? <FanView /> : null}
      {tab === "timeline" ? <TimelineView /> : null}
      {tab === "reports" ? <ReportsView /> : null}
      {tab === "map" ? <MapView /> : null}
    </div>
  );
}

function PeopleIndex() {
  const people = useFamilyStore((s) => s.people);
  const graph = useFamilyStore((s) => s.graph)();
  const homePersonId = useFamilyStore((s) => s.homePersonId);
  const centerOn = useFamilyStore((s) => s.centerOn);
  const closePanel = useFamilyStore((s) => s.closePanel);
  const [sort, setSort] = useState<"name" | "year" | "gen">("name");
  const rows = useMemo(() => {
    const list = [...people];
    list.sort((a, b) => {
      if (sort === "year") return (a.birthDate || "9999").localeCompare(b.birthDate || "9999");
      if (sort === "gen") return generationIndex(graph, a.id) - generationIndex(graph, b.id);
      return displayName(a).localeCompare(displayName(b));
    });
    return list;
  }, [people, sort, graph]);
  const orphans = people.filter((person) => isDisconnected(graph, person.id));

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <SortChip active={sort === "name"} onClick={() => setSort("name")}>Name</SortChip>
        <SortChip active={sort === "year"} onClick={() => setSort("year")}>Born</SortChip>
        <SortChip active={sort === "gen"} onClick={() => setSort("gen")}>Generation</SortChip>
      </div>
      {orphans.length ? (
        <p className="text-sm text-[var(--muted)]">{orphans.length} unlinked {orphans.length === 1 ? "person" : "people"} still sit in the catalog.</p>
      ) : null}
      <ul className="grid max-h-[52dvh] gap-1 overflow-auto">
        {rows.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left"
              onClick={() => {
                centerOn(person.id);
                closePanel();
              }}
            >
              <StarDisk person={person} size={36} />
              <span>
                <span className="catalog block text-xl leading-none">{displayName(person)}</span>
                <span className="text-xs text-[var(--muted)]">
                  {[catalogYear(person), relationToHome(graph, person.id, homePersonId)].filter(Boolean).join(" · ")}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PedigreeView() {
  const graph = useFamilyStore((s) => s.graph)();
  const selectedId = useFamilyStore((s) => s.selectedId);
  const homePersonId = useFamilyStore((s) => s.homePersonId);
  const people = useFamilyStore((s) => s.people);
  const centerOn = useFamilyStore((s) => s.centerOn);
  const rootId = selectedId || homePersonId || people[0]?.id;
  if (!rootId) return <p className="text-sm text-[var(--muted)]">Place a person first.</p>;
  const slots = pedigreeSlots(graph, rootId, 4);
  const gens = [0, 1, 2, 3];
  return (
    <div className="grid gap-3">
      <p className="text-sm text-[var(--muted)]">Ancestors of the selected person, four generations.</p>
      <div className="grid gap-3 overflow-auto">
        {gens.map((gen) => (
          <div key={gen} className="flex flex-wrap justify-center gap-2">
            {slots.filter((slot) => slot.generation === gen).map((slot) => (
              <PedigreeCard key={`${gen}-${slot.slot}`} person={slot.person} onOpen={centerOn} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function PedigreeCard({ person, onOpen }: { person: Person | null; onOpen: (id: string) => void }) {
  if (!person) {
    return <div className="h-16 w-28 rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--ink)_16%,transparent)]" />;
  }
  return (
    <button type="button" onClick={() => onOpen(person.id)} className="w-28 rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] px-2 py-2 text-left">
      <span className="catalog block text-sm leading-none">{person.firstName}</span>
      <span className="text-[11px] text-[var(--muted)]">{catalogYear(person) || "—"}</span>
    </button>
  );
}

function FanView() {
  const graph = useFamilyStore((s) => s.graph)();
  const selectedId = useFamilyStore((s) => s.selectedId);
  const homePersonId = useFamilyStore((s) => s.homePersonId);
  const people = useFamilyStore((s) => s.people);
  const centerOn = useFamilyStore((s) => s.centerOn);
  const rootId = selectedId || homePersonId || people[0]?.id;
  if (!rootId) return <p className="text-sm text-[var(--muted)]">Place a person first.</p>;
  const nodes = fanPeople(graph, rootId, 5);
  const size = 420;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <div className="grid gap-3">
      <p className="text-sm text-[var(--muted)]">Fan of ancestors. Inner ring is the selected person.</p>
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[420px]" role="img" aria-label="Ancestor fan chart">
        {nodes.map((node, index) => {
          const count = Math.max(1, nodes.filter((item) => item.generation === node.generation).length);
          const order = nodes.filter((item) => item.generation === node.generation).findIndex((item) => item.person.id === node.person.id);
          const inner = 28 + node.generation * 34;
          const outer = inner + 32;
          const start = (order / count) * Math.PI * 2 - Math.PI / 2;
          const end = ((order + 1) / count) * Math.PI * 2 - Math.PI / 2;
          const large = end - start > Math.PI ? 1 : 0;
          const path = [
            `M ${cx + Math.cos(start) * inner} ${cy + Math.sin(start) * inner}`,
            `L ${cx + Math.cos(start) * outer} ${cy + Math.sin(start) * outer}`,
            `A ${outer} ${outer} 0 ${large} 1 ${cx + Math.cos(end) * outer} ${cy + Math.sin(end) * outer}`,
            `L ${cx + Math.cos(end) * inner} ${cy + Math.sin(end) * inner}`,
            `A ${inner} ${inner} 0 ${large} 0 ${cx + Math.cos(start) * inner} ${cy + Math.sin(start) * inner}`,
          ].join(" ");
          return (
            <g key={`${node.person.id}-${index}`}>
              <path d={path} fill="color-mix(in srgb, var(--gold) 18%, transparent)" stroke="var(--gold)" onClick={() => centerOn(node.person.id)} className="cursor-pointer" />
              <title>{displayName(node.person)}</title>
            </g>
          );
        })}
        <text x={cx} y={cy} textAnchor="middle" className="catalog" fill="var(--bone)" fontSize="14">
          {graph.byId.get(rootId)?.firstName}
        </text>
      </svg>
    </div>
  );
}

function TimelineView() {
  const people = useFamilyStore((s) => s.people);
  const events = useFamilyStore((s) => s.events);
  const relationships = useFamilyStore((s) => s.relationships);
  const centerOn = useFamilyStore((s) => s.centerOn);
  const closePanel = useFamilyStore((s) => s.closePanel);
  const items = useMemo(() => {
    const rows: { year: string; label: string; personId: string }[] = [];
    for (const person of people) {
      if (person.birthDate) rows.push({ year: person.birthDate, label: `${displayName(person)} born`, personId: person.id });
      if (person.deathDate) rows.push({ year: person.deathDate, label: `${displayName(person)} died`, personId: person.id });
      for (const event of eventsForPerson(events, person.id)) {
        if (event.date) rows.push({ year: event.date, label: `${displayName(person)} · ${eventLabel(event.type)}`, personId: person.id });
      }
    }
    for (const rel of relationships) {
      if (rel.metadata.marriedOn) {
        const a = people.find((person) => person.id === rel.sourcePersonId);
        const b = people.find((person) => person.id === rel.targetPersonId);
        if (a && b) rows.push({ year: rel.metadata.marriedOn, label: `${displayName(a)} married ${displayName(b)}`, personId: a.id });
      }
    }
    const seen = new Set<string>();
    return rows
      .filter((row) => {
        const key = `${row.year}|${row.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => a.year.localeCompare(b.year));
  }, [people, events, relationships]);

  return (
    <ol className="grid max-h-[52dvh] gap-2 overflow-auto border-l border-[color-mix(in_srgb,var(--gold)_40%,transparent)] pl-4">
      {items.map((item) => (
        <li key={`${item.year}-${item.label}`}>
          <button
            type="button"
            className="text-left"
            onClick={() => {
              centerOn(item.personId);
              closePanel();
            }}
          >
            <span className="catalog block text-[11px] uppercase tracking-[0.16em] text-[var(--gold)]">{item.year.slice(0, 4)}</span>
            <span className="text-sm">{item.label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function ReportsView() {
  const snapshot = useFamilyStore((s) => s.snapshot);
  const selectedId = useFamilyStore((s) => s.selectedId);
  const homePersonId = useFamilyStore((s) => s.homePersonId);
  const people = useFamilyStore((s) => s.people);
  const atlasName = useFamilyStore((s) => s.atlasName);
  const rootId = selectedId || homePersonId || people[0]?.id;
  if (!rootId) return <p className="text-sm text-[var(--muted)]">Place a person first.</p>;
  const sheet = familyGroupSheet(snapshot(), rootId);
  const story = narrativeReport(snapshot(), rootId);
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          tone="ghost"
          onClick={() => {
            downloadBlob(new Blob([peopleCsv(snapshot())], { type: "text/csv" }), `${fileSlug(atlasName)}.csv`);
            toast.success("CSV exported");
          }}
        >
          Export CSV
        </Button>
        <Button
          type="button"
          tone="ghost"
          onClick={() => {
            downloadBlob(new Blob([sheet], { type: "text/plain" }), `${fileSlug(atlasName)}-group.txt`);
            toast.success("Group sheet exported");
          }}
        >
          Family group sheet
        </Button>
        <Button
          type="button"
          tone="ghost"
          onClick={() => {
            downloadBlob(new Blob([story], { type: "text/plain" }), `${fileSlug(atlasName)}-narrative.txt`);
            toast.success("Narrative exported");
          }}
        >
          Narrative
        </Button>
      </div>
      <pre className="atlas-scroll max-h-[36dvh] overflow-auto whitespace-pre-wrap text-sm text-[var(--ink)]">{sheet}</pre>
      <p className="font-bio text-sm leading-relaxed">{story}</p>
    </div>
  );
}

function MapView() {
  const snapshot = useFamilyStore((s) => s.snapshot);
  const centerOn = useFamilyStore((s) => s.centerOn);
  const places = uniquePlaces(snapshot());
  if (!places.length) return <p className="text-sm text-[var(--muted)]">Add birthplaces and event places to see them here.</p>;
  return (
    <ul className="grid max-h-[52dvh] gap-2 overflow-auto">
      {places.map((place) => (
        <li key={`${place.personId}-${place.label}`} className="flex items-center justify-between gap-2 text-sm">
          <button type="button" className="text-left" onClick={() => centerOn(place.personId)}>
            {place.label}
          </button>
          <a
            className="text-[var(--gold)]"
            href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(place.label)}`}
            target="_blank"
            rel="noreferrer"
          >
            Map
          </a>
        </li>
      ))}
    </ul>
  );
}

function SortChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" onClick={onClick} className={cn("rounded-full px-3 py-1 text-sm", active ? "bg-[var(--gold)] text-[var(--sky-deep)]" : "border border-[color-mix(in_srgb,var(--ink)_14%,transparent)]")}>
      {children}
    </button>
  );
}

export function ViewsOpenButton() {
  const setPanel = useFamilyStore((s) => s.setPanel);
  return (
    <Button type="button" tone="ghost" onClick={() => setPanel({ type: "views" })}>
      Charts
    </Button>
  );
}
