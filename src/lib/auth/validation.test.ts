import { describe, it, expect } from "vitest";
import { validateEmail, validatePassword, validateName } from "./validation";

describe("Phase 2 — Auth validation", () => {
  describe("validateEmail", () => {
    it("returns null for a valid email", () => {
      expect(validateEmail("user@example.com")).toBeNull();
    });

    it("returns null for an email with subdomains", () => {
      expect(validateEmail("user@mail.example.co.uk")).toBeNull();
    });

    it("returns error for empty string", () => {
      expect(validateEmail("")).toBe("Email is required.");
    });

    it("returns error for null", () => {
      expect(validateEmail(null)).toBe("Email is required.");
    });

    it("returns error for undefined", () => {
      expect(validateEmail(undefined)).toBe("Email is required.");
    });

    it("returns error for non-string", () => {
      expect(validateEmail(123)).toBe("Email is required.");
    });

    it("returns error for email without @", () => {
      expect(validateEmail("userexample.com")).toBe(
        "Enter a valid email address."
      );
    });

    it("returns error for email without domain", () => {
      expect(validateEmail("user@")).toBe("Enter a valid email address.");
    });

    it("returns error for email without TLD", () => {
      expect(validateEmail("user@example")).toBe(
        "Enter a valid email address."
      );
    });

    it("returns error for email with spaces", () => {
      expect(validateEmail("user @example.com")).toBe(
        "Enter a valid email address."
      );
    });

    it("returns error for email exceeding 255 characters", () => {
      const longEmail = "a".repeat(250) + "@b.com";
      expect(validateEmail(longEmail)).toBe(
        "Email must be under 255 characters."
      );
    });
  });

  describe("validatePassword", () => {
    it("returns null for valid password (8+ chars)", () => {
      expect(validatePassword("securePass1")).toBeNull();
    });

    it("returns null for password at exactly 8 characters", () => {
      expect(validatePassword("12345678")).toBeNull();
    });

    it("returns null for password at 128 characters", () => {
      expect(validatePassword("a".repeat(128))).toBeNull();
    });

    it("returns error for empty string", () => {
      expect(validatePassword("")).toBe("Password is required.");
    });

    it("returns error for null", () => {
      expect(validatePassword(null)).toBe("Password is required.");
    });

    it("returns error for non-string", () => {
      expect(validatePassword(12345678)).toBe("Password is required.");
    });

    it("returns error for password shorter than 8 characters", () => {
      expect(validatePassword("short")).toBe(
        "Password must be at least 8 characters."
      );
    });

    it("returns error for password exceeding 128 characters", () => {
      expect(validatePassword("a".repeat(129))).toBe(
        "Password must be under 128 characters."
      );
    });
  });

  describe("validateName", () => {
    it("returns null for a valid name", () => {
      expect(validateName("Jake Cattrall")).toBeNull();
    });

    it("returns null for a single character name", () => {
      expect(validateName("J")).toBeNull();
    });

    it("returns error for empty string", () => {
      expect(validateName("")).toBe("Name is required.");
    });

    it("returns error for whitespace-only string", () => {
      expect(validateName("   ")).toBe("Name is required.");
    });

    it("returns error for null", () => {
      expect(validateName(null)).toBe("Name is required.");
    });

    it("returns error for non-string", () => {
      expect(validateName(42)).toBe("Name is required.");
    });

    it("returns error for name exceeding 255 characters", () => {
      expect(validateName("a".repeat(256))).toBe(
        "Name must be under 255 characters."
      );
    });
  });
});
