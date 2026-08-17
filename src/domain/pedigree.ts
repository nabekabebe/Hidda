import { parentsOf, type FamilyGraph } from "./graph";
import type { Person } from "./types";

export interface PedigreeNode {
  person: Person | null;
  generation: number;
  slot: number;
}

export function pedigreeSlots(graph: FamilyGraph, rootId: string, generations = 4): PedigreeNode[] {
  const root = graph.byId.get(rootId);
  if (!root) return [];
  const slots: PedigreeNode[] = [{ person: root, generation: 0, slot: 0 }];
  let frontier: { person: Person; slot: number }[] = [{ person: root, slot: 0 }];
  for (let gen = 1; gen < generations; gen += 1) {
    const next: { person: Person; slot: number }[] = [];
    for (const item of frontier) {
      const parents = parentsOf(graph, item.person.id);
      const father = parents.find((entry) => entry.person.gender === "male") ?? parents[0];
      const mother = parents.find((entry) => entry.person !== father?.person) ?? parents[1];
      const leftSlot = item.slot * 2;
      const rightSlot = item.slot * 2 + 1;
      slots.push({ person: father?.person ?? null, generation: gen, slot: leftSlot });
      slots.push({ person: mother?.person ?? null, generation: gen, slot: rightSlot });
      if (father) next.push({ person: father.person, slot: leftSlot });
      if (mother) next.push({ person: mother.person, slot: rightSlot });
    }
    frontier = next;
  }
  return slots;
}

export function fanPeople(graph: FamilyGraph, rootId: string, generations = 5): { person: Person; generation: number }[] {
  return pedigreeSlots(graph, rootId, generations)
    .filter((item): item is PedigreeNode & { person: Person } => Boolean(item.person))
    .map((item) => ({ person: item.person, generation: item.generation }));
}
