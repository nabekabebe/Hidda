import { HttpFamilyApi } from "@/api/httpFamilyApi";
import { SEED_EVENTS, SEED_PEOPLE, SEED_RELATIONSHIPS } from "@/domain/seed";
import { DEFAULT_ATLAS_NAME, emptyCatalog, emptyInscriptions, normalizeSnapshot } from "@/domain/share";
import {
  personFromDraft,
  type AtlasInscription,
  type FamilySnapshot,
  type Person,
  type PersonDraft,
  type Relationship,
  type RelationshipKind,
} from "@/domain/types";

const STORAGE_KEY = "night-atlas.family.v1";

export interface FamilyApi {
  load(): Promise<FamilySnapshot>;
  createPerson(draft: PersonDraft): Promise<Person>;
  updatePerson(id: string, patch: Partial<PersonDraft>): Promise<Person>;
  deletePerson(id: string): Promise<{ removedRelationshipIds: string[] }>;
  createRelationship(
    sourcePersonId: string,
    targetPersonId: string,
    type: RelationshipKind,
    metadata?: Record<string, string>,
  ): Promise<Relationship>;
  updateRelationship(
    id: string,
    patch: Partial<Pick<Relationship, "type" | "metadata">>,
  ): Promise<Relationship>;
  deleteRelationship(id: string): Promise<void>;
  resetToSeed(): Promise<FamilySnapshot>;
  clearAll(): Promise<FamilySnapshot>;
  updateAtlas(patch: Partial<Pick<FamilySnapshot, "name" | "inscriptions" | "homePersonId">>): Promise<FamilySnapshot>;
  replaceSnapshot(snapshot: FamilySnapshot): Promise<FamilySnapshot>;
  patchCatalog(patch: Partial<FamilySnapshot>): Promise<FamilySnapshot>;
}

function uid(): string {
  return crypto.randomUUID();
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryFamilyApi implements FamilyApi {
  private people = new Map<string, Person>();
  private relationships = new Map<string, Relationship>();
  private name = DEFAULT_ATLAS_NAME;
  private inscriptions: AtlasInscription[] = [];
  private catalog = emptyCatalog();
  private readonly persistFn: (snapshot: FamilySnapshot) => void;
  private readonly readOnly: boolean;

  constructor(options?: {
    snapshot?: FamilySnapshot;
    persist?: (snapshot: FamilySnapshot) => void;
    readOnly?: boolean;
    skipHydrate?: boolean;
  }) {
    this.readOnly = Boolean(options?.readOnly);
    this.persistFn =
      options?.persist ??
      ((snapshot) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      });
    if (options?.snapshot) {
      this.applySnapshot(options.snapshot, false);
      return;
    }
    if (!options?.skipHydrate) this.hydrate();
  }

  private hydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.applySnapshot(normalizeSnapshot(JSON.parse(raw) as FamilySnapshot), false);
        return;
      }
    } catch {
      /* empty atlas */
    }
    this.applySeed();
  }

  private applySnapshot(snapshot: FamilySnapshot, persist: boolean) {
    const next = normalizeSnapshot(snapshot);
    this.people = new Map(next.people.map((person) => [person.id, clone(person)]));
    this.relationships = new Map(next.relationships.map((rel) => [rel.id, clone(rel)]));
    this.name = next.name;
    this.inscriptions = clone(next.inscriptions);
    this.catalog = {
      version: next.version,
      homePersonId: next.homePersonId,
      events: clone(next.events),
      media: clone(next.media),
      sources: clone(next.sources),
      citations: clone(next.citations),
      stories: clone(next.stories),
      comments: clone(next.comments),
      tasks: clone(next.tasks),
      audit: clone(next.audit),
      recycleBin: clone(next.recycleBin),
      members: clone(next.members),
    };
    if (persist) this.persist();
  }

  private applySeed() {
    this.applySnapshot(
      normalizeSnapshot({
        people: SEED_PEOPLE,
        relationships: SEED_RELATIONSHIPS,
        name: "Solano family",
        inscriptions: [{ id: "title-solano", text: "Solano family", x: 280, y: -56, kind: "title" }],
        homePersonId: "mira",
        events: SEED_EVENTS,
      }),
      true,
    );
  }

  private persist() {
    if (this.readOnly) return;
    this.persistFn(this.snapshot());
  }

  private snapshot(): FamilySnapshot {
    return normalizeSnapshot({
      ...this.catalog,
      people: [...this.people.values()],
      relationships: [...this.relationships.values()],
      name: this.name,
      inscriptions: clone(this.inscriptions),
    });
  }

  private guardWrite() {
    if (this.readOnly) throw new Error("This link is view only");
  }

  async load(): Promise<FamilySnapshot> {
    return this.snapshot();
  }

  async createPerson(draft: PersonDraft): Promise<Person> {
    this.guardWrite();
    const person = personFromDraft(uid(), draft, new Date().toISOString());
    this.people.set(person.id, person);
    this.persist();
    return person;
  }

  async updatePerson(id: string, patch: Partial<PersonDraft>): Promise<Person> {
    this.guardWrite();
    const current = this.people.get(id);
    if (!current) throw new Error("Person not found");
    const next: Person = {
      ...current,
      ...patch,
      tags: patch.tags ?? current.tags,
      updatedAt: new Date().toISOString(),
    };
    this.people.set(id, next);
    this.persist();
    return next;
  }

  async deletePerson(id: string): Promise<{ removedRelationshipIds: string[] }> {
    this.guardWrite();
    this.people.delete(id);
    const removed: string[] = [];
    for (const rel of [...this.relationships.values()]) {
      if (rel.sourcePersonId === id || rel.targetPersonId === id) {
        this.relationships.delete(rel.id);
        removed.push(rel.id);
      }
    }
    this.persist();
    return { removedRelationshipIds: removed };
  }

  async createRelationship(
    sourcePersonId: string,
    targetPersonId: string,
    type: RelationshipKind,
    metadata: Record<string, string> = {},
  ): Promise<Relationship> {
    this.guardWrite();
    const rel: Relationship = {
      id: uid(),
      sourcePersonId,
      targetPersonId,
      type,
      metadata,
      createdAt: new Date().toISOString(),
    };
    this.relationships.set(rel.id, rel);
    this.persist();
    return rel;
  }

  async updateRelationship(
    id: string,
    patch: Partial<Pick<Relationship, "type" | "metadata">>,
  ): Promise<Relationship> {
    this.guardWrite();
    const current = this.relationships.get(id);
    if (!current) throw new Error("Relationship not found");
    const next: Relationship = {
      ...current,
      type: patch.type ?? current.type,
      metadata: patch.metadata ?? current.metadata,
    };
    this.relationships.set(id, next);
    this.persist();
    return next;
  }

  async deleteRelationship(id: string): Promise<void> {
    this.guardWrite();
    this.relationships.delete(id);
    this.persist();
  }

  async resetToSeed(): Promise<FamilySnapshot> {
    this.guardWrite();
    this.applySeed();
    return this.snapshot();
  }

  async clearAll(): Promise<FamilySnapshot> {
    this.guardWrite();
    this.people.clear();
    this.relationships.clear();
    this.name = DEFAULT_ATLAS_NAME;
    this.inscriptions = emptyInscriptions();
    this.catalog = emptyCatalog();
    this.persist();
    return this.snapshot();
  }

  async updateAtlas(
    patch: Partial<Pick<FamilySnapshot, "name" | "inscriptions" | "homePersonId">>,
  ): Promise<FamilySnapshot> {
    this.guardWrite();
    if (patch.name !== undefined) this.name = patch.name.trim() || DEFAULT_ATLAS_NAME;
    if (patch.inscriptions) this.inscriptions = clone(patch.inscriptions);
    if (patch.homePersonId !== undefined) this.catalog.homePersonId = patch.homePersonId;
    this.persist();
    return this.snapshot();
  }

  async replaceSnapshot(snapshot: FamilySnapshot): Promise<FamilySnapshot> {
    this.guardWrite();
    this.applySnapshot(snapshot, true);
    return this.snapshot();
  }

  async patchCatalog(patch: Partial<FamilySnapshot>): Promise<FamilySnapshot> {
    this.guardWrite();
    this.applySnapshot({ ...this.snapshot(), ...patch }, true);
    return this.snapshot();
  }
}

let workingApi: FamilyApi =
  import.meta.env.VITE_FAMILY_API === "http" ? new HttpFamilyApi() : new MemoryFamilyApi();

export const familyApi: FamilyApi = workingApi;

export function getWorkingApi(): FamilyApi {
  return workingApi;
}

export function setWorkingApi(api: FamilyApi): void {
  workingApi = api;
}

export function resetWorkingApi(): void {
  workingApi = familyApi;
}
