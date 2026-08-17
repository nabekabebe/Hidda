import type { CompassRelation } from "@/domain/types";

export const relationCopy: Record<CompassRelation, { title: string; connect: string; done: string }> = {
  parent: { title: "Add a parent", connect: "Someone already in the sky", done: "Parent connected" },
  child: { title: "Add a child", connect: "Someone already in the sky", done: "Child connected" },
  spouse: { title: "Add a partner", connect: "Someone already in the sky", done: "Partner connected" },
  sibling: { title: "Add a sibling", connect: "Someone already in the sky", done: "Sibling connected" },
};

export function formTitle(panel: { personId?: string; relation?: CompassRelation; fromId?: string }) {
  if (panel.personId) return "Edit person";
  if (panel.fromId && panel.relation) return relationCopy[panel.relation].title;
  return "Place a person";
}
