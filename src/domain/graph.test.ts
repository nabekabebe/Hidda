import {
  alreadyRelated,
  buildGraph,
  childrenOf,
  connectCandidates,
  descendantBranchOf,
  directedRelationship,
  generationCount,
  parentsOf,
  partnersOf,
  siblingsOf,
} from "./graph";
import { SEED_PEOPLE, SEED_RELATIONSHIPS } from "./seed";
import { describe, expect, it } from "vitest";

const graph = buildGraph(SEED_PEOPLE, SEED_RELATIONSHIPS);

describe("family graph", () => {
  it("finds Mira's parents", () => {
    const parents = parentsOf(graph, "mira").map((item) => item.person.id).sort();
    expect(parents).toEqual(["ruth", "tomas"]);
  });

  it("finds children and partners", () => {
    expect(childrenOf(graph, "mira").map((item) => item.person.id).sort()).toEqual(["levi", "noor"]);
    expect(partnersOf(graph, "mira")[0]?.person.id).toBe("daniel");
  });

  it("infers siblings from shared parents", () => {
    const ids = siblingsOf(graph, "mira").map((item) => item.person.id);
    expect(ids).toContain("elias");
  });

  it("counts four generations", () => {
    expect(generationCount(graph)).toBe(4);
  });

  it("points parent edges from parent to child", () => {
    expect(directedRelationship("mira", "asha", "parent")).toEqual({
      sourcePersonId: "asha",
      targetPersonId: "mira",
      type: "biological-parent",
    });
    expect(directedRelationship("mira", "asha", "child")).toEqual({
      sourcePersonId: "mira",
      targetPersonId: "asha",
      type: "biological-parent",
    });
  });

  it("will not re-link people who already hold that place", () => {
    expect(alreadyRelated(graph, "mira", "ruth", "parent")).toBe(true);
    expect(alreadyRelated(graph, "mira", "daniel", "spouse")).toBe(true);
    const parentIds = connectCandidates(graph, "mira", "parent").map((person) => person.id);
    expect(parentIds).not.toContain("ruth");
    expect(parentIds).not.toContain("noor");
    expect(parentIds).toContain("elias");
  });

  it("builds a descendant branch without ancestors", () => {
    const ids = [...descendantBranchOf(graph, "mira")];
    expect(ids).toEqual(expect.arrayContaining(["mira", "daniel", "noor", "levi", "asha"]));
    expect(ids).not.toContain("ruth");
    expect(ids).not.toContain("tomas");
    expect(ids).not.toContain("elias");
  });
});
