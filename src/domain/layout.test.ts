import { buildGraph } from "./graph";
import { layoutTree } from "./layout";
import { SEED_PEOPLE, SEED_RELATIONSHIPS } from "./seed";
import { searchPeople } from "./search";
import { defaultFilters } from "./types";
import { personMatchesFilters } from "./search";
import { describe, expect, it } from "vitest";

const graph = buildGraph(SEED_PEOPLE, SEED_RELATIONSHIPS);

describe("layout and search", () => {
  it("places every person without overlap on a generation band", () => {
    const layout = layoutTree(graph);
    expect(layout.positions.size).toBe(SEED_PEOPLE.length);
    const mira = layout.positions.get("mira");
    const tomas = layout.positions.get("tomas");
    expect(mira).toBeTruthy();
    expect(tomas).toBeTruthy();
    expect(mira!.y).toBeGreaterThan(tomas!.y);
  });

  it("finds people by nickname and year", () => {
    expect(searchPeople(SEED_PEOPLE, "miri")[0]?.person.id).toBe("mira");
    expect(searchPeople(SEED_PEOPLE, "1952")[0]?.person.id).toBe("mira");
  });

  it("filters deceased people", () => {
    const filters = { ...defaultFilters(), living: "deceased" as const };
    const ids = SEED_PEOPLE.filter((person) => personMatchesFilters(person, graph, filters)).map((person) => person.id);
    expect(ids.sort()).toEqual(["ruth", "tomas"]);
  });
});
