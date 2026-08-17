import { cn } from "@/lib/cn";
import type { CompassRelation } from "@/domain/types";

const actions: { id: CompassRelation; label: string; x: string; y: string }[] = [
  { id: "parent", label: "Parent", x: "50%", y: "-28px" },
  { id: "child", label: "Child", x: "50%", y: "calc(100% + 28px)" },
  { id: "sibling", label: "Sibling", x: "-28px", y: "50%" },
  { id: "spouse", label: "Spouse", x: "calc(100% + 28px)", y: "50%" },
];

export function CompassActions({
  onChoose,
}: {
  onChoose: (relation: CompassRelation) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {actions.map((action) => (
        <button
          key={action.id}
          type="button"
          className={cn(
            "pointer-events-auto absolute z-10 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-[var(--gold)] text-[var(--sky-deep)] shadow-[0_8px_20px_rgb(0_0_0/0.28)]",
          )}
          style={{ left: action.x, top: action.y }}
          onClick={(event) => {
            event.stopPropagation();
            onChoose(action.id);
          }}
          aria-label={`Add ${action.label.toLowerCase()}`}
          title={`Add ${action.label.toLowerCase()}`}
        >
          <span className="catalog text-[1.05rem] leading-none">+</span>
          <span className="catalog text-[8px] uppercase tracking-[0.14em]">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
