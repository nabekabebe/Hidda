import { NODE_H, NODE_W, type LayoutPoint } from "@/domain/layout";
import type { Person } from "@/domain/types";

export function MiniMap({
  people,
  positions,
  viewport,
  width,
  height,
  viewW,
  viewH,
  onJump,
}: {
  people: Person[];
  positions: Map<string, LayoutPoint>;
  viewport: { x: number; y: number; k: number };
  width: number;
  height: number;
  viewW: number;
  viewH: number;
  onJump: (x: number, y: number) => void;
}) {
  const scale = Math.min(168 / Math.max(width, 1), 112 / Math.max(height, 1));
  const vw = viewW / viewport.k * scale;
  const vh = viewH / viewport.k * scale;
  const vx = -viewport.x * scale / viewport.k;
  const vy = -viewport.y * scale / viewport.k;

  return (
    <div className="glass relative overflow-hidden rounded-2xl p-2">
      <svg
        width={168}
        height={112}
        viewBox={`0 0 168 112`}
        className="block"
        role="img"
        aria-label="Family sky overview"
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) / scale;
          const y = (event.clientY - rect.top) / scale;
          onJump(x, y);
        }}
      >
        {people.map((person) => {
          const pos = positions.get(person.id);
          if (!pos) return null;
          return (
            <circle
              key={person.id}
              cx={pos.x * scale + (NODE_W * scale) / 2}
              cy={pos.y * scale + (NODE_H * scale) / 4}
              r={3.2}
              fill="var(--gold)"
            />
          );
        })}
        <rect x={vx} y={vy} width={vw} height={vh} fill="none" stroke="var(--gold)" strokeWidth={1} rx={3} />
      </svg>
    </div>
  );
}
