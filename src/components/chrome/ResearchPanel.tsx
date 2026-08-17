import { Button } from "@/components/ui/Button";
import { duplicateCandidates, qualityWarnings } from "@/domain/quality";
import { displayName } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useState } from "react";
import { toast } from "sonner";

export function ResearchPanel() {
  const snapshot = useFamilyStore((s) => s.snapshot);
  const people = useFamilyStore((s) => s.people);
  const tasks = useFamilyStore((s) => s.tasks);
  const recycleBin = useFamilyStore((s) => s.recycleBin);
  const undo = useFamilyStore((s) => s.undo);
  const mergePeople = useFamilyStore((s) => s.mergePeople);
  const findReplace = useFamilyStore((s) => s.findReplace);
  const restorePerson = useFamilyStore((s) => s.restorePerson);
  const saveTasks = useFamilyStore((s) => s.saveTasks);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const pairs = duplicateCandidates(people);
  const warnings = qualityWarnings(snapshot());
  const [keepId, setKeepId] = useState(pairs[0]?.[0].id ?? "");
  const [dropId, setDropId] = useState(pairs[0]?.[1].id ?? "");
  const [field, setField] = useState<"lastName" | "location" | "birthPlace" | "deathPlace">("lastName");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [taskTitle, setTaskTitle] = useState("");

  return (
    <div className="grid gap-6">
      <section className="grid gap-2">
        <h3 className="catalog text-2xl text-[var(--bone)]">Undo</h3>
        <Button type="button" tone="ghost" onClick={() => void undo()}>
          Undo last catalog change
        </Button>
      </section>

      {warnings.length ? (
        <section className="grid gap-2">
          <h3 className="catalog text-2xl text-[var(--bone)]">Warnings</h3>
          <ul className="grid gap-1 text-sm">
            {warnings.map((item) => (
              <li key={`${item.personId}-${item.message}`}>{item.message}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {canEdit ? (
        <section className="grid gap-2">
          <h3 className="catalog text-2xl text-[var(--bone)]">Merge duplicates</h3>
          {pairs.length ? <p className="text-sm text-[var(--muted)]">{pairs.length} same-name pairs.</p> : <p className="text-sm text-[var(--muted)]">No obvious duplicates.</p>}
          <select value={keepId} onChange={(event) => setKeepId(event.target.value)} className={fieldClass}>
            {people.map((person) => (
              <option key={person.id} value={person.id}>Keep {displayName(person)}</option>
            ))}
          </select>
          <select value={dropId} onChange={(event) => setDropId(event.target.value)} className={fieldClass}>
            {people.map((person) => (
              <option key={person.id} value={person.id}>Remove {displayName(person)}</option>
            ))}
          </select>
          <Button
            type="button"
            onClick={() => {
              if (keepId === dropId) return;
              void mergePeople(keepId, dropId).then(() => toast.success("Merged"));
            }}
          >
            Merge
          </Button>
        </section>
      ) : null}

      {canEdit ? (
        <section className="grid gap-2">
          <h3 className="catalog text-2xl text-[var(--bone)]">Find and replace</h3>
          <select value={field} onChange={(event) => setField(event.target.value as typeof field)} className={fieldClass}>
            <option value="lastName">Last name</option>
            <option value="location">Location</option>
            <option value="birthPlace">Birthplace</option>
            <option value="deathPlace">Place of death</option>
          </select>
          <input value={from} onChange={(event) => setFrom(event.target.value)} placeholder="Find" className={fieldClass} />
          <input value={to} onChange={(event) => setTo(event.target.value)} placeholder="Replace with" className={fieldClass} />
          <Button type="button" onClick={() => void findReplace(field, from, to).then(() => toast.success("Updated catalog"))}>
            Replace
          </Button>
        </section>
      ) : null}

      <section className="grid gap-2">
        <h3 className="catalog text-2xl text-[var(--bone)]">To research</h3>
        <ul className="grid gap-1">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => void saveTasks(tasks.map((item) => (item.id === task.id ? { ...item, done: !item.done } : item)))}
              />
              <span className={task.done ? "text-[var(--muted)] line-through" : ""}>{task.title}</span>
            </li>
          ))}
        </ul>
        {canEdit ? (
          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!taskTitle.trim()) return;
              void saveTasks([...tasks, { id: crypto.randomUUID(), title: taskTitle.trim(), done: false, createdAt: new Date().toISOString() }]);
              setTaskTitle("");
            }}
          >
            <input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Find burial for…" className={fieldClass} />
            <Button type="submit">Add</Button>
          </form>
        ) : null}
      </section>

      <section className="grid gap-2">
        <h3 className="catalog text-2xl text-[var(--bone)]">Recycle bin</h3>
        {recycleBin.length === 0 ? <p className="text-sm text-[var(--muted)]">Deleted people wait here.</p> : null}
        <ul className="grid gap-2">
          {recycleBin.map((entry) => (
            <li key={entry.person.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{displayName(entry.person)}</span>
              {canEdit ? (
                <Button type="button" tone="ghost" onClick={() => void restorePerson(entry.person.id)}>
                  Restore
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const fieldClass =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color-mix(in_srgb,var(--sky)_40%,transparent)] px-3 py-2 text-sm outline-none";
