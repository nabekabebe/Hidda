import {
  CHILD_TYPES,
  PARENT_TYPES,
  PARTNER_TYPES,
  SIBLING_TYPES,
  type CompassRelation,
  type Person,
  type Relationship,
  type RelationshipKind,
} from "./types";

export interface FamilyGraph {
  people: Map<string, Person>;
  relationships: Relationship[];
  byId: Map<string, Person>;
}

export function buildGraph(people: Person[], relationships: Relationship[]): FamilyGraph {
  const byId = new Map(people.map((person) => [person.id, person]));
  return { people: byId, relationships, byId };
}

function otherId(rel: Relationship, id: string): string | null {
  if (rel.sourcePersonId === id) return rel.targetPersonId;
  if (rel.targetPersonId === id) return rel.sourcePersonId;
  return null;
}

export function parentsOf(graph: FamilyGraph, id: string): { person: Person; type: RelationshipKind }[] {
  const found: { person: Person; type: RelationshipKind }[] = [];
  for (const rel of graph.relationships) {
    if (PARENT_TYPES.includes(rel.type as (typeof PARENT_TYPES)[number]) && rel.targetPersonId === id) {
      const person = graph.byId.get(rel.sourcePersonId);
      if (person) found.push({ person, type: rel.type });
    }
    if (CHILD_TYPES.includes(rel.type) && rel.sourcePersonId === id) {
      const person = graph.byId.get(rel.targetPersonId);
      if (person) found.push({ person, type: rel.type === "adopted-child" ? "adoptive-parent" : "biological-parent" });
    }
  }
  return uniquePeople(found);
}

export function childrenOf(graph: FamilyGraph, id: string): { person: Person; type: RelationshipKind }[] {
  const found: { person: Person; type: RelationshipKind }[] = [];
  for (const rel of graph.relationships) {
    if (PARENT_TYPES.includes(rel.type as (typeof PARENT_TYPES)[number]) && rel.sourcePersonId === id) {
      const person = graph.byId.get(rel.targetPersonId);
      if (person) found.push({ person, type: rel.type });
    }
    if (CHILD_TYPES.includes(rel.type) && rel.targetPersonId === id) {
      const person = graph.byId.get(rel.sourcePersonId);
      if (person) found.push({ person, type: rel.type });
    }
  }
  return uniquePeople(found);
}

export function partnersOf(graph: FamilyGraph, id: string): { person: Person; type: RelationshipKind }[] {
  const found: { person: Person; type: RelationshipKind }[] = [];
  for (const rel of graph.relationships) {
    if (!PARTNER_TYPES.includes(rel.type as (typeof PARTNER_TYPES)[number])) continue;
    const other = otherId(rel, id);
    if (!other) continue;
    const person = graph.byId.get(other);
    if (person) found.push({ person, type: rel.type });
  }
  return uniquePeople(found);
}

export function siblingsOf(graph: FamilyGraph, id: string): { person: Person; type: RelationshipKind }[] {
  const found: { person: Person; type: RelationshipKind }[] = [];
  for (const rel of graph.relationships) {
    if (!SIBLING_TYPES.includes(rel.type as (typeof SIBLING_TYPES)[number])) continue;
    const other = otherId(rel, id);
    if (!other) continue;
    const person = graph.byId.get(other);
    if (person) found.push({ person, type: rel.type });
  }
  const parentIds = new Set(parentsOf(graph, id).map((item) => item.person.id));
  for (const person of graph.byId.values()) {
    if (person.id === id) continue;
    const shared = parentsOf(graph, person.id).filter((item) => parentIds.has(item.person.id));
    if (shared.length === 0) continue;
    const type: RelationshipKind = shared.length >= 2 ? "sibling" : "half-sibling";
    found.push({ person, type });
  }
  return uniquePeople(found);
}

export function generationIndex(graph: FamilyGraph, id: string, memo = new Map<string, number>()): number {
  const cached = memo.get(id);
  if (cached !== undefined) return cached;
  memo.set(id, 0);
  const parents = parentsOf(graph, id);
  const gen = parents.length === 0 ? 0 : Math.max(...parents.map((item) => generationIndex(graph, item.person.id, memo))) + 1;
  memo.set(id, gen);
  return gen;
}

export function generationsFor(graph: FamilyGraph): Map<string, number> {
  const memo = new Map<string, number>();
  for (const id of graph.byId.keys()) generationIndex(graph, id, memo);
  return memo;
}

export function generationCount(graph: FamilyGraph): number {
  if (graph.byId.size === 0) return 0;
  return Math.max(...generationsFor(graph).values()) + 1;
}

export function descendantsOf(graph: FamilyGraph, id: string): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    for (const child of childrenOf(graph, current)) {
      if (out.has(child.person.id)) continue;
      out.add(child.person.id);
      stack.push(child.person.id);
    }
  }
  return out;
}

export function ancestorsOf(graph: FamilyGraph, id: string): Set<string> {
  const out = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const current = stack.pop()!;
    for (const parent of parentsOf(graph, current)) {
      if (out.has(parent.person.id)) continue;
      out.add(parent.person.id);
      stack.push(parent.person.id);
    }
  }
  return out;
}

export function branchOf(graph: FamilyGraph, id: string): Set<string> {
  const set = new Set<string>([id]);
  for (const item of ancestorsOf(graph, id)) set.add(item);
  for (const item of descendantsOf(graph, id)) set.add(item);
  for (const partner of partnersOf(graph, id)) set.add(partner.person.id);
  return set;
}

/** The selected person, their descendants, and partners of that line — not ancestors. */
export function descendantBranchOf(graph: FamilyGraph, id: string): Set<string> {
  const set = new Set<string>([id, ...descendantsOf(graph, id)]);
  for (const member of [...set]) {
    for (const partner of partnersOf(graph, member)) set.add(partner.person.id);
  }
  return set;
}

export function rootsOf(graph: FamilyGraph): Person[] {
  return [...graph.byId.values()].filter((person) => parentsOf(graph, person.id).length === 0);
}

function uniquePeople(items: { person: Person; type: RelationshipKind }[]): { person: Person; type: RelationshipKind }[] {
  const seen = new Set<string>();
  const out: { person: Person; type: RelationshipKind }[] = [];
  for (const item of items) {
    if (seen.has(item.person.id)) continue;
    seen.add(item.person.id);
    out.push(item);
  }
  return out;
}

export function directedRelationship(
  fromId: string,
  toId: string,
  relation: CompassRelation,
): { sourcePersonId: string; targetPersonId: string; type: RelationshipKind } {
  const type: RelationshipKind =
    relation === "parent" || relation === "child" ? "biological-parent" : relation === "spouse" ? "spouse" : "sibling";
  if (relation === "parent") return { sourcePersonId: toId, targetPersonId: fromId, type };
  return { sourcePersonId: fromId, targetPersonId: toId, type };
}

export function alreadyRelated(graph: FamilyGraph, fromId: string, toId: string, relation: CompassRelation): boolean {
  if (fromId === toId) return true;
  if (relation === "parent") return parentsOf(graph, fromId).some((item) => item.person.id === toId);
  if (relation === "child") return childrenOf(graph, fromId).some((item) => item.person.id === toId);
  if (relation === "spouse") return partnersOf(graph, fromId).some((item) => item.person.id === toId);
  return siblingsOf(graph, fromId).some((item) => item.person.id === toId);
}

export function wouldCycle(graph: FamilyGraph, fromId: string, toId: string, relation: CompassRelation): boolean {
  if (relation === "parent") return descendantsOf(graph, fromId).has(toId);
  if (relation === "child") return ancestorsOf(graph, fromId).has(toId);
  return false;
}

export function connectCandidates(graph: FamilyGraph, fromId: string, relation: CompassRelation): Person[] {
  return [...graph.byId.values()]
    .filter((person) => person.id !== fromId)
    .filter((person) => !alreadyRelated(graph, fromId, person.id, relation))
    .filter((person) => !wouldCycle(graph, fromId, person.id, relation))
    .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
}

export function relationshipLabel(type: RelationshipKind): string {
  switch (type) {
    case "biological-parent":
      return "Parent";
    case "adoptive-parent":
      return "Adoptive parent";
    case "step-parent":
      return "Step-parent";
    case "spouse":
      return "Spouse";
    case "former-spouse":
      return "Former spouse";
    case "partner":
      return "Partner";
    case "sibling":
      return "Sibling";
    case "half-sibling":
      return "Half-sibling";
    case "child":
      return "Child";
    case "adopted-child":
      return "Adopted child";
  }
}
