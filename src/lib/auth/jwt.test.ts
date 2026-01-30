import { describe, it, expect } from "vitest";
import { signToken, verifyToken } from "./jwt";
import type { SafeUser } from "./types";

const mockUser: SafeUser = {
  id: "test-user-id-123",
  email: "test@example.com",
  name: "Test User",
  role: "admin",
  is_active: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("Phase 2 — JWT sign and verify", () => {
  it("signs a token for a user", async () => {
    const token = await signToken(mockUser);
    expect(token).toBeTypeOf("string");
    expect(token.split(".")).toHaveLength(3); // JWT has 3 parts
  });

  it("verifies a valid token and returns the payload", async () => {
    const token = await signToken(mockUser);
    const payload = await verifyToken(token);

    expect(payload.sub).toBe(mockUser.id);
    expect(payload.email).toBe(mockUser.email);
    expect(payload.name).toBe(mockUser.name);
    expect(payload.role).toBe(mockUser.role);
    expect(payload.iss).toBe("uk-booking-calendar-test");
    expect(payload.iat).toBeTypeOf("number");
    expect(payload.exp).toBeTypeOf("number");
  });

  it("includes correct role in payload for tradesman", async () => {
    const tradesmanUser: SafeUser = {
      ...mockUser,
      id: "tradesman-id",
      role: "tradesman",
    };
    const token = await signToken(tradesmanUser);
    const payload = await verifyToken(token);
    expect(payload.role).toBe("tradesman");
  });

  it("includes correct role in payload for manager", async () => {
    const managerUser: SafeUser = {
      ...mockUser,
      id: "manager-id",
      role: "manager",
    };
    const token = await signToken(managerUser);
    const payload = await verifyToken(token);
    expect(payload.role).toBe("manager");
  });

  it("rejects a tampered token", async () => {
    const token = await signToken(mockUser);
    const tampered = token.slice(0, -5) + "XXXXX";
    await expect(verifyToken(tampered)).rejects.toThrow();
  });

  it("rejects a completely invalid token string", async () => {
    await expect(verifyToken("not-a-jwt")).rejects.toThrow();
  });

  it("produces different tokens for different users", async () => {
    const token1 = await signToken(mockUser);
    const token2 = await signToken({ ...mockUser, id: "other-id" });
    expect(token1).not.toBe(token2);
  });
});
