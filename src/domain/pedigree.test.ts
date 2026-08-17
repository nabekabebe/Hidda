import { pedigreeSlots } from "./pedigree";
import { buildGraph } from "./graph";
import { SEED_PEOPLE, SEED_RELATIONSHIPS } from "./seed";
import { describe, expect, it } from "vitest";

describe("pedigree", () => {
  it("lays out Mira's parents in generation 1", () => {
    const slots = pedigreeSlots(buildGraph(SEED_PEOPLE, SEED_RELATIONSHIPS), "mira", 3);
    const parents = slots.filter((slot) => slot.generation === 1).map((slot) => slot.person?.id);
    expect(parents).toContain("ruth");
    expect(parents).toContain("tomas");
  });
});
