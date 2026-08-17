import type { PartnerKind, Relationship } from "./types";

export function partnershipFacts(rel: Relationship) {
  return {
    marriedOn: rel.metadata.marriedOn ?? "",
    marriedPlace: rel.metadata.marriedPlace ?? "",
    endedOn: rel.metadata.endedOn ?? "",
    endedPlace: rel.metadata.endedPlace ?? "",
  };
}

export function partnershipSummary(rel: Relationship): string {
  const facts = partnershipFacts(rel);
  if (facts.marriedOn && facts.endedOn) {
    return `${facts.marriedOn} – ${facts.endedOn}${facts.marriedPlace ? ` · ${facts.marriedPlace}` : ""}`;
  }
  if (facts.marriedOn) {
    return `Married ${facts.marriedOn}${facts.marriedPlace ? ` in ${facts.marriedPlace}` : ""}`;
  }
  if (facts.endedOn) {
    return `Ended ${facts.endedOn}`;
  }
  return "";
}

export function partnerTypeFromDates(type: PartnerKind, endedOn: string): PartnerKind {
  if (type === "partner") return type;
  return endedOn ? "former-spouse" : "spouse";
}
