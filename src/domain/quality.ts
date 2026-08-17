import type { FamilySnapshot, Person, Relationship } from "./types";
import { PARENT_TYPES } from "./types";
import { buildGraph, parentsOf } from "./graph";

export function mergePeople(snapshot: FamilySnapshot, keepId: string, dropId: string): FamilySnapshot {
  const keep = snapshot.people.find((person) => person.id === keepId);
  const drop = snapshot.people.find((person) => person.id === dropId);
  if (!keep || !drop || keepId === dropId) return snapshot;
  const merged: Person = {
    ...keep,
    middleName: keep.middleName || drop.middleName,
    lastName: keep.lastName || drop.lastName,
    nickname: keep.nickname || drop.nickname,
    avatar: keep.avatar || drop.avatar,
    birthDate: keep.birthDate || drop.birthDate,
    deathDate: keep.deathDate || drop.deathDate,
    description: [keep.description, drop.description].filter(Boolean).join("\n"),
    notes: [keep.notes, drop.notes].filter(Boolean).join("\n"),
    tags: [...new Set([...keep.tags, ...drop.tags])],
    birthPlace: keep.birthPlace || drop.birthPlace,
    deathPlace: keep.deathPlace || drop.deathPlace,
    updatedAt: new Date().toISOString(),
  };
  const relationships: Relationship[] = [];
  const seen = new Set<string>();
  for (const rel of snapshot.relationships) {
    if (rel.sourcePersonId === dropId && rel.targetPersonId === keepId) continue;
    if (rel.targetPersonId === dropId && rel.sourcePersonId === keepId) continue;
    const next = {
      ...rel,
      sourcePersonId: rel.sourcePersonId === dropId ? keepId : rel.sourcePersonId,
      targetPersonId: rel.targetPersonId === dropId ? keepId : rel.targetPersonId,
    };
    const key = `${next.sourcePersonId}|${next.targetPersonId}|${next.type}`;
    if (seen.has(key) || next.sourcePersonId === next.targetPersonId) continue;
    seen.add(key);
    relationships.push(next);
  }
  return {
    ...snapshot,
    people: snapshot.people.filter((person) => person.id !== dropId).map((person) => (person.id === keepId ? merged : person)),
    relationships,
    events: snapshot.events.map((event) => ({
      ...event,
      personId: event.personId === dropId ? keepId : event.personId,
      spousePersonId: event.spousePersonId === dropId ? keepId : event.spousePersonId,
    })),
    homePersonId: snapshot.homePersonId === dropId ? keepId : snapshot.homePersonId,
  };
}

export function findReplacePeople(
  people: Person[],
  field: "lastName" | "location" | "birthPlace" | "deathPlace",
  from: string,
  to: string,
): Person[] {
  if (!from) return people;
  return people.map((person) => ({
    ...person,
    [field]: person[field].includes(from) ? person[field].replaceAll(from, to) : person[field],
    updatedAt: person[field].includes(from) ? new Date().toISOString() : person.updatedAt,
  }));
}

export function qualityWarnings(snapshot: FamilySnapshot): { personId: string; message: string }[] {
  const graph = buildGraph(snapshot.people, snapshot.relationships);
  const warnings: { personId: string; message: string }[] = [];
  for (const person of snapshot.people) {
    const bios = parentsOf(graph, person.id).filter((item) => PARENT_TYPES[0] === item.type || item.type === "biological-parent");
    if (bios.length > 2) warnings.push({ personId: person.id, message: `${person.firstName} has ${bios.length} biological parents` });
  }
  return warnings;
}

export function duplicateCandidates(people: Person[]): [Person, Person][] {
  const pairs: [Person, Person][] = [];
  for (let i = 0; i < people.length; i += 1) {
    for (let j = i + 1; j < people.length; j += 1) {
      const a = people[i];
      const b = people[j];
      if (a.firstName === b.firstName && a.lastName === b.lastName && a.firstName) pairs.push([a, b]);
    }
  }
  return pairs;
}
