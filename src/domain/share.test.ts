import { buildGraph } from "./graph";
import { redactLivingPeople, sliceSnapshot } from "./share";
import { SEED_PEOPLE, SEED_RELATIONSHIPS } from "./seed";
import { describe, expect, it } from "vitest";

const snapshot = {
  people: SEED_PEOPLE,
  relationships: SEED_RELATIONSHIPS,
  name: "Solano family",
  inscriptions: [{ id: "t1", text: "Solano family", x: 0, y: -40, kind: "title" as const }],
};

describe("share snapshot", () => {
  it("keeps the full atlas when no root is given", () => {
    const sliced = sliceSnapshot(snapshot);
    expect(sliced.people).toHaveLength(SEED_PEOPLE.length);
    expect(sliced.name).toBe("Solano family");
  });

  it("keeps Mira's descendants and partner, not her ancestors", () => {
    const sliced = sliceSnapshot(snapshot, "mira");
    const ids = sliced.people.map((person) => person.id);
    expect(ids).toContain("mira");
    expect(ids).toContain("daniel");
    expect(ids).toContain("noor");
    expect(ids).toContain("levi");
    expect(ids).toContain("asha");
    expect(ids).not.toContain("ruth");
    expect(ids).not.toContain("tomas");
    expect(ids).not.toContain("elias");
    const graph = buildGraph(sliced.people, sliced.relationships);
    expect(graph.byId.has("mira")).toBe(true);
  });

  it("migrates a v1 snapshot with extra catalog fields", () => {
    const sliced = sliceSnapshot({
      people: SEED_PEOPLE,
      relationships: SEED_RELATIONSHIPS,
      name: "Solano family",
    } as never);
    expect(sliced.version).toBe(2);
    expect(sliced.homePersonId).toBe("ruth");
    expect(sliced.people[0]?.prefix).toBe("");
    expect(sliced.people[0]?.birthPlace).toBe(sliced.people[0]?.location);
    expect(sliced.events).toEqual([]);
  });

  it("hides living names on view snapshots", () => {
    const redacted = sliceSnapshot(snapshot);
    const living = redacted.people.find((person) => person.id === "mira");
    expect(living?.firstName).toBe("Mira");
    const hidden = redactLivingPeople(redacted);
    expect(hidden.people.find((person) => person.id === "mira")?.firstName).toBe("Living");
    expect(hidden.people.find((person) => person.id === "ruth")?.firstName).toBe("Ruth");
  });
});
