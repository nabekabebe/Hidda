import { EventList } from "@/components/person/EventList";
import { PersonGallery } from "@/components/person/PersonGallery";
import { StarDisk } from "@/components/person/StarDisk";
import { Button } from "@/components/ui/Button";
import { childrenOf, generationIndex, parentsOf, partnerEdgesOf, relationshipLabel, siblingsOf } from "@/domain/graph";
import { relationToHome } from "@/domain/kin";
import { partnerTypeFromDates, partnershipFacts, partnershipSummary } from "@/domain/partnership";
import { catalogYear, displayName, type PartnerKind, type Person, type Relationship } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";
import { PencilSimple, Trash, UserFocus } from "@phosphor-icons/react";
import { useState } from "react";

const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];

export function ProfileSlip({ person }: { person: Person }) {
  const graph = useFamilyStore((s) => s.graph)();
  const openForm = useFamilyStore((s) => s.openForm);
  const setPanel = useFamilyStore((s) => s.setPanel);
  const centerOn = useFamilyStore((s) => s.centerOn);
  const openProfile = useFamilyStore((s) => s.openProfile);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const homePersonId = useFamilyStore((s) => s.homePersonId);
  const setHomePerson = useFamilyStore((s) => s.setHomePerson);
  const kin = relationToHome(graph, person.id, homePersonId);
  const parents = parentsOf(graph, person.id);
  const children = childrenOf(graph, person.id);
  const partners = partnerEdgesOf(graph, person.id);
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
          {kin ? (
            <div className="catalog mt-1 text-sm tracking-[0.12em] text-[var(--gold)]">{kin}</div>
          ) : null}
        </div>
      </div>
      {person.description ? <p className="font-bio text-[15px] leading-relaxed text-[var(--ink)]">{person.description}</p> : null}
      <dl className="grid gap-3 text-sm">
        <Row label="Born" value={person.birthDate || "Unknown"} />
        <Row label="Birthplace" value={person.birthPlace || person.location || "Unknown"} />
        {person.birthLastName ? <Row label="Birth surname" value={person.birthLastName} /> : null}
        {person.deathDate ? <Row label="Died" value={person.deathDate} /> : null}
        {person.deathPlace ? <Row label="Place of death" value={person.deathPlace} /> : null}
        {person.burialPlace ? <Row label="Burial" value={person.burialPlace} /> : null}
        {person.causeOfDeath ? <Row label="Cause of death" value={person.causeOfDeath} /> : null}
        {person.occupation ? <Row label="Occupation" value={person.occupation} /> : null}
        {kin ? <Row label="Related as" value={kin} /> : null}
        <Row label="Generation" value={`${roman[gen] ?? gen + 1} generation`} />
      </dl>
      <EventList personId={person.id} />
      <PersonGallery personId={person.id} />
      <PersonComments personId={person.id} />
      <RelGroup label="Parents" people={parents} onOpen={openProfile} />
      <PartnershipGroup personId={person.id} edges={partners} onOpen={openProfile} canEdit={canEdit} />
      <RelGroup label="Siblings" people={siblings} onOpen={openProfile} />
      <RelGroup label="Children" people={children} onOpen={openProfile} />
      <div className="mt-auto grid grid-cols-2 gap-2">
        {canEdit ? (
          <Button tone="ghost" onClick={() => openForm({ personId: person.id })} aria-label="Edit person">
            <PencilSimple size={16} />
          </Button>
        ) : <span />}
        <Button tone="ghost" onClick={() => centerOn(person.id)} aria-label="Focus on this person">
          <UserFocus size={16} />
        </Button>
        {canEdit ? (
          <Button tone="ghost" onClick={() => void setHomePerson(person.id)} aria-label="Set as home person">
            Home
          </Button>
        ) : <span />}
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

function PartnershipGroup({
  personId,
  edges,
  onOpen,
  canEdit,
}: {
  personId: string;
  edges: { person: Person; rel: Relationship }[];
  onOpen: (id: string) => void;
  canEdit: boolean;
}) {
  if (!edges.length) return null;
  return (
    <section>
      <h3 className="catalog mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]">Partner</h3>
      <ul className="grid gap-3">
        {edges.map((item) => (
          <li key={item.rel.id} className="grid gap-2">
            <button type="button" onClick={() => onOpen(item.person.id)} className="flex w-full items-center gap-3 rounded-2xl px-1 py-1 text-left">
              <StarDisk person={item.person} size={36} />
              <span>
                <span className="catalog block text-base uppercase tracking-[0.12em] leading-none">{displayName(item.person)}</span>
                <span className="text-xs text-[var(--muted)]">
                  {partnershipSummary(item.rel) || relationshipLabel(item.rel.type)}
                </span>
              </span>
            </button>
            {canEdit ? <PartnershipEditor key={`${personId}-${item.rel.id}`} rel={item.rel} /> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PartnershipEditor({ rel }: { rel: Relationship }) {
  const updateRelationship = useFamilyStore((s) => s.updateRelationship);
  const facts = partnershipFacts(rel);
  const [open, setOpen] = useState(false);
  const [marriedOn, setMarriedOn] = useState(facts.marriedOn);
  const [marriedPlace, setMarriedPlace] = useState(facts.marriedPlace);
  const [endedOn, setEndedOn] = useState(facts.endedOn);
  const [endedPlace, setEndedPlace] = useState(facts.endedPlace);

  async function save() {
    const type = partnerTypeFromDates(rel.type as PartnerKind, endedOn);
    await updateRelationship(rel.id, {
      type,
      metadata: { marriedOn, marriedPlace, endedOn, endedPlace },
    });
    setOpen(false);
  }

  return (
    <div className="grid gap-2">
      <button type="button" className="text-left text-xs text-[var(--gold)]" onClick={() => setOpen((value) => !value)}>
        {open ? "Hide marriage dates" : "Marriage and divorce"}
      </button>
      {open ? (
        <div className="grid gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--ink)_10%,transparent)] p-2">
          <label className="grid gap-1 text-xs text-[var(--muted)]">
            Married
            <input type="date" value={marriedOn} onChange={(e) => setMarriedOn(e.target.value)} className={miniField} />
          </label>
          <label className="grid gap-1 text-xs text-[var(--muted)]">
            Place
            <input value={marriedPlace} onChange={(e) => setMarriedPlace(e.target.value)} className={miniField} />
          </label>
          <label className="grid gap-1 text-xs text-[var(--muted)]">
            Ended / divorced
            <input type="date" value={endedOn} onChange={(e) => setEndedOn(e.target.value)} className={miniField} />
          </label>
          <label className="grid gap-1 text-xs text-[var(--muted)]">
            Place ended
            <input value={endedPlace} onChange={(e) => setEndedPlace(e.target.value)} className={miniField} />
          </label>
          <Button type="button" tone="ghost" onClick={() => void save()}>
            Save partnership
          </Button>
        </div>
      ) : null}
    </div>
  );
}

const miniField =
  "w-full rounded-xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color-mix(in_srgb,var(--sky)_40%,transparent)] px-2 py-1 text-sm text-[var(--ink)] outline-none";

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

function PersonComments({ personId }: { personId: string }) {
  const comments = useFamilyStore((s) => s.comments.filter((item) => item.personId === personId));
  const saveComments = useFamilyStore((s) => s.saveComments);
  const all = useFamilyStore((s) => s.comments);
  const [body, setBody] = useState("");
  return (
    <section>
      <h3 className="catalog mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]">Comments</h3>
      <ul className="grid gap-2 text-sm">
        {comments.map((item) => (
          <li key={item.id}>
            <p className="text-[var(--muted)]">{item.authorName}</p>
            <p>{item.body}</p>
          </li>
        ))}
      </ul>
      <form
        className="mt-2 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!body.trim()) return;
          void saveComments([
            ...all,
            { id: crypto.randomUUID(), personId, authorName: "Guest", body: body.trim(), createdAt: new Date().toISOString() },
          ]);
          setBody("");
        }}
      >
        <textarea value={body} onChange={(event) => setBody(event.target.value)} className={miniField} rows={2} placeholder="Leave a note for the family" />
        <Button type="submit" tone="ghost">Post</Button>
      </form>
    </section>
  );
}
