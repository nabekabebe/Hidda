import { RelLines } from "@/components/tree/RelLines";
import { StarDisk } from "@/components/person/StarDisk";
import { layoutTree, NODE_H, NODE_W } from "@/domain/layout";
import { buildGraph } from "@/domain/graph";
import { catalogYear, displayName, type FamilySnapshot } from "@/domain/types";

const PAD = 56;

export function ExportStage({
  snapshot,
  includeInscriptions,
}: {
  snapshot: FamilySnapshot;
  includeInscriptions: boolean;
}) {
  const graph = buildGraph(snapshot.people, snapshot.relationships);
  const layout = layoutTree(graph);
  let minX = 0;
  let minY = 0;
  let maxX = Math.max(layout.width, 1);
  let maxY = Math.max(layout.height, 1);
  for (const pos of layout.positions.values()) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + NODE_W);
    maxY = Math.max(maxY, pos.y + NODE_H);
  }
  if (includeInscriptions) {
    for (const item of snapshot.inscriptions) {
      minX = Math.min(minX, item.x);
      minY = Math.min(minY, item.y);
      maxX = Math.max(maxX, item.x + 420);
      maxY = Math.max(maxY, item.y + 88);
    }
  }
  const width = Math.ceil(maxX - minX + PAD * 2);
  const height = Math.ceil(maxY - minY + PAD * 2);
  const ox = -minX + PAD;
  const oy = -minY + PAD;
  const sky =
    typeof document === "undefined"
      ? "#141a2e"
      : getComputedStyle(document.documentElement).getPropertyValue("--sky").trim() || "#141a2e";

  return (
    <div
      data-atlas-export-stage
      className="relative overflow-hidden"
      style={{ width, height, background: sky }}
    >
      <div className="absolute left-0 top-0" style={{ transform: `translate(${ox}px, ${oy}px)` }}>
        <RelLines edges={layout.edges} positions={layout.positions} />
        {includeInscriptions
          ? snapshot.inscriptions.map((item) => (
              <p
                key={item.id}
                className="catalog absolute text-[var(--bone)]"
                style={{
                  left: item.x,
                  top: item.y,
                  fontSize: item.kind === "title" ? "1.85rem" : "1.15rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: item.kind === "title" ? "var(--bone)" : "var(--gold)",
                }}
              >
                {item.text}
              </p>
            ))
          : null}
        {snapshot.people.map((person) => {
          const pos = layout.positions.get(person.id);
          if (!pos) return null;
          return (
            <div key={person.id} className="absolute flex flex-col items-center gap-2" style={{ left: pos.x, top: pos.y, width: NODE_W }}>
              <StarDisk person={person} size={84} />
              <div className="text-center">
                <div className="catalog text-[1.05rem] uppercase leading-[1.1] tracking-[0.16em] text-[var(--bone)]">
                  {displayName(person)}
                </div>
                {catalogYear(person) ? (
                  <div className="catalog mt-1 text-sm tracking-[0.12em] text-[var(--gold)]">{catalogYear(person)}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
