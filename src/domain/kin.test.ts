import { buildGraph } from "./graph";
import { relationToHome } from "./kin";
import { SEED_PEOPLE, SEED_RELATIONSHIPS } from "./seed";
import { describe, expect, it } from "vitest";

const graph = buildGraph(SEED_PEOPLE, SEED_RELATIONSHIPS);

describe("kinship", () => {
  it("labels Mira's close family from her as home", () => {
    expect(relationToHome(graph, "mira", "mira")).toBe("Home person");
    expect(relationToHome(graph, "ruth", "mira")).toBe("Mother");
    expect(relationToHome(graph, "daniel", "mira")).toBe("Husband");
    expect(relationToHome(graph, "noor", "mira")).toBe("Daughter");
    expect(relationToHome(graph, "asha", "mira")).toBe("Granddaughter");
    expect(relationToHome(graph, "elias", "mira")).toBe("Brother");
  });
});
