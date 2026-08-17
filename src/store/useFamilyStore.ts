import { getWorkingApi, MemoryFamilyApi, openOwnerApi, setWorkingApi } from "@/api/familyApi";
import { loadShareRecord, saveShareSnapshot } from "@/api/shareClient";
import {
  alreadyRelated,
  buildGraph,
  childrenOf,
  directedRelationship,
  generationCount,
  type FamilyGraph,
  wouldCycle,
} from "@/domain/graph";
import { layoutTree, type TreeLayout } from "@/domain/layout";
import { personMatchesFilters } from "@/domain/search";
import { DEFAULT_ATLAS_NAME, normalizeSnapshot } from "@/domain/share";
import { SEED_FOCUS_ID } from "@/domain/seed";
import {
  SNAPSHOT_VERSION,
  defaultFilters,
  type AccessMode,
  type AtlasInscription,
  type CompassRelation,
  type FamilySnapshot,
  type Person,
  type PersonDraft,
  type Relationship,
  type TreeFilters,
} from "@/domain/types";
import { useAccountStore } from "@/store/useAccountStore";
import { create } from "zustand";

export type ThemeMode = "dark" | "light";
export type Panel =
  | { type: "none" }
  | { type: "profile"; personId: string }
  | { type: "form"; personId?: string; relation?: CompassRelation; fromId?: string }
  | { type: "search" }
  | { type: "filters" }
  | { type: "shortcuts" }
  | { type: "share" }
  | { type: "views" }
  | { type: "confirm-delete"; personId: string };

interface FamilyState {
  people: Person[];
  relationships: Relationship[];
  atlasName: string;
  inscriptions: AtlasInscription[];
  homePersonId: string | null;
  events: FamilySnapshot["events"];
  media: FamilySnapshot["media"];
  sources: FamilySnapshot["sources"];
  citations: FamilySnapshot["citations"];
  stories: FamilySnapshot["stories"];
  comments: FamilySnapshot["comments"];
  tasks: FamilySnapshot["tasks"];
  audit: FamilySnapshot["audit"];
  recycleBin: FamilySnapshot["recycleBin"];
  members: FamilySnapshot["members"];
  access: AccessMode;
  shareToken: string | null;
  shareMissing: boolean;
  placingLabel: boolean;
  selectedInscriptionId: string | null;
  ready: boolean;
  selectedId: string | null;
  highlightId: string | null;
  collapsedIds: string[];
  focusMode: boolean;
  filters: TreeFilters;
  theme: ThemeMode;
  panel: Panel;
  viewedIds: string[];
  onboardingStep: number;
  viewport: { x: number; y: number; k: number };
  requestFit: number;
  requestCenterId: string | null;
  hydrate: () => Promise<void>;
  hydrateShare: (token: string) => Promise<boolean>;
  snapshot: () => FamilySnapshot;
  canEdit: () => boolean;
  graph: () => FamilyGraph;
  layout: () => TreeLayout;
  visibleIds: () => Set<string>;
  select: (id: string | null) => void;
  openProfile: (id: string) => void;
  openForm: (opts?: { personId?: string; relation?: CompassRelation; fromId?: string }) => void;
  closePanel: () => void;
  setPanel: (panel: Panel) => void;
  addRelated: (fromId: string, relation: CompassRelation, draft: PersonDraft) => Promise<Person>;
  linkRelated: (fromId: string, relation: CompassRelation, toId: string) => Promise<void>;
  savePerson: (id: string | undefined, draft: PersonDraft) => Promise<Person>;
  removePerson: (id: string) => Promise<void>;
  removeRelationship: (id: string) => Promise<void>;
  updateRelationship: (
    id: string,
    patch: Partial<Pick<Relationship, "type" | "metadata">>,
  ) => Promise<void>;
  toggleCollapsed: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setFilters: (filters: TreeFilters) => void;
  setTheme: (theme: ThemeMode) => void;
  setFocusMode: (value: boolean) => void;
  setViewport: (viewport: { x: number; y: number; k: number }) => void;
  fitTree: () => void;
  centerOn: (id: string) => void;
  pulse: (id: string) => void;
  resetDemo: () => Promise<void>;
  startEmpty: () => Promise<void>;
  setAtlasName: (name: string) => Promise<void>;
  setHomePerson: (id: string | null) => Promise<void>;
  setPlacingLabel: (value: boolean) => void;
  selectInscription: (id: string | null) => void;
  addInscription: (input: { x: number; y: number; kind: AtlasInscription["kind"]; text?: string }) => Promise<string>;
  updateInscription: (id: string, patch: Partial<Pick<AtlasInscription, "text" | "x" | "y" | "kind">>) => Promise<void>;
  removeInscription: (id: string) => Promise<void>;
  saveEvents: (events: FamilySnapshot["events"]) => Promise<void>;
  saveMedia: (media: FamilySnapshot["media"]) => Promise<void>;
  importSnapshot: (snapshot: FamilySnapshot) => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  people: [],
  relationships: [],
  atlasName: DEFAULT_ATLAS_NAME,
  inscriptions: [],
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
  access: "owner",
  shareToken: null,
  shareMissing: false,
  placingLabel: false,
  selectedInscriptionId: null,
  ready: false,
  selectedId: null,
  highlightId: null,
  collapsedIds: [],
  focusMode: false,
  filters: defaultFilters(),
  theme: (localStorage.getItem("night-atlas.theme") as ThemeMode) || "dark",
  panel: { type: "none" },
  viewedIds: JSON.parse(localStorage.getItem("night-atlas.viewed") || "[]") as string[],
  onboardingStep: 0,
  viewport: { x: 0, y: 0, k: 0.82 },
  requestFit: 0,
  requestCenterId: null,

  hydrate: async () => {
    const treeId = useAccountStore.getState().currentTreeId;
    setWorkingApi(openOwnerApi(treeId));
    const snap = await getWorkingApi().load();
    const selected = snap.people.some((person) => person.id === SEED_FOCUS_ID)
      ? SEED_FOCUS_ID
      : snap.people[0]?.id ?? null;
    set({
      ...atlasFields(snap),
      ready: true,
      selectedId: selected,
      access: "owner",
      shareToken: null,
      shareMissing: false,
      placingLabel: false,
    });
  },

  hydrateShare: async (token) => {
    const record = await loadShareRecord(token);
    if (!record) {
      set({
        ...atlasFields(normalizeSnapshot({})),
        ready: true,
        shareMissing: true,
        access: "view",
        shareToken: token,
      });
      return false;
    }
    const api = new MemoryFamilyApi({
      snapshot: record.snapshot,
      readOnly: record.permission === "view",
      persist: (snapshot) => {
        void saveShareSnapshot(token, snapshot);
      },
    });
    setWorkingApi(api);
    const snap = await api.load();
    set({
      ...atlasFields(snap),
      ready: true,
      selectedId: snap.people[0]?.id ?? null,
      access: record.permission,
      shareToken: token,
      shareMissing: false,
      placingLabel: false,
      panel: { type: "none" },
    });
    return true;
  },

  snapshot: () => ({
    ...getCatalog(get()),
    people: get().people,
    relationships: get().relationships,
    name: get().atlasName,
    inscriptions: get().inscriptions,
  }),

  canEdit: () => get().access !== "view",

  graph: () => buildGraph(get().people, get().relationships),

  layout: () => layoutTree(get().graph(), new Set(get().collapsedIds)),

  visibleIds: () => {
    const graph = get().graph();
    const filters = get().filters;
    const ids = new Set<string>();
    for (const person of get().people) {
      if (personMatchesFilters(person, graph, filters)) ids.add(person.id);
    }
    return ids;
  },

  select: (id) => {
    set({ selectedId: id, highlightId: id });
    if (id) {
      const viewed = [id, ...get().viewedIds.filter((item) => item !== id)].slice(0, 8);
      localStorage.setItem("night-atlas.viewed", JSON.stringify(viewed));
      set({ viewedIds: viewed });
    }
  },

  openProfile: (id) => {
    get().select(id);
    set({ panel: { type: "profile", personId: id } });
  },

  openForm: (opts) => {
    if (!get().canEdit()) return;
    set({
      panel: {
        type: "form",
        personId: opts?.personId,
        relation: opts?.relation,
        fromId: opts?.fromId,
      },
    });
  },

  closePanel: () => set({ panel: { type: "none" } }),
  setPanel: (panel) => set({ panel }),

  addRelated: async (fromId, relation, draft) => {
    const person = await getWorkingApi().createPerson(draft);
    const edge = directedRelationship(fromId, person.id, relation);
    await getWorkingApi().createRelationship(edge.sourcePersonId, edge.targetPersonId, edge.type);
    const snap = await getWorkingApi().load();
    set({
      ...atlasFields(snap),
      selectedId: person.id,
      highlightId: person.id,
      panel: { type: "profile", personId: person.id },
      requestCenterId: person.id,
      onboardingStep: Math.min(get().onboardingStep + 1, 6),
    });
    return person;
  },

  linkRelated: async (fromId, relation, toId) => {
    const graph = get().graph();
    if (alreadyRelated(graph, fromId, toId, relation)) {
      throw new Error("Already connected");
    }
    if (wouldCycle(graph, fromId, toId, relation)) {
      throw new Error("That link would loop the family");
    }
    const edge = directedRelationship(fromId, toId, relation);
    await getWorkingApi().createRelationship(edge.sourcePersonId, edge.targetPersonId, edge.type);
    const snap = await getWorkingApi().load();
    set({
      ...atlasFields(snap),
      selectedId: fromId,
      highlightId: toId,
      panel: { type: "profile", personId: fromId },
      requestCenterId: fromId,
    });
  },

  savePerson: async (id, draft) => {
    const person = id
      ? await getWorkingApi().updatePerson(id, draft)
      : await getWorkingApi().createPerson(draft);
    const snap = await getWorkingApi().load();
    set({
      ...atlasFields(snap),
      selectedId: person.id,
      highlightId: person.id,
      panel: { type: "profile", personId: person.id },
      requestCenterId: person.id,
    });
    return person;
  },

  removePerson: async (id) => {
    await getWorkingApi().deletePerson(id);
    const snap = await getWorkingApi().load();
    const next = snap.people[0]?.id ?? null;
    set({
      ...atlasFields(snap),
      selectedId: next,
      panel: next ? { type: "profile", personId: next } : { type: "none" },
    });
  },

  removeRelationship: async (id) => {
    await getWorkingApi().deleteRelationship(id);
    const snap = await getWorkingApi().load();
    set(atlasFields(snap));
  },

  updateRelationship: async (id, patch) => {
    await getWorkingApi().updateRelationship(id, patch);
    const snap = await getWorkingApi().load();
    set(atlasFields(snap));
  },

  toggleCollapsed: (id) => {
    const current = new Set(get().collapsedIds);
    if (current.has(id)) current.delete(id);
    else current.add(id);
    set({ collapsedIds: [...current] });
  },

  expandAll: () => set({ collapsedIds: [] }),
  collapseAll: () => {
    const graph = get().graph();
    const ids = get().people.filter((person) => childrenOf(graph, person.id).length > 0).map((person) => person.id);
    set({ collapsedIds: ids });
  },

  setFilters: (filters) => set({ filters }),
  setTheme: (theme) => {
    localStorage.setItem("night-atlas.theme", theme);
    set({ theme });
  },
  setFocusMode: (value) => set({ focusMode: value }),
  setViewport: (viewport) => set({ viewport }),
  fitTree: () => set({ requestFit: get().requestFit + 1 }),
  centerOn: (id) => set({ requestCenterId: id, selectedId: id, highlightId: id }),
  pulse: (id) => {
    set({ highlightId: id, selectedId: id, requestCenterId: id });
    window.setTimeout(() => {
      if (get().highlightId === id) set({ highlightId: id });
    }, 900);
  },
  resetDemo: async () => {
    const snap = await getWorkingApi().resetToSeed();
    set({
      ...atlasFields(snap),
      selectedId: SEED_FOCUS_ID,
      panel: { type: "profile", personId: SEED_FOCUS_ID },
      collapsedIds: [],
      filters: defaultFilters(),
      requestFit: get().requestFit + 1,
    });
  },
  startEmpty: async () => {
    const snap = await getWorkingApi().clearAll();
    set({
      ...atlasFields(snap),
      selectedId: null,
      panel: { type: "form" },
      onboardingStep: 1,
    });
  },

  setAtlasName: async (name) => {
    const snap = await getWorkingApi().updateAtlas({ name });
    const title = snap.inscriptions.find((item) => item.kind === "title");
    const inscriptions = title
      ? snap.inscriptions.map((item) => (item.id === title.id ? { ...item, text: snap.name } : item))
      : [{ id: crypto.randomUUID(), text: snap.name, x: 240, y: -56, kind: "title" as const }, ...snap.inscriptions];
    const next = inscriptions === snap.inscriptions ? snap : await getWorkingApi().updateAtlas({ inscriptions });
    set(atlasFields(next));
  },

  setHomePerson: async (id) => {
    const snap = await getWorkingApi().updateAtlas({ homePersonId: id });
    set(atlasFields(snap));
  },

  setPlacingLabel: (value) => set({ placingLabel: value, selectedInscriptionId: value ? null : get().selectedInscriptionId }),

  selectInscription: (id) => set({ selectedInscriptionId: id, selectedId: id ? null : get().selectedId }),

  addInscription: async ({ x, y, kind, text }) => {
    const id = crypto.randomUUID();
    const item: AtlasInscription = {
      id,
      x,
      y,
      kind,
      text: text ?? (kind === "title" ? get().atlasName : "Section"),
    };
    const inscriptions = [...get().inscriptions, item];
    const snap = await getWorkingApi().updateAtlas({
      name: kind === "title" ? item.text : get().atlasName,
      inscriptions,
    });
    set({ ...atlasFields(snap), selectedInscriptionId: id, placingLabel: false });
    return id;
  },

  updateInscription: async (id, patch) => {
    const inscriptions = get().inscriptions.map((item) => (item.id === id ? { ...item, ...patch } : item));
    const current = inscriptions.find((item) => item.id === id);
    const snap = await getWorkingApi().updateAtlas({
      inscriptions,
      name: current?.kind === "title" && patch.text !== undefined ? patch.text : undefined,
    });
    set(atlasFields(snap));
  },

  removeInscription: async (id) => {
    const inscriptions = get().inscriptions.filter((item) => item.id !== id);
    const snap = await getWorkingApi().updateAtlas({ inscriptions });
    set({ ...atlasFields(snap), selectedInscriptionId: get().selectedInscriptionId === id ? null : get().selectedInscriptionId });
  },

  saveEvents: async (events) => {
    const snap = await getWorkingApi().patchCatalog({ events });
    set(atlasFields(snap));
  },

  saveMedia: async (media) => {
    const snap = await getWorkingApi().patchCatalog({ media });
    set(atlasFields(snap));
  },

  importSnapshot: async (snapshot) => {
    const snap = await getWorkingApi().replaceSnapshot(normalizeSnapshot(snapshot));
    set({
      ...atlasFields(snap),
      selectedId: snap.homePersonId ?? snap.people[0]?.id ?? null,
      collapsedIds: [],
      requestFit: get().requestFit + 1,
      panel: { type: "none" },
    });
  },
}));

function atlasFields(snap: FamilySnapshot) {
  return {
    people: snap.people,
    relationships: snap.relationships,
    atlasName: snap.name,
    inscriptions: snap.inscriptions,
    homePersonId: snap.homePersonId,
    events: snap.events,
    media: snap.media,
    sources: snap.sources,
    citations: snap.citations,
    stories: snap.stories,
    comments: snap.comments,
    tasks: snap.tasks,
    audit: snap.audit,
    recycleBin: snap.recycleBin,
    members: snap.members,
  };
}

function getCatalog(state: Pick<FamilyState, "homePersonId" | "events" | "media" | "sources" | "citations" | "stories" | "comments" | "tasks" | "audit" | "recycleBin" | "members">) {
  return {
    version: SNAPSHOT_VERSION,
    homePersonId: state.homePersonId,
    events: state.events,
    media: state.media,
    sources: state.sources,
    citations: state.citations,
    stories: state.stories,
    comments: state.comments,
    tasks: state.tasks,
    audit: state.audit,
    recycleBin: state.recycleBin,
    members: state.members,
  };
}

export function draftFromPerson(person: Person): PersonDraft {
  return {
    prefix: person.prefix,
    firstName: person.firstName,
    middleName: person.middleName,
    lastName: person.lastName,
    suffix: person.suffix,
    birthLastName: person.birthLastName,
    nickname: person.nickname,
    avatar: person.avatar,
    gender: person.gender,
    birthDate: person.birthDate,
    deathDate: person.deathDate,
    description: person.description,
    occupation: person.occupation,
    location: person.location,
    birthPlace: person.birthPlace,
    deathPlace: person.deathPlace,
    burialPlace: person.burialPlace,
    causeOfDeath: person.causeOfDeath,
    notes: person.notes,
    tags: person.tags,
  };
}

export function familyStats(people: Person[], relationships: Relationship[]) {
  const graph = buildGraph(people, relationships);
  return {
    members: people.length,
    generations: generationCount(graph),
    branches: new Set(people.map((person) => person.lastName || person.id)).size,
  };
}
