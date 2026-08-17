export type Gender = "female" | "male" | "nonbinary" | "unknown";

export type RelationshipKind =
  | "biological-parent"
  | "adoptive-parent"
  | "step-parent"
  | "spouse"
  | "former-spouse"
  | "partner"
  | "sibling"
  | "half-sibling"
  | "child"
  | "adopted-child";

export type ParentKind = "biological-parent" | "adoptive-parent" | "step-parent";
export type PartnerKind = "spouse" | "former-spouse" | "partner";
export type SiblingKind = "sibling" | "half-sibling";

export type CompassRelation = "parent" | "child" | "spouse" | "sibling";

export interface Person {
  id: string;
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthLastName: string;
  nickname: string;
  avatar: string;
  gender: Gender;
  birthDate: string;
  deathDate: string;
  description: string;
  occupation: string;
  location: string;
  birthPlace: string;
  deathPlace: string;
  burialPlace: string;
  causeOfDeath: string;
  notes: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Relationship {
  id: string;
  sourcePersonId: string;
  targetPersonId: string;
  type: RelationshipKind;
  metadata: Record<string, string>;
  createdAt: string;
}

export interface PersonDraft {
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  birthLastName: string;
  nickname: string;
  avatar: string;
  gender: Gender;
  birthDate: string;
  deathDate: string;
  description: string;
  occupation: string;
  location: string;
  birthPlace: string;
  deathPlace: string;
  burialPlace: string;
  causeOfDeath: string;
  notes: string;
  tags: string[];
}

export const SNAPSHOT_VERSION = 2;

export type EventType =
  | "birth"
  | "baptism"
  | "christening"
  | "marriage"
  | "divorce"
  | "partnership"
  | "death"
  | "burial"
  | "cremation"
  | "residence"
  | "occupation"
  | "education"
  | "immigration"
  | "census"
  | "other";

export interface FamilyEvent {
  id: string;
  type: EventType;
  personId: string;
  spousePersonId?: string;
  relationshipId?: string;
  date: string;
  place: string;
  detail: string;
}

export type MediaKind = "photo" | "document" | "audio";

export interface MediaItem {
  id: string;
  kind: MediaKind;
  personIds: string[];
  caption: string;
  mimeType: string;
  blobKey: string;
  createdAt: string;
}

export interface Source {
  id: string;
  title: string;
  author: string;
  publisher: string;
  url: string;
  notes: string;
}

export interface Citation {
  id: string;
  sourceId: string;
  eventId?: string;
  personId?: string;
  field?: string;
  page: string;
  quote: string;
}

export interface Story {
  id: string;
  personId: string;
  title: string;
  body: string;
  date: string;
}

export interface Comment {
  id: string;
  personId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ResearchTask {
  id: string;
  personId?: string;
  title: string;
  done: boolean;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  action: string;
  detail: string;
  personId?: string;
}

export interface RecycleEntry {
  person: Person;
  relationships: Relationship[];
  deletedAt: string;
}

export type MemberRole = "owner" | "edit" | "view";

export interface TreeMember {
  id: string;
  email: string;
  name: string;
  role: MemberRole;
  invitedAt: string;
}

export interface FamilySnapshot {
  version: number;
  people: Person[];
  relationships: Relationship[];
  name: string;
  inscriptions: AtlasInscription[];
  homePersonId: string | null;
  events: FamilyEvent[];
  media: MediaItem[];
  sources: Source[];
  citations: Citation[];
  stories: Story[];
  comments: Comment[];
  tasks: ResearchTask[];
  audit: AuditEvent[];
  recycleBin: RecycleEntry[];
  members: TreeMember[];
}

export type InscriptionKind = "title" | "section";

export interface AtlasInscription {
  id: string;
  text: string;
  x: number;
  y: number;
  kind: InscriptionKind;
}

export type SharePermission = "view" | "edit";
export type ShareScope = "tree" | "branch";
export type AccessMode = "owner" | "view" | "edit";

export interface ShareRecord {
  token: string;
  permission: SharePermission;
  scope: ShareScope;
  rootPersonId?: string;
  snapshot: FamilySnapshot;
  createdAt: string;
  expiresAt?: string;
  passwordHash?: string;
  revoked?: boolean;
}

export interface TreeFilters {
  generations: number[];
  genders: Gender[];
  living: "all" | "living" | "deceased";
  relationship: RelationshipKind | "all";
  location: string;
  tags: string[];
  fromYear: string;
  toYear: string;
  branchPersonId: string;
}

export const emptyDraft = (): PersonDraft => ({
  prefix: "",
  firstName: "",
  middleName: "",
  lastName: "",
  suffix: "",
  birthLastName: "",
  nickname: "",
  avatar: "",
  gender: "unknown",
  birthDate: "",
  deathDate: "",
  description: "",
  occupation: "",
  location: "",
  birthPlace: "",
  deathPlace: "",
  burialPlace: "",
  causeOfDeath: "",
  notes: "",
  tags: [],
});

export const defaultFilters = (): TreeFilters => ({
  generations: [],
  genders: [],
  living: "all",
  relationship: "all",
  location: "",
  tags: [],
  fromYear: "",
  toYear: "",
  branchPersonId: "",
});

export function fullName(person: Pick<Person, "firstName" | "middleName" | "lastName">): string {
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
}

export function displayName(person: Person): string {
  const core = [person.prefix, person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
  const withSuffix = person.suffix ? `${core} ${person.suffix}` : core;
  return withSuffix.trim() || "Unnamed";
}

export function catalogYear(person: Person): string {
  const birth = person.birthDate.slice(0, 4);
  const death = person.deathDate.slice(0, 4);
  if (birth && death) return `${birth} - ${death}`;
  if (birth) return birth;
  if (death) return death;
  return "";
}

export function isLiving(person: Person): boolean {
  return !person.deathDate;
}

export function birthYear(person: Person): number | null {
  const y = Number(person.birthDate.slice(0, 4));
  return Number.isFinite(y) && y > 0 ? y : null;
}

export const PARENT_TYPES: ParentKind[] = [
  "biological-parent",
  "adoptive-parent",
  "step-parent",
];

export const PARTNER_TYPES: PartnerKind[] = ["spouse", "former-spouse", "partner"];
export const SIBLING_TYPES: SiblingKind[] = ["sibling", "half-sibling"];
export const CHILD_TYPES: RelationshipKind[] = ["child", "adopted-child"];

export function isParentType(type: RelationshipKind): type is ParentKind {
  return PARENT_TYPES.includes(type as ParentKind);
}

export function isPartnerType(type: RelationshipKind): type is PartnerKind {
  return PARTNER_TYPES.includes(type as PartnerKind);
}

export function personFromDraft(id: string, draft: PersonDraft, now: string): Person {
  return {
    id,
    ...emptyDraft(),
    ...draft,
    createdAt: now,
    updatedAt: now,
  };
}
