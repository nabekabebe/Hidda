import { emptyDraft, personFromDraft, type FamilyEvent, type FamilySnapshot, type Person, type Relationship } from "./types";
import { normalizeSnapshot } from "./share";
import { partnershipFacts } from "./partnership";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export interface GedcomResult {
  snapshot: FamilySnapshot;
  skipped: string[];
}

interface GedLine {
  level: number;
  xref: string;
  tag: string;
  value: string;
}

function parseLines(text: string): GedLine[] {
  return text.replace(/^\uFEFF/, "").split(/\r?\n/).flatMap((raw) => {
    const match = raw.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?([A-Za-z0-9_]+)(?:\s+(.*))?$/);
    if (!match) return [];
    return [{ level: Number(match[1]), xref: match[2] ?? "", tag: match[3].toUpperCase(), value: match[4] ?? "" }];
  });
}

function parseDate(value: string): string {
  const clean = value.replace(/^(ABT|EST|CAL|AFT|BEF|BET)\s+/i, "").trim();
  const full = clean.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i);
  if (full) {
    const month = MONTHS.indexOf(full[2].toUpperCase()) + 1;
    if (month) return `${full[3]}-${String(month).padStart(2, "0")}-${full[1].padStart(2, "0")}`;
  }
  const monthYear = clean.match(/^([A-Z]{3})\s+(\d{4})$/i);
  if (monthYear) {
    const month = MONTHS.indexOf(monthYear[1].toUpperCase()) + 1;
    if (month) return `${monthYear[2]}-${String(month).padStart(2, "0")}`;
  }
  const year = clean.match(/^(\d{4})$/);
  return year ? year[1] : "";
}

function formatDate(value: string): string {
  const full = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) return `${Number(full[3])} ${MONTHS[Number(full[2]) - 1]} ${full[1]}`;
  const month = value.match(/^(\d{4})-(\d{2})$/);
  if (month) return `${MONTHS[Number(month[2]) - 1]} ${month[1]}`;
  return value.slice(0, 4);
}

function parseName(value: string): { firstName: string; lastName: string } {
  const match = value.match(/^(.*?)\s*\/([^/]*)\/\s*(.*)$/);
  if (!match) return { firstName: value.trim(), lastName: "" };
  return { firstName: match[1].trim(), lastName: match[2].trim() };
}

function childrenOf(lines: GedLine[], start: number, parentLevel: number): { line: GedLine; index: number }[] {
  const out: { line: GedLine; index: number }[] = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i].level <= parentLevel) break;
    if (lines[i].level === parentLevel + 1) out.push({ line: lines[i], index: i });
  }
  return out;
}

function xrefId(value: string): string {
  return value.replace(/@/g, "") || crypto.randomUUID();
}

function factFrom(lines: GedLine[], index: number, personId: string, type: FamilyEvent["type"]): FamilyEvent {
  let date = "";
  let place = "";
  let detail = "";
  for (const child of childrenOf(lines, index, lines[index].level)) {
    if (child.line.tag === "DATE") date = parseDate(child.line.value);
    if (child.line.tag === "PLAC") place = child.line.value;
    if (child.line.tag === "NOTE" || child.line.tag === "TYPE") detail = child.line.value;
  }
  return { id: crypto.randomUUID(), type, personId, date, place, detail };
}

export function importGedcom(text: string): GedcomResult {
  const lines = parseLines(text);
  const skipped = new Set<string>();
  const people = new Map<string, Person>();
  const events: FamilyEvent[] = [];
  const now = new Date().toISOString();
  const known = new Set([
    "HEAD", "TRLR", "INDI", "FAM", "SUBM", "NOTE", "SOUR", "REPO", "OBJE",
    "NAME", "GIVN", "SURN", "NPFX", "NSFX", "NICK", "SEX", "BIRT", "DEAT", "BURI", "BAPM", "CHR",
    "DATE", "PLAC", "OCCU", "RESI", "FAMC", "FAMS", "HUSB", "WIFE", "CHIL", "MARR", "DIV",
    "CHAR", "GEDC", "VERS", "FORM", "SOUR", "CONT", "CONC", "TITL", "FILE",
  ]);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.level !== 0) continue;
    if (line.tag === "INDI") {
      const id = xrefId(line.xref);
      const draft = emptyDraft();
      let note = "";
      for (const child of childrenOf(lines, i, 0)) {
        if (child.line.tag === "NAME") {
          const parsed = parseName(child.line.value);
          draft.firstName = draft.firstName || parsed.firstName;
          draft.lastName = draft.lastName || parsed.lastName;
          for (const part of childrenOf(lines, child.index, child.line.level)) {
            if (part.line.tag === "GIVN") draft.firstName = part.line.value;
            if (part.line.tag === "SURN") draft.lastName = part.line.value;
            if (part.line.tag === "NPFX") draft.prefix = part.line.value;
            if (part.line.tag === "NSFX") draft.suffix = part.line.value;
            if (part.line.tag === "NICK") draft.nickname = part.line.value;
          }
        } else if (child.line.tag === "SEX") {
          draft.gender = child.line.value === "F" ? "female" : child.line.value === "M" ? "male" : "unknown";
        } else if (child.line.tag === "BIRT") {
          const event = factFrom(lines, child.index, id, "birth");
          draft.birthDate = event.date;
          draft.birthPlace = event.place;
          events.push(event);
        } else if (child.line.tag === "DEAT") {
          const event = factFrom(lines, child.index, id, "death");
          draft.deathDate = event.date;
          draft.deathPlace = event.place;
          events.push(event);
        } else if (child.line.tag === "BURI") {
          const event = factFrom(lines, child.index, id, "burial");
          draft.burialPlace = event.place;
          events.push(event);
        } else if (child.line.tag === "BAPM" || child.line.tag === "CHR") {
          events.push(factFrom(lines, child.index, id, child.line.tag === "BAPM" ? "baptism" : "christening"));
        } else if (child.line.tag === "OCCU") {
          draft.occupation = child.line.value;
          events.push(factFrom(lines, child.index, id, "occupation"));
        } else if (child.line.tag === "RESI") {
          draft.location = childrenOf(lines, child.index, child.line.level).find((item) => item.line.tag === "PLAC")?.line.value || child.line.value;
          events.push(factFrom(lines, child.index, id, "residence"));
        } else if (child.line.tag === "NOTE") {
          note = [note, child.line.value].filter(Boolean).join("\n");
        }
      }
      draft.notes = note || "Imported from GEDCOM.";
      people.set(id, personFromDraft(id, draft, now));
    } else if (!["HEAD", "TRLR", "FAM", "SUBM"].includes(line.tag)) {
      skipped.add(line.tag);
    }
    if (line.level === 0 && !known.has(line.tag)) skipped.add(line.tag);
  }

  const relationships: Relationship[] = [];
  const seen = new Set<string>();
  function addRel(source: string, target: string, type: Relationship["type"], metadata: Record<string, string> = {}) {
    const key = `${source}|${target}|${type}`;
    if (!people.has(source) || !people.has(target) || seen.has(key)) return;
    seen.add(key);
    relationships.push({
      id: crypto.randomUUID(),
      sourcePersonId: source,
      targetPersonId: target,
      type,
      metadata,
      createdAt: now,
    });
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.level !== 0 || line.tag !== "FAM") continue;
    let husb = "";
    let wife = "";
    const children: string[] = [];
    let marriedOn = "";
    let marriedPlace = "";
    let endedOn = "";
    for (const child of childrenOf(lines, i, 0)) {
      if (child.line.tag === "HUSB") husb = xrefId(child.line.value);
      if (child.line.tag === "WIFE") wife = xrefId(child.line.value);
      if (child.line.tag === "CHIL") children.push(xrefId(child.line.value));
      if (child.line.tag === "MARR") {
        const event = factFrom(lines, child.index, husb || wife, "marriage");
        marriedOn = event.date;
        marriedPlace = event.place;
        if (husb) events.push({ ...event, personId: husb, spousePersonId: wife || undefined });
      }
      if (child.line.tag === "DIV") {
        const event = factFrom(lines, child.index, husb || wife, "divorce");
        endedOn = event.date;
        if (husb) events.push({ ...event, personId: husb, spousePersonId: wife || undefined });
      }
    }
    if (husb && wife) {
      addRel(husb, wife, endedOn ? "former-spouse" : "spouse", { marriedOn, marriedPlace, endedOn, endedPlace: "" });
    }
    for (const childId of children) {
      if (husb) addRel(husb, childId, "biological-parent");
      if (wife) addRel(wife, childId, "biological-parent");
    }
  }

  const snapshot = normalizeSnapshot({
    name: "Imported family",
    people: [...people.values()],
    relationships,
    events,
    inscriptions: [{ id: crypto.randomUUID(), text: "Imported family", x: 240, y: -56, kind: "title" }],
  });
  return { snapshot, skipped: [...skipped].sort() };
}

function sex(person: Person): string {
  if (person.gender === "female") return "F";
  if (person.gender === "male") return "M";
  return "U";
}

function push(lines: string[], level: number, tag: string, value = "") {
  lines.push(`${level} ${tag}${value ? ` ${value}` : ""}`);
}

export function exportGedcom(snapshot: FamilySnapshot): string {
  const lines: string[] = [];
  push(lines, 0, "HEAD");
  push(lines, 1, "SOUR", "Hidda");
  push(lines, 1, "GEDC");
  push(lines, 2, "VERS", "5.5.1");
  push(lines, 2, "FORM", "LINEAGE-LINKED");
  push(lines, 1, "CHAR", "UTF-8");
  const people = snapshot.people;
  const byId = new Map(people.map((person) => [person.id, person]));
  for (const person of people) {
    push(lines, 0, `@${person.id}@`, "INDI");
    push(lines, 1, "NAME", `${person.firstName} /${person.lastName}/`);
    if (person.prefix) push(lines, 2, "NPFX", person.prefix);
    if (person.suffix) push(lines, 2, "NSFX", person.suffix);
    if (person.nickname) push(lines, 2, "NICK", person.nickname);
    push(lines, 1, "SEX", sex(person));
    if (person.birthDate || person.birthPlace) {
      push(lines, 1, "BIRT");
      if (person.birthDate) push(lines, 2, "DATE", formatDate(person.birthDate));
      if (person.birthPlace) push(lines, 2, "PLAC", person.birthPlace);
    }
    if (person.deathDate || person.deathPlace) {
      push(lines, 1, "DEAT");
      if (person.deathDate) push(lines, 2, "DATE", formatDate(person.deathDate));
      if (person.deathPlace) push(lines, 2, "PLAC", person.deathPlace);
    }
    if (person.burialPlace) {
      push(lines, 1, "BURI");
      push(lines, 2, "PLAC", person.burialPlace);
    }
    if (person.occupation) push(lines, 1, "OCCU", person.occupation);
    if (person.notes) push(lines, 1, "NOTE", person.notes.replace(/\n/g, " "));
  }

  const couples = new Map<string, { a: string; b: string; rel?: Relationship; children: Set<string> }>();
  function coupleKey(a: string, b: string) {
    return [a, b].sort().join("|");
  }
  for (const rel of snapshot.relationships) {
    if (rel.type === "spouse" || rel.type === "former-spouse" || rel.type === "partner") {
      const key = coupleKey(rel.sourcePersonId, rel.targetPersonId);
      const current = couples.get(key) ?? { a: rel.sourcePersonId, b: rel.targetPersonId, children: new Set<string>() };
      current.rel = rel;
      couples.set(key, current);
    }
    if (rel.type === "biological-parent" || rel.type === "adoptive-parent" || rel.type === "step-parent") {
      const child = rel.targetPersonId;
      const parent = rel.sourcePersonId;
      const otherParents = snapshot.relationships
        .filter((item) => item.targetPersonId === child && item.sourcePersonId !== parent && (item.type === "biological-parent" || item.type === "adoptive-parent" || item.type === "step-parent"))
        .map((item) => item.sourcePersonId);
      const partner = otherParents[0];
      const key = partner ? coupleKey(parent, partner) : `solo|${parent}`;
      const current = couples.get(key) ?? { a: parent, b: partner || parent, children: new Set<string>() };
      current.children.add(child);
      couples.set(key, current);
    }
  }

  let fam = 1;
  for (const group of couples.values()) {
    if (!byId.has(group.a) || !byId.has(group.b)) continue;
    push(lines, 0, `@F${fam}@`, "FAM");
    fam += 1;
    const a = byId.get(group.a)!;
    const b = byId.get(group.b)!;
    const husb = a.gender === "female" ? b : a;
    const wife = husb.id === a.id ? b : a;
    push(lines, 1, "HUSB", `@${husb.id}@`);
    if (wife.id !== husb.id) push(lines, 1, "WIFE", `@${wife.id}@`);
    for (const child of group.children) push(lines, 1, "CHIL", `@${child}@`);
    if (group.rel) {
      const facts = partnershipFacts(group.rel);
      if (facts.marriedOn || facts.marriedPlace) {
        push(lines, 1, "MARR");
        if (facts.marriedOn) push(lines, 2, "DATE", formatDate(facts.marriedOn));
        if (facts.marriedPlace) push(lines, 2, "PLAC", facts.marriedPlace);
      }
      if (facts.endedOn) {
        push(lines, 1, "DIV");
        push(lines, 2, "DATE", formatDate(facts.endedOn));
      }
    }
  }
  push(lines, 0, "TRLR");
  return lines.join("\n") + "\n";
}
