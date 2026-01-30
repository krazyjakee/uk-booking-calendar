import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("Phase 2 — Password hashing", () => {
  it("hashes a password to a bcrypt string", async () => {
    const hash = await hashPassword("testPassword123");
    expect(hash).toMatch(/^\$2[aby]?\$/);
    expect(hash).not.toBe("testPassword123");
  });

  it("produces different hashes for the same password (salted)", async () => {
    const hash1 = await hashPassword("samePassword");
    const hash2 = await hashPassword("samePassword");
    expect(hash1).not.toBe(hash2);
  });

  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("correctPassword");
    const result = await verifyPassword("correctPassword", hash);
    expect(result).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("correctPassword");
    const result = await verifyPassword("wrongPassword", hash);
    expect(result).toBe(false);
  });

  it("rejects an empty password against a valid hash", async () => {
    const hash = await hashPassword("somePassword");
    const result = await verifyPassword("", hash);
    expect(result).toBe(false);
  });
});
