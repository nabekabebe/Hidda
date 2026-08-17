import { StarDisk } from "@/components/person/StarDisk";
import { NODE_W } from "@/domain/layout";
import { childrenOf } from "@/domain/graph";
import { catalogYear, displayName, type CompassRelation, type Person } from "@/domain/types";
import { cn } from "@/lib/cn";
import { useFamilyStore } from "@/store/useFamilyStore";
import { CaretDown } from "@phosphor-icons/react";
import { CompassActions } from "@/components/tree/CompassActions";
import { useIsMobile } from "@/lib/media";
import { motion, useReducedMotion } from "motion/react";
import { memo, type MouseEvent } from "react";

export const PersonNode = memo(function PersonNode({
  person,
  selected,
  highlight,
  ghost,
  onOpenMenu,
}: {
  person: Person;
  selected: boolean;
  highlight: boolean;
  ghost: boolean;
  onOpenMenu: (event: MouseEvent, id: string) => void;
}) {
  const openProfile = useFamilyStore((s) => s.openProfile);
  const select = useFamilyStore((s) => s.select);
  const openForm = useFamilyStore((s) => s.openForm);
  const toggleCollapsed = useFamilyStore((s) => s.toggleCollapsed);
  const collapsedIds = useFamilyStore((s) => s.collapsedIds);
  const graph = useFamilyStore((s) => s.graph)();
  const canEdit = useFamilyStore((s) => s.access !== "view");
  const hasKids = childrenOf(graph, person.id).length > 0;
  const collapsed = collapsedIds.includes(person.id);
  const mobile = useIsMobile();
  const reduceMotion = useReducedMotion();

  return (
    <div
      className={cn("lift relative z-[1] flex flex-col items-center gap-2", highlight && "z-10")}
      style={{ width: NODE_W, transition: "opacity 220ms var(--ease-out), transform 180ms var(--ease-out)", opacity: ghost ? 0.28 : 1 }}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            if (mobile) select(person.id);
            else openProfile(person.id);
          }}
          onDoubleClick={() => openProfile(person.id)}
          onContextMenu={(event) => onOpenMenu(event, person.id)}
          className="relative rounded-full"
          aria-label={`View ${displayName(person)}`}
          aria-pressed={selected}
        >
          <motion.span
            className="inline-block"
            animate={highlight && !ghost && !reduceMotion ? { scale: [1, 1.06, 1] } : { scale: 1 }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          >
            <StarDisk person={person} size={selected ? 96 : 84} selected={selected} />
          </motion.span>
        </button>
        {selected ? (
          canEdit ? (
            <CompassActions onChoose={(relation: CompassRelation) => openForm({ fromId: person.id, relation })} />
          ) : null
        ) : null}
      </div>
      <div className="text-center">
        <div className="catalog text-[1.05rem] uppercase leading-[1.1] tracking-[0.16em] text-[var(--bone)]">
          {displayName(person)}
        </div>
        {catalogYear(person) ? (
          <div className="catalog mt-1 text-sm tracking-[0.12em] text-[var(--gold)]">{catalogYear(person)}</div>
        ) : null}
      </div>
      {hasKids ? (
        <button
          type="button"
          className="rounded-full p-1 text-[var(--muted)]"
          aria-label={collapsed ? "Expand branch" : "Collapse branch"}
          onClick={() => toggleCollapsed(person.id)}
        >
          <CaretDown size={14} className={cn(collapsed && "rotate-[-90deg]")} />
        </button>
      ) : null}
    </div>
  );
});
