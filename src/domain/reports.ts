import { childrenOf, partnersOf, buildGraph } from "./graph";
import { displayName, type FamilySnapshot, type Person } from "./types";
import { partnershipFacts } from "./partnership";
import { eventsForPerson, eventLabel } from "./events";

export function peopleCsv(snapshot: FamilySnapshot): string {
  const header = ["id", "prefix", "firstName", "middleName", "lastName", "suffix", "gender", "birthDate", "birthPlace", "deathDate", "deathPlace", "occupation"];
  const rows = snapshot.people.map((person) =>
    header.map((key) => csvCell(String((person as unknown as Record<string, string>)[key] ?? ""))).join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`;
  return value;
}

export function familyGroupSheet(snapshot: FamilySnapshot, personId: string): string {
  const graph = buildGraph(snapshot.people, snapshot.relationships);
  const person = graph.byId.get(personId);
  if (!person) return "";
  const partners = partnersOf(graph, personId);
  const partner = partners[0]?.person;
  const kids = childrenOf(graph, personId);
  const rel = snapshot.relationships.find(
    (item) =>
      (item.sourcePersonId === personId && item.targetPersonId === partner?.id) ||
      (item.targetPersonId === personId && item.sourcePersonId === partner?.id),
  );
  const marriage = rel ? partnershipFacts(rel) : { marriedOn: "", marriedPlace: "", endedOn: "", endedPlace: "" };
  const lines = [
    `Family group sheet`,
    `${displayName(person)}${partner ? ` and ${displayName(partner)}` : ""}`,
    personLine(person),
    partner ? personLine(partner) : "No partner recorded",
    marriage.marriedOn ? `Married ${marriage.marriedOn}${marriage.marriedPlace ? ` in ${marriage.marriedPlace}` : ""}` : "",
    "",
    "Children",
    ...kids.map((item, index) => `${index + 1}. ${personLine(item.person)}`),
  ];
  return lines.filter((line) => line !== "").join("\n");
}

function personLine(person: Person): string {
  const years = [person.birthDate, person.deathDate].filter(Boolean).join(" – ");
  const place = person.birthPlace || person.location;
  return `${displayName(person)}${years ? ` (${years})` : ""}${place ? `, ${place}` : ""}`;
}

export function narrativeReport(snapshot: FamilySnapshot, personId: string): string {
  const person = snapshot.people.find((item) => item.id === personId);
  if (!person) return "";
  const graph = buildGraph(snapshot.people, snapshot.relationships);
  const parents = [...graph.relationships]
    .filter((rel) => rel.targetPersonId === personId && rel.type.includes("parent"))
    .map((rel) => snapshot.people.find((item) => item.id === rel.sourcePersonId)?.firstName)
    .filter(Boolean);
  const facts = eventsForPerson(snapshot.events, personId)
    .filter((event) => event.date)
    .map((event) => `${eventLabel(event.type).toLowerCase()} ${event.date}${event.place ? ` in ${event.place}` : ""}`);
  const born = person.birthDate ? ` was born ${person.birthDate}${person.birthPlace ? ` in ${person.birthPlace}` : ""}` : "";
  const died = person.deathDate ? ` and died ${person.deathDate}${person.deathPlace ? ` in ${person.deathPlace}` : ""}` : "";
  const parentBit = parents.length ? ` ${displayName(person)} is a child of ${parents.join(" and ")}.` : "";
  const factBit = facts.length ? ` Recorded facts: ${facts.join("; ")}.` : "";
  return `${displayName(person)}${born}${died}.${parentBit}${factBit}`.replace("..", ".");
}

export function uniquePlaces(snapshot: FamilySnapshot): { label: string; personId: string }[] {
  const rows: { label: string; personId: string }[] = [];
  for (const person of snapshot.people) {
    for (const place of [person.birthPlace, person.deathPlace, person.burialPlace, person.location]) {
      if (place) rows.push({ label: place, personId: person.id });
    }
  }
  for (const event of snapshot.events) {
    if (event.place) rows.push({ label: event.place, personId: event.personId });
  }
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.label}|${row.personId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
