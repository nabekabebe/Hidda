import type { EventType, FamilyEvent } from "./types";

export const EVENT_TYPES: { id: EventType; label: string }[] = [
  { id: "birth", label: "Birth" },
  { id: "baptism", label: "Baptism" },
  { id: "christening", label: "Christening" },
  { id: "marriage", label: "Marriage" },
  { id: "divorce", label: "Divorce" },
  { id: "partnership", label: "Partnership" },
  { id: "death", label: "Death" },
  { id: "burial", label: "Burial" },
  { id: "cremation", label: "Cremation" },
  { id: "residence", label: "Residence" },
  { id: "occupation", label: "Occupation" },
  { id: "education", label: "Education" },
  { id: "immigration", label: "Immigration" },
  { id: "census", label: "Census" },
  { id: "other", label: "Other" },
];

export function eventLabel(type: EventType): string {
  return EVENT_TYPES.find((item) => item.id === type)?.label ?? type;
}

export function sortEvents(events: FamilyEvent[]): FamilyEvent[] {
  return [...events].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999") || a.type.localeCompare(b.type));
}

export function eventsForPerson(events: FamilyEvent[], personId: string): FamilyEvent[] {
  return sortEvents(events.filter((event) => event.personId === personId || event.spousePersonId === personId));
}

export function emptyEvent(personId: string): Omit<FamilyEvent, "id"> {
  return { type: "residence", personId, date: "", place: "", detail: "" };
}
