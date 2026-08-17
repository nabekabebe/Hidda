import { DEFAULT_ATLAS_NAME, emptyInscriptions, normalizeSnapshot } from "../src/domain/share.js";
import { SEED_PEOPLE, SEED_RELATIONSHIPS } from "../src/domain/seed.js";
import {
  personFromDraft,
  type AtlasInscription,
  type FamilySnapshot,
  type Person,
  type PersonDraft,
  type Relationship,
  type RelationshipKind,
} from "../src/domain/types.js";
import type { Sql } from "./db.js";

interface PersonRow {
  id: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  nickname: string;
  avatar: string;
  gender: Person["gender"];
  birth_date: string;
  death_date: string;
  description: string;
  occupation: string;
  location: string;
  notes: string;
  tags: string[] | string;
  created_at: string | Date;
  updated_at: string | Date;
  prefix?: string;
  suffix?: string;
  birth_last_name?: string;
  birth_place?: string;
  death_place?: string;
  burial_place?: string;
  cause_of_death?: string;
}

interface RelationshipRow {
  id: string;
  source_person_id: string;
  target_person_id: string;
  type: RelationshipKind;
  metadata: Record<string, string> | string;
  created_at: string | Date;
}

function asIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function asTags(value: PersonRow["tags"]): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function asMetadata(value: RelationshipRow["metadata"]): Record<string, string> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as Record<string, string>;
    } catch {
      return {};
    }
  }
  return {};
}

function personFromRow(row: PersonRow): Person {
  return {
    id: row.id,
    prefix: row.prefix ?? "",
    firstName: row.first_name,
    middleName: row.middle_name,
    lastName: row.last_name,
    suffix: row.suffix ?? "",
    birthLastName: row.birth_last_name ?? "",
    nickname: row.nickname,
    avatar: row.avatar,
    gender: row.gender,
    birthDate: row.birth_date,
    deathDate: row.death_date,
    description: row.description,
    occupation: row.occupation,
    location: row.location,
    birthPlace: row.birth_place || row.location,
    deathPlace: row.death_place ?? "",
    burialPlace: row.burial_place ?? "",
    causeOfDeath: row.cause_of_death ?? "",
    notes: row.notes,
    tags: asTags(row.tags),
    createdAt: asIso(row.created_at),
    updatedAt: asIso(row.updated_at),
  };
}

function relationshipFromRow(row: RelationshipRow): Relationship {
  return {
    id: row.id,
    sourcePersonId: row.source_person_id,
    targetPersonId: row.target_person_id,
    type: row.type,
    metadata: asMetadata(row.metadata),
    createdAt: asIso(row.created_at),
  };
}

async function insertPerson(sql: Sql, person: Person): Promise<void> {
  await sql`
    INSERT INTO people (
      id, first_name, middle_name, last_name, nickname, avatar, gender,
      birth_date, death_date, description, occupation, location, notes, tags,
      prefix, suffix, birth_last_name, birth_place, death_place, burial_place, cause_of_death,
      created_at, updated_at
    ) VALUES (
      ${person.id}, ${person.firstName}, ${person.middleName}, ${person.lastName},
      ${person.nickname}, ${person.avatar}, ${person.gender}, ${person.birthDate},
      ${person.deathDate}, ${person.description}, ${person.occupation}, ${person.location},
      ${person.notes}, ${JSON.stringify(person.tags)}::jsonb,
      ${person.prefix}, ${person.suffix}, ${person.birthLastName}, ${person.birthPlace},
      ${person.deathPlace}, ${person.burialPlace}, ${person.causeOfDeath},
      ${person.createdAt}::timestamptz, ${person.updatedAt}::timestamptz
    )
  `;
}

async function insertRelationship(sql: Sql, rel: Relationship): Promise<void> {
  await sql`
    INSERT INTO relationships (id, source_person_id, target_person_id, type, metadata, created_at)
    VALUES (
      ${rel.id}, ${rel.sourcePersonId}, ${rel.targetPersonId}, ${rel.type},
      ${JSON.stringify(rel.metadata)}::jsonb, ${rel.createdAt}::timestamptz
    )
  `;
}

export async function loadSnapshot(sql: Sql): Promise<FamilySnapshot> {
  const people = (await sql`SELECT * FROM people ORDER BY created_at, id`) as PersonRow[];
  const relationships = (await sql`SELECT * FROM relationships ORDER BY created_at, id`) as RelationshipRow[];
  const metaRows = (await sql`SELECT name, inscriptions, catalog FROM atlas_meta WHERE id = 'default' LIMIT 1`) as {
    name: string;
    inscriptions: AtlasInscription[] | string;
    catalog?: unknown;
  }[];
  const meta = metaRows[0];
  let inscriptions: AtlasInscription[] = [];
  if (meta?.inscriptions) {
    inscriptions = Array.isArray(meta.inscriptions)
      ? meta.inscriptions
      : (JSON.parse(String(meta.inscriptions)) as AtlasInscription[]);
  }
  const catalog =
    meta?.catalog && typeof meta.catalog === "object"
      ? meta.catalog
      : typeof meta?.catalog === "string"
        ? JSON.parse(meta.catalog)
        : {};
  return normalizeSnapshot({
    ...(catalog as Partial<FamilySnapshot>),
    people: people.map(personFromRow),
    relationships: relationships.map(relationshipFromRow),
    name: meta?.name,
    inscriptions,
  });
}

function catalogPayload(snapshot: FamilySnapshot) {
  return {
    version: snapshot.version,
    homePersonId: snapshot.homePersonId,
    events: snapshot.events,
    media: snapshot.media,
    sources: snapshot.sources,
    citations: snapshot.citations,
    stories: snapshot.stories,
    comments: snapshot.comments,
    tasks: snapshot.tasks,
    audit: snapshot.audit,
    recycleBin: snapshot.recycleBin,
    members: snapshot.members,
  };
}

export async function updateAtlas(
  sql: Sql,
  patch: Partial<Pick<FamilySnapshot, "name" | "inscriptions" | "homePersonId">>,
): Promise<FamilySnapshot> {
  const current = await loadSnapshot(sql);
  const next = normalizeSnapshot({
    ...current,
    name: patch.name !== undefined ? patch.name.trim() || DEFAULT_ATLAS_NAME : current.name,
    inscriptions: patch.inscriptions ?? current.inscriptions,
    homePersonId: patch.homePersonId !== undefined ? patch.homePersonId : current.homePersonId,
  });
  await sql`
    INSERT INTO atlas_meta (id, name, inscriptions, catalog)
    VALUES ('default', ${next.name}, ${JSON.stringify(next.inscriptions)}::jsonb, ${JSON.stringify(catalogPayload(next))}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      inscriptions = EXCLUDED.inscriptions,
      catalog = EXCLUDED.catalog
  `;
  return loadSnapshot(sql);
}

export async function replaceSnapshot(sql: Sql, snapshot: FamilySnapshot): Promise<FamilySnapshot> {
  const next = normalizeSnapshot(snapshot);
  await sql`DELETE FROM relationships`;
  await sql`DELETE FROM people`;
  for (const person of next.people) await insertPerson(sql, person);
  for (const rel of next.relationships) await insertRelationship(sql, rel);
  await sql`
    INSERT INTO atlas_meta (id, name, inscriptions, catalog)
    VALUES ('default', ${next.name}, ${JSON.stringify(next.inscriptions)}::jsonb, ${JSON.stringify(catalogPayload(next))}::jsonb)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      inscriptions = EXCLUDED.inscriptions,
      catalog = EXCLUDED.catalog
  `;
  return loadSnapshot(sql);
}

export async function createPerson(sql: Sql, draft: PersonDraft): Promise<Person> {
  const person = personFromDraft(crypto.randomUUID(), draft, new Date().toISOString());
  await insertPerson(sql, person);
  return person;
}

export async function updatePerson(sql: Sql, id: string, patch: Partial<PersonDraft>): Promise<Person> {
  const rows = (await sql`SELECT * FROM people WHERE id = ${id} LIMIT 1`) as PersonRow[];
  const current = rows[0];
  if (!current) throw new Error("Person not found");
  const person = personFromRow(current);
  const next: Person = {
    ...person,
    ...patch,
    tags: patch.tags ?? person.tags,
    updatedAt: new Date().toISOString(),
  };
  await sql`
    UPDATE people SET
      first_name = ${next.firstName},
      middle_name = ${next.middleName},
      last_name = ${next.lastName},
      nickname = ${next.nickname},
      avatar = ${next.avatar},
      gender = ${next.gender},
      birth_date = ${next.birthDate},
      death_date = ${next.deathDate},
      description = ${next.description},
      occupation = ${next.occupation},
      location = ${next.location},
      notes = ${next.notes},
      tags = ${JSON.stringify(next.tags)}::jsonb,
      prefix = ${next.prefix},
      suffix = ${next.suffix},
      birth_last_name = ${next.birthLastName},
      birth_place = ${next.birthPlace},
      death_place = ${next.deathPlace},
      burial_place = ${next.burialPlace},
      cause_of_death = ${next.causeOfDeath},
      updated_at = ${next.updatedAt}::timestamptz
    WHERE id = ${id}
  `;
  return next;
}

export async function deletePerson(sql: Sql, id: string): Promise<{ removedRelationshipIds: string[] }> {
  const related = (await sql`
    SELECT id FROM relationships WHERE source_person_id = ${id} OR target_person_id = ${id}
  `) as { id: string }[];
  await sql`DELETE FROM people WHERE id = ${id}`;
  return { removedRelationshipIds: related.map((row) => row.id) };
}

export async function createRelationship(
  sql: Sql,
  sourcePersonId: string,
  targetPersonId: string,
  type: RelationshipKind,
  metadata: Record<string, string> = {},
): Promise<Relationship> {
  const rel: Relationship = {
    id: crypto.randomUUID(),
    sourcePersonId,
    targetPersonId,
    type,
    metadata,
    createdAt: new Date().toISOString(),
  };
  await insertRelationship(sql, rel);
  return rel;
}

export async function updateRelationship(
  sql: Sql,
  id: string,
  patch: Partial<Pick<Relationship, "type" | "metadata">>,
): Promise<Relationship> {
  const rows = (await sql`SELECT * FROM relationships WHERE id = ${id} LIMIT 1`) as RelationshipRow[];
  const current = rows[0];
  if (!current) throw new Error("Relationship not found");
  const rel = relationshipFromRow(current);
  const next: Relationship = {
    ...rel,
    type: patch.type ?? rel.type,
    metadata: patch.metadata ?? rel.metadata,
  };
  await sql`
    UPDATE relationships SET
      type = ${next.type},
      metadata = ${JSON.stringify(next.metadata)}::jsonb
    WHERE id = ${id}
  `;
  return next;
}

export async function deleteRelationship(sql: Sql, id: string): Promise<void> {
  await sql`DELETE FROM relationships WHERE id = ${id}`;
}

export async function resetToSeed(sql: Sql): Promise<FamilySnapshot> {
  await sql`DELETE FROM relationships`;
  await sql`DELETE FROM people`;
  for (const person of SEED_PEOPLE) await insertPerson(sql, person);
  for (const rel of SEED_RELATIONSHIPS) await insertRelationship(sql, rel);
  await updateAtlas(sql, {
    name: "Solano family",
    inscriptions: [{ id: "title-solano", text: "Solano family", x: 280, y: -56, kind: "title" }],
  });
  return loadSnapshot(sql);
}

export async function clearAll(sql: Sql): Promise<FamilySnapshot> {
  await sql`DELETE FROM relationships`;
  await sql`DELETE FROM people`;
  await updateAtlas(sql, { name: DEFAULT_ATLAS_NAME, inscriptions: emptyInscriptions() });
  return loadSnapshot(sql);
}
