import { StarDisk } from "@/components/person/StarDisk";
import { Button } from "@/components/ui/Button";
import { childrenOf, generationIndex, parentsOf, partnersOf, relationshipLabel, siblingsOf } from "@/domain/graph";
import { catalogYear, displayName, type Person } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";
import { PencilSimple, Trash, UserFocus } from "@phosphor-icons/react";

const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];

export function ProfileSlip({ person }: { person: Person }) {
  const graph = useFamilyStore((s) => s.graph)();
  const openForm = useFamilyStore((s) => s.openForm);
  const setPanel = useFamilyStore((s) => s.setPanel);
  const centerOn = useFamilyStore((s) => s.centerOn);
  const openProfile = useFamilyStore((s) => s.openProfile);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const parents = parentsOf(graph, person.id);
  const children = childrenOf(graph, person.id);
  const partners = partnersOf(graph, person.id);
  const siblings = siblingsOf(graph, person.id);
  const gen = generationIndex(graph, person.id);

  return (
    <aside className="glass atlas-scroll flex h-full w-full flex-col gap-5 overflow-auto rounded-[28px] p-5">
      <div className="flex flex-col items-center gap-3 pt-2">
        <StarDisk person={person} size={128} selected />
        <div className="text-center">
          <div className="catalog text-[2rem] uppercase leading-[1.1] tracking-[0.14em] text-[var(--bone)]">
            {displayName(person)}
          </div>
          {catalogYear(person) ? (
            <div className="catalog mt-2 text-lg tracking-[0.16em] text-[var(--gold)]">{catalogYear(person)}</div>
          ) : null}
        </div>
      </div>
      {person.description ? <p className="font-bio text-[15px] leading-relaxed text-[var(--ink)]">{person.description}</p> : null}
      <dl className="grid gap-3 text-sm">
        <Row label="Born" value={person.birthDate || "Unknown"} />
        <Row label="Birthplace" value={person.location || "Unknown"} />
        <Row label="Generation" value={`${roman[gen] ?? gen + 1} generation`} />
      </dl>
      <RelGroup label="Parents" people={parents} onOpen={openProfile} />
      <RelGroup label="Partner" people={partners} onOpen={openProfile} />
      <RelGroup label="Siblings" people={siblings} onOpen={openProfile} />
      <RelGroup label="Children" people={children} onOpen={openProfile} />
      <div className="mt-auto grid grid-cols-3 gap-2">
        {canEdit ? (
          <Button tone="ghost" onClick={() => openForm({ personId: person.id })} aria-label="Edit person">
            <PencilSimple size={16} />
          </Button>
        ) : <span />}
        <Button tone="ghost" onClick={() => centerOn(person.id)} aria-label="Focus on this person">
          <UserFocus size={16} />
        </Button>
        {canEdit ? (
          <Button tone="ghost" onClick={() => setPanel({ type: "confirm-delete", personId: person.id })} aria-label="Delete person">
            <Trash size={16} />
          </Button>
        ) : <span />}
      </div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="catalog text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]">{label}</dt>
      <dd className="mt-0.5 text-[var(--ink)]">{value}</dd>
    </div>
  );
}

function RelGroup({
  label,
  people,
  onOpen,
}: {
  label: string;
  people: { person: Person; type: string }[];
  onOpen: (id: string) => void;
}) {
  if (!people.length) return null;
  return (
    <section>
      <h3 className="catalog mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]">{label}</h3>
      <ul className="grid gap-2">
        {people.map((item) => (
          <li key={item.person.id}>
            <button
              type="button"
              onClick={() => onOpen(item.person.id)}
              className="flex w-full items-center gap-3 rounded-2xl px-1 py-1 text-left"
            >
              <StarDisk person={item.person} size={36} />
              <span>
                <span className="catalog block text-base uppercase tracking-[0.12em] leading-none">{displayName(item.person)}</span>
                <span className="text-xs text-[var(--muted)]">{relationshipLabel(item.type as never)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
