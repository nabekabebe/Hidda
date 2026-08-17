import { hashPassword, verifyPassword } from "./password";
import { describe, expect, it } from "vitest";

describe("password hashing", () => {
  it("verifies a matching password", async () => {
    const stored = await hashPassword("atlas-secret");
    expect(await verifyPassword("atlas-secret", stored.salt, stored.hash)).toBe(true);
    expect(await verifyPassword("wrong", stored.salt, stored.hash)).toBe(false);
  });
});
