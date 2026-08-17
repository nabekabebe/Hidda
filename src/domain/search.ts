import { birthYear, displayName, type Person, type TreeFilters } from "./types";
import { branchOf, generationIndex, parentsOf, partnersOf, type FamilyGraph } from "./graph";

export interface SearchHit {
  person: Person;
  reason: string;
}

export function searchPeople(people: Person[], query: string): SearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: SearchHit[] = [];
  for (const person of people) {
    const name = displayName(person).toLowerCase();
    const nick = person.nickname.toLowerCase();
    const loc = person.location.toLowerCase();
    const occ = person.occupation.toLowerCase();
    const year = person.birthDate.slice(0, 4);
    const tags = person.tags.join(" ").toLowerCase();
    if (name.includes(q)) hits.push({ person, reason: "Name" });
    else if (nick.includes(q)) hits.push({ person, reason: "Nickname" });
    else if (loc.includes(q)) hits.push({ person, reason: "Location" });
    else if (occ.includes(q)) hits.push({ person, reason: "Occupation" });
    else if (year.startsWith(q) || year === q) hits.push({ person, reason: "Birth year" });
    else if (tags.includes(q)) hits.push({ person, reason: "Tag" });
  }
  return hits;
}

export function personMatchesFilters(
  person: Person,
  graph: FamilyGraph,
  filters: TreeFilters,
): boolean {
  if (filters.genders.length && !filters.genders.includes(person.gender)) return false;
  if (filters.living === "living" && person.deathDate) return false;
  if (filters.living === "deceased" && !person.deathDate) return false;
  if (filters.location && !person.location.toLowerCase().includes(filters.location.toLowerCase())) {
    return false;
  }
  if (filters.tags.length && !filters.tags.every((tag) => person.tags.includes(tag))) return false;
  const year = birthYear(person);
  if (filters.fromYear) {
    const from = Number(filters.fromYear);
    if (year === null || year < from) return false;
  }
  if (filters.toYear) {
    const to = Number(filters.toYear);
    if (year === null || year > to) return false;
  }
  if (filters.generations.length) {
    const gen = generationIndex(graph, person.id);
    if (!filters.generations.includes(gen)) return false;
  }
  if (filters.branchPersonId) {
    const branch = branchOf(graph, filters.branchPersonId);
    if (!branch.has(person.id)) return false;
  }
  if (filters.relationship !== "all") {
    const related =
      parentsOf(graph, person.id).some((item) => item.type === filters.relationship) ||
      partnersOf(graph, person.id).some((item) => item.type === filters.relationship);
    if (!related) return false;
  }
  return true;
}

export function filtersActive(filters: TreeFilters): boolean {
  return (
    filters.generations.length > 0 ||
    filters.genders.length > 0 ||
    filters.living !== "all" ||
    filters.relationship !== "all" ||
    Boolean(filters.location) ||
    filters.tags.length > 0 ||
    Boolean(filters.fromYear) ||
    Boolean(filters.toYear) ||
    Boolean(filters.branchPersonId)
  );
}
