import { catalogYear, displayName, type Person } from "@/domain/types";
import { cn } from "@/lib/cn";

export function StarDisk({
  person,
  size = 88,
  selected,
  ghost,
}: {
  person: Person;
  size?: number;
  selected?: boolean;
  ghost?: boolean;
}) {
  const initials = `${person.firstName[0] ?? ""}${person.lastName[0] ?? ""}`.toUpperCase();
  return (
    <span
      className={cn("relative block overflow-hidden rounded-full", ghost && "opacity-35")}
      style={{
        width: size,
        height: size,
        boxShadow: selected
          ? "0 10px 28px rgb(210 170 118 / 0.32), 0 0 0 2px var(--gold)"
          : "0 8px 20px rgb(0 0 0 / 0.28), 0 0 0 1.5px var(--gold)",
      }}
    >
      {person.avatar ? (
        <img src={person.avatar} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="catalog flex h-full w-full items-center justify-center bg-[var(--panel)] text-[calc(var(--size)/2.6)] text-[var(--gold)]" style={{ ["--size" as string]: `${size}px` }}>
          {initials || "?"}
        </span>
      )}
    </span>
  );
}

export function PersonCaption({ person, compact }: { person: Person; compact?: boolean }) {
  return (
    <div className="text-center">
      <div className={cn("catalog text-[var(--bone)]", compact ? "text-lg" : "text-[1.65rem] leading-[1.05]")}>
        {displayName(person)}
      </div>
      {person.nickname ? (
        <div className="text-xs text-[var(--muted)]">“{person.nickname}”</div>
      ) : null}
      {catalogYear(person) ? (
        <div className="catalog mt-1 text-sm tracking-[0.08em] text-[var(--gold)]">{catalogYear(person)}</div>
      ) : null}
    </div>
  );
}
