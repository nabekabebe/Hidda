import { emptyDraft, type Gender, type PersonDraft } from "@/domain/types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useEffect, useMemo, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";

const genders: { id: Gender; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "nonbinary", label: "Nonbinary" },
  { id: "unknown", label: "Unspecified" },
];

export function PersonForm({
  initial,
  title,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<PersonDraft>;
  title?: string;
  submitLabel: string;
  onSubmit: (draft: PersonDraft) => Promise<void> | void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<PersonDraft>({ ...emptyDraft(), ...initial });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
  }, []);

  const preview = useMemo(() => draft.avatar, [draft.avatar]);

  function set<K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }

  async function handleFiles(file?: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const url = await readFile(file);
    const cropped = await cropToSquare(url);
    set("avatar", cropped);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    void handleFiles(event.dataTransfer.files[0]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.firstName.trim()) {
      setError("A first name keeps this star findable.");
      return;
    }
    setBusy(true);
    try {
      await onSubmit({
        ...draft,
        tags: draft.tags.map((tag) => tag.trim()).filter(Boolean),
      });
    } catch {
      setError("Could not save this person. Try again.");
      setBusy(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={submit}>
      {title ? <p className="text-sm text-[var(--muted)]">{title}</p> : null}
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className="grid cursor-pointer place-items-center gap-2 rounded-[24px] border border-dashed border-[color-mix(in_srgb,var(--gold)_45%,transparent)] bg-[color-mix(in_srgb,var(--sky)_55%,transparent)] p-4"
      >
        <span className="overflow-hidden rounded-full" style={{ width: 92, height: 92, boxShadow: "0 0 0 1.5px var(--gold)" }}>
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs text-[var(--muted)]">Drop a photo</span>
          )}
        </span>
        <span className="text-xs text-[var(--muted)]">Drop a portrait or click to upload. It will be cropped to a star disk.</span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => void handleFiles(event.target.files?.[0])}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="First name">
          <input ref={first} value={draft.firstName} onChange={(e) => set("firstName", e.target.value)} className={fieldClass} autoComplete="given-name" />
        </Field>
        <Field label="Middle">
          <input value={draft.middleName} onChange={(e) => set("middleName", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Last name">
          <input value={draft.lastName} onChange={(e) => set("lastName", e.target.value)} className={fieldClass} autoComplete="family-name" />
        </Field>
      </div>
      <Field label="Nickname">
        <input value={draft.nickname} onChange={(e) => set("nickname", e.target.value)} className={fieldClass} />
      </Field>
      <fieldset className="grid gap-2">
        <legend className="text-sm text-[var(--muted)]">Gender</legend>
        <div className="flex flex-wrap gap-2">
          {genders.map((item) => (
            <label key={item.id} className={cn("rounded-full border px-3 py-1 text-sm", draft.gender === item.id ? "border-[var(--gold)] text-[var(--gold)]" : "border-[color-mix(in_srgb,var(--ink)_14%,transparent)]")}>
              <input type="radio" className="sr-only" name="gender" checked={draft.gender === item.id} onChange={() => set("gender", item.id)} />
              {item.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Born">
          <input type="date" value={draft.birthDate} onChange={(e) => set("birthDate", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Died">
          <input type="date" value={draft.deathDate} onChange={(e) => set("deathDate", e.target.value)} className={fieldClass} />
        </Field>
      </div>
      <Field label="Short description">
        <textarea value={draft.description} onChange={(e) => set("description", e.target.value)} className={cn(fieldClass, "min-h-20")} rows={3} />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Occupation">
          <input value={draft.occupation} onChange={(e) => set("occupation", e.target.value)} className={fieldClass} />
        </Field>
        <Field label="Location">
          <input value={draft.location} onChange={(e) => set("location", e.target.value)} className={fieldClass} />
        </Field>
      </div>
      <Field label="Notes">
        <textarea value={draft.notes} onChange={(e) => set("notes", e.target.value)} className={cn(fieldClass, "min-h-20")} rows={3} />
      </Field>
      <Field label="Tags" hint="Comma separated">
        <input
          value={draft.tags.join(", ")}
          onChange={(e) => set("tags", e.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
          className={fieldClass}
        />
      </Field>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="flex justify-end gap-2">
        <Button type="button" tone="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? "Placing…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm text-[var(--muted)]">
        {label}
        {hint ? <span className="ml-2 text-xs opacity-70">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}

const fieldClass =
  "w-full rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color-mix(in_srgb,var(--sky)_40%,transparent)] px-3 py-2 text-[var(--ink)] outline-none";

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function cropToSquare(src: string): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const size = Math.min(image.width, image.height);
      const sx = (image.width - size) / 2;
      const sy = (image.height - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.beginPath();
      ctx.arc(256, 256, 256, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(image, sx, sy, size, size, 0, 0, 512, 512);
      resolve(canvas.toDataURL("image/webp", 0.9));
    };
    image.src = src;
  });
}
