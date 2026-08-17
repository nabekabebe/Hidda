import type { FamilyApi } from "./familyApi";
import type { FamilySnapshot, Person, PersonDraft, Relationship, RelationshipKind } from "@/domain/types";
import { normalizeSnapshot } from "@/domain/share";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (response.status === 204) return undefined as T;
  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(body.error || `Family API ${response.status}`);
  }
  return body as T;
}

export class HttpFamilyApi implements FamilyApi {
  async load(): Promise<FamilySnapshot> {
    const body = await request<FamilySnapshot & { configured?: boolean }>("/api/family");
    return normalizeSnapshot(body);
  }

  createPerson(draft: PersonDraft): Promise<Person> {
    return request<Person>("/api/family", { method: "POST", body: JSON.stringify({ op: "createPerson", draft }) });
  }

  updatePerson(id: string, patch: Partial<PersonDraft>): Promise<Person> {
    return request<Person>("/api/family", { method: "POST", body: JSON.stringify({ op: "updatePerson", id, patch }) });
  }

  deletePerson(id: string): Promise<{ removedRelationshipIds: string[] }> {
    return request("/api/family", { method: "POST", body: JSON.stringify({ op: "deletePerson", id }) });
  }

  createRelationship(
    sourcePersonId: string,
    targetPersonId: string,
    type: RelationshipKind,
    metadata: Record<string, string> = {},
  ): Promise<Relationship> {
    return request("/api/family", {
      method: "POST",
      body: JSON.stringify({ op: "createRelationship", sourcePersonId, targetPersonId, type, metadata }),
    });
  }

  updateRelationship(
    id: string,
    patch: Partial<Pick<Relationship, "type" | "metadata">>,
  ): Promise<Relationship> {
    return request("/api/family", { method: "POST", body: JSON.stringify({ op: "updateRelationship", id, patch }) });
  }

  deleteRelationship(id: string): Promise<void> {
    return request("/api/family", { method: "POST", body: JSON.stringify({ op: "deleteRelationship", id }) });
  }

  resetToSeed(): Promise<FamilySnapshot> {
    return request("/api/family", { method: "POST", body: JSON.stringify({ op: "resetToSeed" }) });
  }

  clearAll(): Promise<FamilySnapshot> {
    return request("/api/family", { method: "POST", body: JSON.stringify({ op: "clearAll" }) });
  }

  updateAtlas(patch: Partial<Pick<FamilySnapshot, "name" | "inscriptions" | "homePersonId">>): Promise<FamilySnapshot> {
    return request("/api/family", { method: "POST", body: JSON.stringify({ op: "updateAtlas", patch }) });
  }

  replaceSnapshot(snapshot: FamilySnapshot): Promise<FamilySnapshot> {
    return request("/api/family", { method: "POST", body: JSON.stringify({ op: "replaceSnapshot", snapshot }) });
  }
}
