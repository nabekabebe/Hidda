import { Button } from "@/components/ui/Button";
import { EVENT_TYPES, emptyEvent, eventLabel, eventsForPerson } from "@/domain/events";
import type { EventType, FamilyEvent } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useState } from "react";

const fieldClass =
  "w-full rounded-xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color-mix(in_srgb,var(--sky)_40%,transparent)] px-2 py-1 text-sm text-[var(--ink)] outline-none";

export function EventList({ personId }: { personId: string }) {
  const events = useFamilyStore((s) => s.events);
  const saveEvents = useFamilyStore((s) => s.saveEvents);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const mine = eventsForPerson(events, personId);
  const [adding, setAdding] = useState(false);

  async function persist(next: FamilyEvent[]) {
    await saveEvents(next);
  }

  return (
    <section>
      <h3 className="catalog mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]">Facts</h3>
      <ul className="grid gap-2">
        {mine.map((event) => (
          <li key={event.id} className="rounded-2xl border border-[color-mix(in_srgb,var(--ink)_10%,transparent)] px-3 py-2 text-sm">
            <p className="catalog text-[11px] uppercase tracking-[0.14em] text-[var(--gold)]">{eventLabel(event.type)}</p>
            <p>{[event.date, event.place].filter(Boolean).join(" · ") || "Date unknown"}</p>
            {event.detail ? <p className="text-[var(--muted)]">{event.detail}</p> : null}
            {canEdit ? (
              <button
                type="button"
                className="mt-1 text-xs text-[var(--muted)]"
                onClick={() => void persist(events.filter((item) => item.id !== event.id))}
              >
                Remove
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {canEdit && adding ? (
        <EventForm
          personId={personId}
          onCancel={() => setAdding(false)}
          onSave={async (event) => {
            await persist([...events, event]);
            setAdding(false);
          }}
        />
      ) : null}
      {canEdit && !adding ? (
        <Button type="button" tone="ghost" className="mt-2" onClick={() => setAdding(true)}>
          Add a fact
        </Button>
      ) : null}
    </section>
  );
}

function EventForm({
  personId,
  onSave,
  onCancel,
}: {
  personId: string;
  onSave: (event: FamilyEvent) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(emptyEvent(personId));
  return (
    <form
      className="mt-2 grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave({ ...draft, id: crypto.randomUUID() });
      }}
    >
      <label className="grid gap-1 text-xs text-[var(--muted)]">
        Type
        <select
          value={draft.type}
          onChange={(e) => setDraft({ ...draft, type: e.target.value as EventType })}
          className={fieldClass}
        >
          {EVENT_TYPES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-xs text-[var(--muted)]">
        Date
        <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className={fieldClass} />
      </label>
      <label className="grid gap-1 text-xs text-[var(--muted)]">
        Place
        <input value={draft.place} onChange={(e) => setDraft({ ...draft, place: e.target.value })} className={fieldClass} />
      </label>
      <label className="grid gap-1 text-xs text-[var(--muted)]">
        Detail
        <input value={draft.detail} onChange={(e) => setDraft({ ...draft, detail: e.target.value })} className={fieldClass} />
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" tone="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save fact</Button>
      </div>
    </form>
  );
}
