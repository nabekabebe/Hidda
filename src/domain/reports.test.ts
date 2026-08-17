import { familyGroupSheet, narrativeReport, peopleCsv } from "./reports";
import { SEED_PEOPLE, SEED_RELATIONSHIPS } from "./seed";
import { describe, expect, it } from "vitest";

const snapshot = {
  version: 2,
  people: SEED_PEOPLE,
  relationships: SEED_RELATIONSHIPS,
  name: "Solano family",
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
};

describe("reports", () => {
  it("exports csv with Mira", () => {
    expect(peopleCsv(snapshot)).toContain("Mira");
  });

  it("writes a group sheet and narrative", () => {
    expect(familyGroupSheet(snapshot, "mira")).toContain("Daniel");
    expect(narrativeReport(snapshot, "mira")).toContain("Mira");
  });
});
