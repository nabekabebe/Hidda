import { StarDisk } from "@/components/person/StarDisk";
import { searchPeople } from "@/domain/search";
import { displayName } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";

export function SearchPalette({ onClose }: { onClose: () => void }) {
  const people = useFamilyStore((s) => s.people);
  const pulse = useFamilyStore((s) => s.pulse);
  const openProfile = useFamilyStore((s) => s.openProfile);
  const [query, setQuery] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const hits = useMemo(() => searchPeople(people, query), [people, query]);

  useEffect(() => {
    input.current?.focus();
  }, []);

  return (
    <div className="grid gap-3">
      <label className="flex items-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] px-3 py-2">
        <MagnifyingGlass size={16} />
        <input
          ref={input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, nickname, place, year, tag"
          className="w-full bg-transparent outline-none"
          aria-label="Search family"
        />
      </label>
      <ul className="grid gap-1">
        {hits.map((hit, index) => (
          <li key={hit.person.id} style={{ animationDelay: `${index * 40}ms` }}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left"
              onClick={() => {
                pulse(hit.person.id);
                openProfile(hit.person.id);
                onClose();
              }}
            >
              <StarDisk person={hit.person} size={36} />
              <span>
                <span className="catalog block text-xl leading-none">{displayName(hit.person)}</span>
                <span className="text-xs text-[var(--muted)]">{hit.reason}</span>
              </span>
            </button>
          </li>
        ))}
        {query && hits.length === 0 ? <li className="px-2 text-sm text-[var(--muted)]">No one matches that catalog line.</li> : null}
      </ul>
    </div>
  );
}
