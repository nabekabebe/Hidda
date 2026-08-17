import { mergePeople } from "./quality";
import { SEED_PEOPLE, SEED_RELATIONSHIPS } from "./seed";
import { describe, expect, it } from "vitest";

describe("merge", () => {
  it("rewrites edges onto the kept person", () => {
    const snapshot = mergePeople(
      {
        version: 2,
        people: SEED_PEOPLE,
        relationships: SEED_RELATIONSHIPS,
        name: "x",
        inscriptions: [],
        homePersonId: "mira",
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
      },
      "mira",
      "elias",
    );
    expect(snapshot.people.some((person) => person.id === "elias")).toBe(false);
    expect(snapshot.relationships.some((rel) => rel.sourcePersonId === "elias" || rel.targetPersonId === "elias")).toBe(false);
  });
});
