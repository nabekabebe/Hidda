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
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  avatar: string;
  gender: Gender;
  birthDate: string;
  deathDate: string;
  description: string;
  occupation: string;
  location: string;
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
  firstName: string;
  middleName: string;
  lastName: string;
  nickname: string;
  avatar: string;
  gender: Gender;
  birthDate: string;
  deathDate: string;
  description: string;
  occupation: string;
  location: string;
  notes: string;
  tags: string[];
}

export interface FamilySnapshot {
  people: Person[];
  relationships: Relationship[];
  name: string;
  inscriptions: AtlasInscription[];
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
  firstName: "",
  middleName: "",
  lastName: "",
  nickname: "",
  avatar: "",
  gender: "unknown",
  birthDate: "",
  deathDate: "",
  description: "",
  occupation: "",
  location: "",
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
  return fullName(person) || "Unnamed";
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
    ...draft,
    createdAt: now,
    updatedAt: now,
  };
}
