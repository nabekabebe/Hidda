import { Button } from "@/components/ui/Button";
import { defaultFilters, type Gender, type TreeFilters } from "@/domain/types";
import { useFamilyStore } from "@/store/useFamilyStore";

const genders: { id: Gender; label: string }[] = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "nonbinary", label: "Nonbinary" },
  { id: "unknown", label: "Unspecified" },
];

export function FilterPanel() {
  const filters = useFamilyStore((s) => s.filters);
  const setFilters = useFamilyStore((s) => s.setFilters);
  const people = useFamilyStore((s) => s.people);
  const tags = [...new Set(people.flatMap((person) => person.tags))];

  function patch(next: Partial<TreeFilters>) {
    setFilters({ ...filters, ...next });
  }

  return (
    <div className="grid gap-4">
      <fieldset className="grid gap-2">
        <legend className="text-sm text-[var(--muted)]">Living</legend>
        <div className="flex flex-wrap gap-2">
          {(["all", "living", "deceased"] as const).map((item) => (
            <Chip key={item} active={filters.living === item} onClick={() => patch({ living: item })}>
              {item === "all" ? "Anyone" : item === "living" ? "Living" : "Deceased"}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset className="grid gap-2">
        <legend className="text-sm text-[var(--muted)]">Gender</legend>
        <div className="flex flex-wrap gap-2">
          {genders.map((item) => (
            <Chip
              key={item.id}
              active={filters.genders.includes(item.id)}
              onClick={() =>
                patch({
                  genders: filters.genders.includes(item.id)
                    ? filters.genders.filter((g) => g !== item.id)
                    : [...filters.genders, item.id],
                })
              }
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-1.5">
        <span className="text-sm text-[var(--muted)]">Location</span>
        <input
          value={filters.location}
          onChange={(event) => patch({ location: event.target.value })}
          className="rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-transparent px-3 py-2"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5">
          <span className="text-sm text-[var(--muted)]">From year</span>
          <input value={filters.fromYear} onChange={(event) => patch({ fromYear: event.target.value })} className="rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-transparent px-3 py-2" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm text-[var(--muted)]">To year</span>
          <input value={filters.toYear} onChange={(event) => patch({ toYear: event.target.value })} className="rounded-2xl border border-[color-mix(in_srgb,var(--ink)_14%,transparent)] bg-transparent px-3 py-2" />
        </label>
      </div>
      {tags.length ? (
        <fieldset className="grid gap-2">
          <legend className="text-sm text-[var(--muted)]">Tags</legend>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Chip
                key={tag}
                active={filters.tags.includes(tag)}
                onClick={() =>
                  patch({
                    tags: filters.tags.includes(tag) ? filters.tags.filter((item) => item !== tag) : [...filters.tags, tag],
                  })
                }
              >
                {tag}
              </Chip>
            ))}
          </div>
        </fieldset>
      ) : null}
      <Button tone="ghost" onClick={() => setFilters(defaultFilters())}>
        Clear filters
      </Button>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
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
