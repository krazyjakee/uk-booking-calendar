import { describe, it, expect } from "vitest";
import { canTransition, validateTransition, isTerminalStatus } from "./status-machine";
import type { BookingStatus } from "./types";

describe("Phase 3 — Booking status machine", () => {
  describe("canTransition", () => {
    // Valid transitions
    it("allows pending → confirmed", () => {
      expect(canTransition("pending", "confirmed")).toBe(true);
    });

    it("allows pending → cancelled", () => {
      expect(canTransition("pending", "cancelled")).toBe(true);
    });

    it("allows confirmed → in-progress", () => {
      expect(canTransition("confirmed", "in-progress")).toBe(true);
    });

    it("allows confirmed → cancelled", () => {
      expect(canTransition("confirmed", "cancelled")).toBe(true);
    });

    it("allows confirmed → no-show", () => {
      expect(canTransition("confirmed", "no-show")).toBe(true);
    });

    it("allows in-progress → completed", () => {
      expect(canTransition("in-progress", "completed")).toBe(true);
    });

    it("allows in-progress → cancelled", () => {
      expect(canTransition("in-progress", "cancelled")).toBe(true);
    });

    // Invalid transitions
    it("disallows pending → completed", () => {
      expect(canTransition("pending", "completed")).toBe(false);
    });

    it("disallows pending → in-progress", () => {
      expect(canTransition("pending", "in-progress")).toBe(false);
    });

    it("disallows pending → no-show", () => {
      expect(canTransition("pending", "no-show")).toBe(false);
    });

    it("disallows completed → anything", () => {
      const targets: BookingStatus[] = [
        "pending",
        "confirmed",
        "in-progress",
        "cancelled",
        "no-show",
      ];
      for (const target of targets) {
        expect(canTransition("completed", target)).toBe(false);
      }
    });

    it("disallows cancelled → anything", () => {
      const targets: BookingStatus[] = [
        "pending",
        "confirmed",
        "in-progress",
        "completed",
        "no-show",
      ];
      for (const target of targets) {
        expect(canTransition("cancelled", target)).toBe(false);
      }
    });

    it("disallows no-show → anything", () => {
      const targets: BookingStatus[] = [
        "pending",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
      ];
      for (const target of targets) {
        expect(canTransition("no-show", target)).toBe(false);
      }
    });
  });

  describe("validateTransition", () => {
    it("returns null for a valid transition", () => {
      expect(validateTransition("pending", "confirmed")).toBeNull();
    });

    it("returns error message for an invalid transition", () => {
      const result = validateTransition("completed", "pending");
      expect(result).toBe(
        'Cannot change status from "completed" to "pending".'
      );
    });
  });

  describe("isTerminalStatus", () => {
    it("identifies completed as terminal", () => {
      expect(isTerminalStatus("completed")).toBe(true);
    });

    it("identifies cancelled as terminal", () => {
      expect(isTerminalStatus("cancelled")).toBe(true);
    });

    it("identifies no-show as terminal", () => {
      expect(isTerminalStatus("no-show")).toBe(true);
    });

    it("identifies pending as non-terminal", () => {
      expect(isTerminalStatus("pending")).toBe(false);
    });

    it("identifies confirmed as non-terminal", () => {
      expect(isTerminalStatus("confirmed")).toBe(false);
    });

    it("identifies in-progress as non-terminal", () => {
      expect(isTerminalStatus("in-progress")).toBe(false);
    });
  });
});
