import { NODE_H, NODE_W, nodeCenter, type LayoutEdge, type LayoutPoint } from "@/domain/layout";
import type { RelationshipKind } from "@/domain/types";

export function RelLines({
  edges,
  positions,
}: {
  edges: LayoutEdge[];
  positions: Map<string, LayoutPoint>;
}) {
  const box = bounds(positions);
  return (
    <svg
      className="pointer-events-none absolute left-0 top-0"
      width={box.w}
      height={box.h}
      viewBox={`0 0 ${box.w} ${box.h}`}
      aria-hidden
    >
      {edges.map((edge) => {
        const from = positions.get(edge.fromId);
        const to = positions.get(edge.toId);
        if (!from || !to) return null;
        if (edge.kind === "partner") {
          const a = nodeCenter(from);
          const b = nodeCenter(to);
          return (
            <g key={`${edge.fromId}-${edge.toId}-p`}>
              <path d={`M ${a.x} ${a.y - 8} H ${b.x}`} stroke={stroke(edge.type)} strokeWidth={strokeWidth(edge.type)} fill="none" strokeLinecap="round" strokeDasharray={dash(edge.type)} />
              <path d={`M ${a.x} ${a.y + 8} H ${b.x}`} stroke={stroke(edge.type)} strokeWidth={1.2} fill="none" opacity={0.55} />
            </g>
          );
        }
        const start = { x: from.x + NODE_W / 2, y: from.y + NODE_H - 36 };
        const end = { x: to.x + NODE_W / 2, y: to.y + 8 };
        const midY = (start.y + end.y) / 2;
        const d = `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`;
        return (
          <path
            key={`${edge.fromId}-${edge.toId}-c`}
            d={d}
            stroke={stroke(edge.type)}
            strokeWidth={strokeWidth(edge.type)}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={dash(edge.type)}
            opacity={0.9}
          />
        );
      })}
    </svg>
  );
}

function bounds(positions: Map<string, LayoutPoint>) {
  let w = 800;
  let h = 600;
  for (const pos of positions.values()) {
    w = Math.max(w, pos.x + NODE_W + 80);
    h = Math.max(h, pos.y + NODE_H + 80);
  }
  return { w, h };
}

function stroke(type: RelationshipKind): string {
  if (type === "adoptive-parent" || type === "adopted-child") return "#7aa2ff";
  if (type === "step-parent" || type === "former-spouse") return "#9aa6b8";
  if (type === "partner") return "#7aa2ff";
  return "#d2aa76";
}

function dash(type: RelationshipKind): string | undefined {
  if (type === "adoptive-parent" || type === "adopted-child") return "7 6";
  if (type === "step-parent" || type === "half-sibling") return "3 6";
  if (type === "former-spouse") return "8 8";
  return undefined;
}

function strokeWidth(type: RelationshipKind): number {
  if (type === "spouse") return 2.2;
  return 1.6;
}
