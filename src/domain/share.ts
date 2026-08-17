import { buildGraph, descendantBranchOf } from "./graph";
import type { AtlasInscription, FamilySnapshot, ShareRecord } from "./types";

export const DEFAULT_ATLAS_NAME = "Untitled atlas";

export function emptyInscriptions(): AtlasInscription[] {
  return [];
}

export function normalizeSnapshot(raw: Partial<FamilySnapshot> | null | undefined): FamilySnapshot {
  return {
    people: raw?.people ?? [],
    relationships: raw?.relationships ?? [],
    name: raw?.name?.trim() || DEFAULT_ATLAS_NAME,
    inscriptions: Array.isArray(raw?.inscriptions) ? raw.inscriptions : [],
  };
}

export function sliceSnapshot(snapshot: FamilySnapshot, rootPersonId?: string): FamilySnapshot {
  const base = normalizeSnapshot(snapshot);
  if (!rootPersonId) return structuredClone(base);
  const graph = buildGraph(base.people, base.relationships);
  const ids = descendantBranchOf(graph, rootPersonId);
  return {
    ...base,
    people: base.people.filter((person) => ids.has(person.id)),
    relationships: base.relationships.filter(
      (rel) => ids.has(rel.sourcePersonId) && ids.has(rel.targetPersonId),
    ),
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
