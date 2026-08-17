import { buildGraph, descendantBranchOf } from "./graph";
import {
  SNAPSHOT_VERSION,
  type AtlasInscription,
  type AuditEvent,
  type Citation,
  type Comment,
  type FamilyEvent,
  type FamilySnapshot,
  type MediaItem,
  type Person,
  type RecycleEntry,
  type Relationship,
  type ResearchTask,
  type ShareRecord,
  type Source,
  type Story,
  type TreeMember,
} from "./types";

export const DEFAULT_ATLAS_NAME = "Untitled atlas";

export function emptyInscriptions(): AtlasInscription[] {
  return [];
}

export function emptyCatalog(): Omit<FamilySnapshot, "people" | "relationships" | "name" | "inscriptions"> {
  return {
    version: SNAPSHOT_VERSION,
    homePersonId: null,
    events: [],
    media: [],
    sources: [],
    citations: [],
    stories: [],
    comments: [],
    tasks: [],
    audit: [],
    recycleBin: [],
    members: [],
  };
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

export function normalizePerson(raw: Partial<Person> | null | undefined, fallbackId = ""): Person {
  return {
    id: asString(raw?.id) || fallbackId,
    prefix: asString(raw?.prefix),
    firstName: asString(raw?.firstName),
    middleName: asString(raw?.middleName),
    lastName: asString(raw?.lastName),
    suffix: asString(raw?.suffix),
    birthLastName: asString(raw?.birthLastName),
    nickname: asString(raw?.nickname),
    avatar: asString(raw?.avatar),
    gender: raw?.gender === "female" || raw?.gender === "male" || raw?.gender === "nonbinary" ? raw.gender : "unknown",
    birthDate: asString(raw?.birthDate),
    deathDate: asString(raw?.deathDate),
    description: asString(raw?.description),
    occupation: asString(raw?.occupation),
    location: asString(raw?.location),
    birthPlace: asString(raw?.birthPlace) || asString(raw?.location),
    deathPlace: asString(raw?.deathPlace),
    burialPlace: asString(raw?.burialPlace),
    causeOfDeath: asString(raw?.causeOfDeath),
    notes: asString(raw?.notes),
    tags: asStringArray(raw?.tags),
    createdAt: asString(raw?.createdAt) || new Date().toISOString(),
    updatedAt: asString(raw?.updatedAt) || asString(raw?.createdAt) || new Date().toISOString(),
  };
}

function normalizeRelationship(raw: Partial<Relationship>): Relationship | null {
  if (!raw?.id || !raw.sourcePersonId || !raw.targetPersonId || !raw.type) return null;
  const metadata =
    raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
      ? Object.fromEntries(Object.entries(raw.metadata).map(([key, value]) => [key, String(value ?? "")]))
      : {};
  return {
    id: String(raw.id),
    sourcePersonId: String(raw.sourcePersonId),
    targetPersonId: String(raw.targetPersonId),
    type: raw.type,
    metadata,
    createdAt: asString(raw.createdAt) || new Date().toISOString(),
  };
}

export function normalizeSnapshot(raw: Partial<FamilySnapshot> | null | undefined): FamilySnapshot {
  const people = Array.isArray(raw?.people) ? raw.people.map((person) => normalizePerson(person)) : [];
  const relationships = Array.isArray(raw?.relationships)
    ? raw.relationships.map(normalizeRelationship).filter((rel): rel is Relationship => Boolean(rel))
    : [];
  const homePersonId =
    typeof raw?.homePersonId === "string" && people.some((person) => person.id === raw.homePersonId)
      ? raw.homePersonId
      : people[0]?.id ?? null;
  return {
    version: SNAPSHOT_VERSION,
    people,
    relationships,
    name: raw?.name?.trim() || DEFAULT_ATLAS_NAME,
    inscriptions: Array.isArray(raw?.inscriptions) ? raw.inscriptions : [],
    homePersonId,
    events: Array.isArray(raw?.events) ? (raw.events as FamilyEvent[]) : [],
    media: Array.isArray(raw?.media) ? (raw.media as MediaItem[]) : [],
    sources: Array.isArray(raw?.sources) ? (raw.sources as Source[]) : [],
    citations: Array.isArray(raw?.citations) ? (raw.citations as Citation[]) : [],
    stories: Array.isArray(raw?.stories) ? (raw.stories as Story[]) : [],
    comments: Array.isArray(raw?.comments) ? (raw.comments as Comment[]) : [],
    tasks: Array.isArray(raw?.tasks) ? (raw.tasks as ResearchTask[]) : [],
    audit: Array.isArray(raw?.audit) ? (raw.audit as AuditEvent[]) : [],
    recycleBin: Array.isArray(raw?.recycleBin) ? (raw.recycleBin as RecycleEntry[]) : [],
    members: Array.isArray(raw?.members) ? (raw.members as TreeMember[]) : [],
  };
}

function inSet(id: string | undefined, ids: Set<string>): boolean {
  return Boolean(id && ids.has(id));
}

export function sliceSnapshot(snapshot: Partial<FamilySnapshot>, rootPersonId?: string): FamilySnapshot {
  const base = normalizeSnapshot(snapshot);
  if (!rootPersonId) return structuredClone(base);
  const graph = buildGraph(base.people, base.relationships);
  const ids = descendantBranchOf(graph, rootPersonId);
  const people = base.people.filter((person) => ids.has(person.id));
  const relationships = base.relationships.filter(
    (rel) => ids.has(rel.sourcePersonId) && ids.has(rel.targetPersonId),
  );
  return {
    ...base,
    people,
    relationships,
    homePersonId: ids.has(base.homePersonId ?? "") ? base.homePersonId : (people[0]?.id ?? null),
    events: base.events.filter((event) => inSet(event.personId, ids) || inSet(event.spousePersonId, ids)),
    media: base.media.filter((item) => item.personIds.some((id) => ids.has(id))),
    citations: base.citations.filter((item) => !item.personId || ids.has(item.personId)),
    stories: base.stories.filter((item) => ids.has(item.personId)),
    comments: base.comments.filter((item) => ids.has(item.personId)),
    tasks: base.tasks.filter((item) => !item.personId || ids.has(item.personId)),
    recycleBin: [],
    members: [],
    audit: [],
  };
}

export function sharePath(token: string): string {
  return `/s/${token}`;
}

export function isShareRecord(value: unknown): value is ShareRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as ShareRecord;
  return Boolean(record.token && record.snapshot && (record.permission === "view" || record.permission === "edit"));
}
