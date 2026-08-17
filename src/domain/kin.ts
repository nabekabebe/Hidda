import { ancestorsOf, childrenOf, parentsOf, partnersOf, siblingsOf, type FamilyGraph } from "./graph";
import type { Person } from "./types";

function hopsToward(
  graph: FamilyGraph,
  fromId: string,
  toward: Set<string>,
  walk: (graph: FamilyGraph, id: string) => { person: Person }[],
): number | null {
  const seen = new Set<string>([fromId]);
  let edge = [fromId];
  let dist = 0;
  while (edge.length) {
    const next: string[] = [];
    for (const id of edge) {
      if (toward.has(id) && dist > 0) return dist;
      for (const item of walk(graph, id)) {
        if (seen.has(item.person.id)) continue;
        seen.add(item.person.id);
        next.push(item.person.id);
      }
    }
    dist += 1;
    edge = next;
  }
  return null;
}

function gendered(person: Person, female: string, male: string, fallback: string): string {
  if (person.gender === "female") return female;
  if (person.gender === "male") return male;
  return fallback;
}

function great(n: number, noun: string): string {
  if (n <= 0) return noun;
  if (n === 1) return `great-${noun}`;
  return `${n}th great-${noun}`;
}

export function relationToHome(graph: FamilyGraph, personId: string, homePersonId: string | null): string {
  if (!homePersonId) return "";
  if (personId === homePersonId) return "Home person";
  const person = graph.byId.get(personId);
  const home = graph.byId.get(homePersonId);
  if (!person || !home) return "";

  if (partnersOf(graph, homePersonId).some((item) => item.person.id === personId)) {
    return gendered(person, "Wife", "Husband", "Partner");
  }
  if (parentsOf(graph, homePersonId).some((item) => item.person.id === personId)) {
    return gendered(person, "Mother", "Father", "Parent");
  }
  if (childrenOf(graph, homePersonId).some((item) => item.person.id === personId)) {
    return gendered(person, "Daughter", "Son", "Child");
  }
  if (siblingsOf(graph, homePersonId).some((item) => item.person.id === personId)) {
    return gendered(person, "Sister", "Brother", "Sibling");
  }

  const ancestorHops = hopsToward(graph, homePersonId, new Set([personId]), parentsOf);
  if (ancestorHops === 2) return gendered(person, "Grandmother", "Grandfather", "Grandparent");
  if (ancestorHops && ancestorHops > 2) {
    return gendered(person, great(ancestorHops - 2, "grandmother"), great(ancestorHops - 2, "grandfather"), great(ancestorHops - 2, "grandparent"));
  }

  const descendantHops = hopsToward(graph, homePersonId, new Set([personId]), childrenOf);
  if (descendantHops === 2) return gendered(person, "Granddaughter", "Grandson", "Grandchild");
  if (descendantHops && descendantHops > 2) {
    return gendered(person, great(descendantHops - 2, "granddaughter"), great(descendantHops - 2, "grandson"), great(descendantHops - 2, "grandchild"));
  }

  const homeAncestors = new Set([homePersonId, ...ancestorsOf(graph, homePersonId)]);
  const personAncestors = new Set([personId, ...ancestorsOf(graph, personId)]);
  const shared = [...homeAncestors].filter((id) => personAncestors.has(id));
  if (!shared.length) return "Unrelated in this atlas";

  let common = shared[0];
  let commonDepth = hopsToward(graph, homePersonId, new Set([common]), parentsOf) ?? 0;
  for (const id of shared) {
    const depth = hopsToward(graph, homePersonId, new Set([id]), parentsOf) ?? 0;
    if (depth < commonDepth) {
      common = id;
      commonDepth = depth;
    }
  }
  const up = hopsToward(graph, homePersonId, new Set([common]), parentsOf) ?? 0;
  const down = hopsToward(graph, personId, new Set([common]), parentsOf) ?? 0;
  if (up === 1 && down === 2) return gendered(person, "Niece", "Nephew", "Nibling");
  if (up === 2 && down === 1) return gendered(person, "Aunt", "Uncle", "Parent's sibling");
  if (up >= 1 && down >= 1) {
    const cousin = Math.min(up, down) - 1;
    const removed = Math.abs(up - down);
    if (cousin <= 0 && removed) return gendered(person, great(removed - 1, "aunt"), great(removed - 1, "uncle"), "Removed relative");
    const label = cousin === 1 ? "1st cousin" : cousin === 2 ? "2nd cousin" : `${cousin}th cousin`;
    return removed ? `${label} ${removed}x removed` : label;
  }
  return "Relative";
}

export function isDisconnected(graph: FamilyGraph, id: string): boolean {
  return (
    parentsOf(graph, id).length === 0 &&
    childrenOf(graph, id).length === 0 &&
    partnersOf(graph, id).length === 0 &&
    siblingsOf(graph, id).length === 0
  );
}
