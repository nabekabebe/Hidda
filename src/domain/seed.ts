import { emptyDraft, personFromDraft, type Person, type Relationship } from "./types";

const now = "2026-03-12T10:00:00.000Z";

function person(
  id: string,
  patch: Partial<Person> & Pick<Person, "firstName" | "lastName">,
): Person {
  return personFromDraft(
    id,
    {
      ...emptyDraft(),
      gender: "unknown",
      ...patch,
    },
    now,
  );
}

export const SEED_PEOPLE: Person[] = [
  person("ruth", {
    firstName: "Ruth",
    lastName: "Calder",
    nickname: "Gran",
    gender: "female",
    birthDate: "1921-04-08",
    deathDate: "2008-11-02",
    description: "Kept the family stories in a green ledger by the stove.",
    occupation: "School librarian",
    location: "Kingston",
    tags: ["elder", "calder"],
    avatar: "/avatars/ruth-calder.webp",
    notes: "Synthetic demonstration person.",
  }),
  person("tomas", {
    firstName: "Tomas",
    lastName: "Solano",
    nickname: "Tomo",
    gender: "male",
    birthDate: "1918-09-19",
    deathDate: "2004-06-14",
    description: "Dockworker who mapped cousins on the back of envelopes.",
    occupation: "Harbor clerk",
    location: "Kingston",
    tags: ["elder", "solano"],
    avatar: "/avatars/tomas-solano.webp",
    notes: "Synthetic demonstration person.",
  }),
  person("mira", {
    firstName: "Mira",
    lastName: "Solano",
    nickname: "Miri",
    gender: "female",
    birthDate: "1952-02-21",
    description: "The one who started this atlas so nobody would have to guess.",
    occupation: "Archivist",
    location: "Brooklyn",
    tags: ["solano"],
    avatar: "/avatars/mira-solano.webp",
    notes: "Synthetic demonstration person.",
  }),
  person("elias", {
    firstName: "Elias",
    lastName: "Solano",
    gender: "male",
    birthDate: "1955-07-03",
    description: "Sends voice notes instead of letters, still knows every cousin.",
    occupation: "Jazz pianist",
    location: "Chicago",
    tags: ["solano"],
    avatar: "/avatars/elias-solano.webp",
    notes: "Synthetic demonstration person.",
  }),
  person("daniel", {
    firstName: "Daniel",
    lastName: "Okoye",
    nickname: "Dan",
    gender: "male",
    birthDate: "1950-12-11",
    description: "Cooks for whoever walks in. Married into the atlas and stayed.",
    occupation: "Chef",
    location: "Brooklyn",
    tags: ["okoye"],
    avatar: "/avatars/daniel-okoye.webp",
    notes: "Synthetic demonstration person.",
  }),
  person("noor", {
    firstName: "Noor",
    lastName: "Solano",
    gender: "female",
    birthDate: "1981-05-16",
    description: "Draws family maps for a living, then comes home to this one.",
    occupation: "Cartographer",
    location: "Lisbon",
    tags: ["solano"],
    avatar: "/avatars/noor-solano.webp",
    notes: "Synthetic demonstration person.",
  }),
  person("levi", {
    firstName: "Levi",
    lastName: "Solano",
    gender: "male",
    birthDate: "1984-08-29",
    description: "Keeps the photographs. Always the extra chair.",
    occupation: "Photo editor",
    location: "Brooklyn",
    tags: ["solano"],
    avatar: "/avatars/levi-solano.webp",
    notes: "Synthetic demonstration person.",
  }),
  person("asha", {
    firstName: "Asha",
    lastName: "Solano",
    gender: "female",
    birthDate: "2004-01-12",
    description: "Asks the questions that reopen whole branches.",
    occupation: "Student",
    location: "Lisbon",
    tags: ["solano"],
    avatar: "/avatars/asha-solano.webp",
    notes: "Synthetic demonstration person.",
  }),
];

function rel(
  id: string,
  sourcePersonId: string,
  targetPersonId: string,
  type: Relationship["type"],
  metadata: Record<string, string> = {},
): Relationship {
  return { id, sourcePersonId, targetPersonId, type, metadata, createdAt: now };
}

export const SEED_RELATIONSHIPS: Relationship[] = [
  rel("r1", "tomas", "mira", "biological-parent"),
  rel("r2", "ruth", "mira", "biological-parent"),
  rel("r3", "tomas", "elias", "biological-parent"),
  rel("r4", "ruth", "elias", "biological-parent"),
  rel("r5", "tomas", "ruth", "spouse", { marriedOn: "1946-06-12", marriedPlace: "Kingston" }),
  rel("r6", "mira", "elias", "sibling"),
  rel("r7", "mira", "daniel", "spouse", { marriedOn: "1978-09-03", marriedPlace: "Brooklyn" }),
  rel("r8", "mira", "noor", "biological-parent"),
  rel("r9", "daniel", "noor", "biological-parent"),
  rel("r10", "mira", "levi", "biological-parent"),
  rel("r11", "daniel", "levi", "biological-parent"),
  rel("r12", "noor", "levi", "sibling"),
  rel("r13", "noor", "asha", "biological-parent"),
];

export const SEED_FOCUS_ID = "mira";
