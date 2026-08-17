import { childrenOf, generationsFor, parentsOf, partnersOf, type FamilyGraph } from "./graph";
import type { Person, RelationshipKind } from "./types";

export const NODE_W = 168;
export const NODE_H = 200;
export const SPOUSE_GAP = 40;
export const SIBLING_GAP = 52;
export const GEN_GAP = 268;

export interface LayoutPoint {
  x: number;
  y: number;
}

export interface LayoutEdge {
  fromId: string;
  toId: string;
  type: RelationshipKind;
  kind: "parent" | "partner";
}

export interface TreeLayout {
  positions: Map<string, LayoutPoint>;
  edges: LayoutEdge[];
  width: number;
  height: number;
  generations: Map<string, number>;
}

interface Unit {
  primary: string;
  partner: string | null;
  partnerType: RelationshipKind | null;
}

export function layoutTree(
  graph: FamilyGraph,
  collapsedIds: Set<string> = new Set(),
): TreeLayout {
  const generations = generationsFor(graph);
  const positions = new Map<string, LayoutPoint>();
  const edges: LayoutEdge[] = [];
  const placed = new Set<string>();

  if (graph.byId.size === 0) {
    return { positions, edges, width: 0, height: 0, generations };
  }

  const unitsFor = (id: string): Unit => {
    const partners = partnersOf(graph, id).sort((a, b) => {
      const rank = (type: RelationshipKind) => (type === "spouse" ? 0 : type === "partner" ? 1 : 2);
      return rank(a.type) - rank(b.type);
    });
    const partner = partners[0];
    return {
      primary: id,
      partner: partner?.person.id ?? null,
      partnerType: partner?.type ?? null,
    };
  };

  const visibleChildren = (id: string, extra?: string | null): Person[] => {
    if (collapsedIds.has(id) || (extra && collapsedIds.has(extra))) return [];
    const ids = new Set<string>();
    const people: Person[] = [];
    for (const parentId of [id, extra].filter(Boolean) as string[]) {
      for (const child of childrenOf(graph, parentId)) {
        if (ids.has(child.person.id)) continue;
        ids.add(child.person.id);
        people.push(child.person);
      }
    }
    return people.sort((a, b) => (a.birthDate || a.firstName).localeCompare(b.birthDate || b.firstName));
  };

  const layoutUnit = (id: string, left: number): number => {
    if (placed.has(id)) return NODE_W;
    const unit = unitsFor(id);
    if (unit.partner && placed.has(unit.partner) && placed.has(id)) return NODE_W;

    const gen = generations.get(id) ?? 0;
    const y = gen * GEN_GAP;
    const kids = visibleChildren(unit.primary, unit.partner);
    const partnerAlso = unit.partner && !placed.has(unit.partner);

    let childWidth = 0;
    const childLefts: { id: string; left: number; width: number }[] = [];
    for (const child of kids) {
      if (placed.has(child.id)) continue;
      if (unit.partner && child.id === unit.partner) continue;
      const width = layoutUnit(child.id, left + childWidth);
      childLefts.push({ id: child.id, left: left + childWidth, width });
      childWidth += width + SIBLING_GAP;
    }
    if (childWidth > 0) childWidth -= SIBLING_GAP;

    const selfWidth = partnerAlso ? NODE_W * 2 + SPOUSE_GAP : NODE_W;
    const width = Math.max(selfWidth, childWidth);
    const origin = left + (width - selfWidth) / 2;

    if (!placed.has(unit.primary)) {
      positions.set(unit.primary, { x: origin, y });
      placed.add(unit.primary);
    }
    if (partnerAlso && unit.partner) {
      positions.set(unit.partner, { x: origin + NODE_W + SPOUSE_GAP, y });
      placed.add(unit.partner);
      edges.push({
        fromId: unit.primary,
        toId: unit.partner,
        type: unit.partnerType ?? "spouse",
        kind: "partner",
      });
    }

    for (const child of kids) {
      const childPos = positions.get(child.id);
      if (!childPos) continue;
      edges.push({
        fromId: unit.primary,
        toId: child.id,
        type: "biological-parent",
        kind: "parent",
      });
      if (unit.partner) {
        edges.push({
          fromId: unit.partner,
          toId: child.id,
          type: "biological-parent",
          kind: "parent",
        });
      }
    }

    return width;
  };

  const roots = [...graph.byId.values()]
    .filter((person) => {
      if (parentsOf(graph, person.id).length > 0) return false;
      return !partnersOf(graph, person.id).some(
        (item) => parentsOf(graph, item.person.id).length > 0,
      );
    })
    .sort((a, b) => a.firstName.localeCompare(b.firstName));

  const seenRoot = new Set<string>();
  let cursor = 80;
  for (const root of roots) {
    if (seenRoot.has(root.id) || placed.has(root.id)) continue;
    const unit = unitsFor(root.id);
    const width = layoutUnit(root.id, cursor);
    seenRoot.add(root.id);
    if (unit.partner) seenRoot.add(unit.partner);
    cursor += width + 96;
  }

  for (const person of graph.byId.values()) {
    if (placed.has(person.id)) continue;
    const gen = generations.get(person.id) ?? 0;
    positions.set(person.id, { x: cursor, y: gen * GEN_GAP });
    placed.add(person.id);
    cursor += NODE_W + 96;
  }

  if (collapsedIds.size > 0) {
    for (const id of collapsedIds) {
      const origin = positions.get(id);
      if (!origin) continue;
      const kids = visibleDescendants(graph, id, collapsedIds);
      kids.forEach((kidId, index) => {
        const pos = positions.get(kidId);
        if (!pos) return;
        const t = 0.72;
        positions.set(kidId, {
          x: origin.x + (pos.x - origin.x) * (1 - t) + (index % 3) * 18,
          y: origin.y + (pos.y - origin.y) * (1 - t) + 36,
        });
      });
    }
  }

  let maxX = 0;
  let maxY = 0;
  for (const pos of positions.values()) {
    maxX = Math.max(maxX, pos.x + NODE_W);
    maxY = Math.max(maxY, pos.y + NODE_H);
  }

  return {
    positions,
    edges: dedupeEdges(edges),
    width: maxX + 80,
    height: maxY + 80,
    generations,
  };
}

function visibleDescendants(graph: FamilyGraph, id: string, collapsed: Set<string>): string[] {
  const out: string[] = [];
  const stack = [id];
  const seen = new Set<string>([id]);
  while (stack.length) {
    const current = stack.pop()!;
    if (current !== id && collapsed.has(current)) continue;
    for (const child of childrenOf(graph, current)) {
      if (seen.has(child.person.id)) continue;
      seen.add(child.person.id);
      out.push(child.person.id);
      stack.push(child.person.id);
    }
  }
  return out;
}

function dedupeEdges(edges: LayoutEdge[]): LayoutEdge[] {
  const seen = new Set<string>();
  const out: LayoutEdge[] = [];
  for (const edge of edges) {
    const key = `${edge.kind}:${[edge.fromId, edge.toId].sort().join(">")}:${edge.type}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(edge);
  }
  return out;
}

export function nodeCenter(pos: LayoutPoint): { x: number; y: number } {
  return { x: pos.x + NODE_W / 2, y: pos.y + 52 };
}
