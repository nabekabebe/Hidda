import { exportGedcom, importGedcom } from "./gedcom";
import { SEED_PEOPLE, SEED_RELATIONSHIPS } from "./seed";
import { describe, expect, it } from "vitest";

const sample = `0 HEAD
1 GEDC
2 VERS 5.5.1
0 @I1@ INDI
1 NAME Ruth /Calder/
1 SEX F
1 BIRT
2 DATE 8 APR 1921
2 PLAC Kingston
0 @I2@ INDI
1 NAME Tomas /Solano/
1 SEX M
0 @F1@ FAM
1 HUSB @I2@
1 WIFE @I1@
1 MARR
2 DATE 12 JUN 1946
2 PLAC Kingston
0 TRLR
`;

describe("gedcom", () => {
  it("imports individuals and a marriage family", () => {
    const { snapshot } = importGedcom(sample);
    expect(snapshot.people.map((person) => person.firstName).sort()).toEqual(["Ruth", "Tomas"]);
    expect(snapshot.relationships.some((rel) => rel.type === "spouse")).toBe(true);
    expect(snapshot.people.find((person) => person.firstName === "Ruth")?.birthDate).toBe("1921-04-08");
  });

  it("round-trips a seed couple", () => {
    const ged = exportGedcom({
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
    });
    const { snapshot } = importGedcom(ged);
    expect(snapshot.people).toHaveLength(SEED_PEOPLE.length);
    expect(snapshot.people.some((person) => person.firstName === "Mira")).toBe(true);
  });
});
