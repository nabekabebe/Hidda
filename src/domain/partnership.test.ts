import { partnershipSummary } from "./partnership";
import { describe, expect, it } from "vitest";

describe("partnership facts", () => {
  it("summarizes marriage and divorce dates", () => {
    expect(
      partnershipSummary({
        id: "r",
        sourcePersonId: "a",
        targetPersonId: "b",
        type: "spouse",
        metadata: { marriedOn: "1978-09-03", marriedPlace: "Brooklyn" },
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe("Married 1978-09-03 in Brooklyn");
  });
});
