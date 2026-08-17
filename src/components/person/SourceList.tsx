import { Button } from "@/components/ui/Button";
import type { Citation, Source } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";
import { useState } from "react";

const fieldClass =
  "w-full rounded-xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-[color-mix(in_srgb,var(--sky)_40%,transparent)] px-2 py-1 text-sm outline-none";

export function SourceList({ personId }: { personId: string }) {
  const sources = useFamilyStore((s) => s.sources);
  const citations = useFamilyStore((s) => s.citations);
  const saveSources = useFamilyStore((s) => s.saveSources);
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const mine = citations.filter((item) => item.personId === personId);
  const [title, setTitle] = useState("");
  const [page, setPage] = useState("");

  return (
    <section>
      <h3 className="catalog mb-2 text-[11px] uppercase tracking-[0.18em] text-[var(--gold)]">Sources</h3>
      <ul className="grid gap-2 text-sm">
        {mine.map((citation) => {
          const source = sources.find((item) => item.id === citation.sourceId);
          return (
            <li key={citation.id}>
              <p>{source?.title || "Untitled source"}</p>
              <p className="text-[var(--muted)]">{[citation.page, citation.quote].filter(Boolean).join(" · ")}</p>
            </li>
          );
        })}
      </ul>
      {canEdit ? (
        <form
          className="mt-2 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!title.trim()) return;
            const source: Source = { id: crypto.randomUUID(), title: title.trim(), author: "", publisher: "", url: "", notes: "" };
            const citation: Citation = { id: crypto.randomUUID(), sourceId: source.id, personId, page, quote: "" };
            void saveSources([...sources, source], [...citations, citation]);
            setTitle("");
            setPage("");
          }}
        >
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Source title" className={fieldClass} />
          <input value={page} onChange={(event) => setPage(event.target.value)} placeholder="Page or detail" className={fieldClass} />
          <Button type="submit" tone="ghost">Cite</Button>
        </form>
      ) : null}
    </section>
  );
}
