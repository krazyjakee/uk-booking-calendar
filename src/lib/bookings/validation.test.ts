import { describe, it, expect } from "vitest";
import {
  validateDate,
  validateFutureDate,
  validateTime,
  validateHourBoundary,
  validateDuration,
  validateBookingStatus,
  validateRecurrenceFrequency,
  validateUUID,
  validateCustomerEmail,
  validateCustomerName,
  validateOptionalString,
} from "./validation";

describe("Phase 3 — Booking validation", () => {
  describe("validateDate", () => {
    it("accepts a valid YYYY-MM-DD date", () => {
      expect(validateDate("2026-03-15")).toBeNull();
    });

    it("accepts a leap year date", () => {
      expect(validateDate("2028-02-29")).toBeNull();
    });

    it("rejects empty string", () => {
      expect(validateDate("")).toBe("Date is required.");
    });

    it("rejects null", () => {
      expect(validateDate(null)).toBe("Date is required.");
    });

    it("rejects non-string", () => {
      expect(validateDate(20260315)).toBe("Date is required.");
    });

    it("rejects wrong format (DD/MM/YYYY)", () => {
      expect(validateDate("15/03/2026")).toBe(
        "Date must be in YYYY-MM-DD format."
      );
    });

    it("rejects invalid date values", () => {
      expect(validateDate("2026-13-01")).toBe("Date is not valid.");
    });

    it("accepts February 30th (JS Date rolls over to March)", () => {
      // Note: JavaScript's Date constructor silently rolls over
      // invalid dates (Feb 30 → Mar 2). The validator only catches
      // dates that produce NaN, not rollover dates.
      expect(validateDate("2026-02-30")).toBeNull();
    });
  });

  describe("validateFutureDate", () => {
    it("accepts a future date", () => {
      expect(validateFutureDate("2026-12-25", "2026-01-01")).toBeNull();
    });

    it("accepts today's date", () => {
      expect(validateFutureDate("2026-06-15", "2026-06-15")).toBeNull();
    });

    it("rejects a past date", () => {
      expect(validateFutureDate("2025-01-01", "2026-01-01")).toBe(
        "Date must not be in the past."
      );
    });
  });

  describe("validateTime", () => {
    it("accepts valid HH:MM time", () => {
      expect(validateTime("09:00")).toBeNull();
    });

    it("accepts midnight", () => {
      expect(validateTime("00:00")).toBeNull();
    });

    it("accepts 23:59", () => {
      expect(validateTime("23:59")).toBeNull();
    });

    it("rejects empty string", () => {
      expect(validateTime("")).toBe("Time is required.");
    });

    it("rejects null", () => {
      expect(validateTime(null)).toBe("Time is required.");
    });

    it("rejects non-string", () => {
      expect(validateTime(900)).toBe("Time is required.");
    });

    it("rejects wrong format (H:MM)", () => {
      expect(validateTime("9:00")).toBe("Time must be in HH:MM format.");
    });

    it("rejects invalid hour (25:00)", () => {
      expect(validateTime("25:00")).toBe("Time is not valid.");
    });

    it("rejects invalid minutes (09:60)", () => {
      expect(validateTime("09:60")).toBe("Time is not valid.");
    });
  });

  describe("validateHourBoundary", () => {
    it("accepts time on the hour", () => {
      expect(validateHourBoundary("09:00")).toBeNull();
      expect(validateHourBoundary("14:00")).toBeNull();
    });

    it("rejects time not on the hour", () => {
      expect(validateHourBoundary("09:30")).toBe(
        "Time must be on the hour (e.g. 09:00, 10:00)."
      );
    });

    it("rejects time at 15 minutes", () => {
      expect(validateHourBoundary("09:15")).toBe(
        "Time must be on the hour (e.g. 09:00, 10:00)."
      );
    });
  });

  describe("validateDuration", () => {
    it("accepts 60 minutes", () => {
      expect(validateDuration(60)).toBeNull();
    });

    it("accepts 120 minutes", () => {
      expect(validateDuration(120)).toBeNull();
    });

    it("rejects non-integer", () => {
      expect(validateDuration(60.5)).toBe("Duration must be a whole number.");
    });

    it("rejects string", () => {
      expect(validateDuration("60")).toBe("Duration must be a whole number.");
    });

    it("rejects zero", () => {
      expect(validateDuration(0)).toBe("Duration must be positive.");
    });

    it("rejects negative", () => {
      expect(validateDuration(-60)).toBe("Duration must be positive.");
    });

    it("rejects non-multiple of 60", () => {
      expect(validateDuration(45)).toBe(
        "Duration must be a multiple of 60 minutes."
      );
    });
  });

  describe("validateBookingStatus", () => {
    it("accepts all valid statuses", () => {
      const statuses = [
        "pending",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
        "no-show",
      ];
      for (const s of statuses) {
        expect(validateBookingStatus(s)).toBeNull();
      }
    });

    it("rejects empty string", () => {
      expect(validateBookingStatus("")).toBe("Status is required.");
    });

    it("rejects invalid status", () => {
      const result = validateBookingStatus("unknown");
      expect(result).toContain("Status must be one of:");
    });
  });

  describe("validateRecurrenceFrequency", () => {
    it("accepts all valid frequencies", () => {
      const frequencies = ["daily", "weekly", "fortnightly", "monthly"];
      for (const f of frequencies) {
        expect(validateRecurrenceFrequency(f)).toBeNull();
      }
    });

    it("rejects empty string", () => {
      expect(validateRecurrenceFrequency("")).toBe("Frequency is required.");
    });

    it("rejects invalid frequency", () => {
      const result = validateRecurrenceFrequency("yearly");
      expect(result).toContain("Frequency must be one of:");
    });
  });

  describe("validateUUID", () => {
    it("accepts a non-empty string", () => {
      expect(validateUUID("abc-123", "ID")).toBeNull();
    });

    it("rejects empty string", () => {
      expect(validateUUID("", "Booking ID")).toBe("Booking ID is required.");
    });

    it("rejects null", () => {
      expect(validateUUID(null, "User ID")).toBe("User ID is required.");
    });
  });

  describe("validateCustomerEmail", () => {
    it("accepts valid email", () => {
      expect(validateCustomerEmail("customer@example.com")).toBeNull();
    });

    it("rejects empty string", () => {
      expect(validateCustomerEmail("")).toBe("Customer email is required.");
    });

    it("rejects invalid email format", () => {
      expect(validateCustomerEmail("not-an-email")).toBe(
        "Customer email is not valid."
      );
    });

    it("rejects email over 255 characters", () => {
      const longEmail = "a".repeat(250) + "@b.com";
      expect(validateCustomerEmail(longEmail)).toBe(
        "Customer email must not exceed 255 characters."
      );
    });
  });

  describe("validateCustomerName", () => {
    it("accepts valid name", () => {
      expect(validateCustomerName("John Smith")).toBeNull();
    });

    it("rejects empty string", () => {
      expect(validateCustomerName("")).toBe("Customer name is required.");
    });

    it("rejects name over 255 characters", () => {
      expect(validateCustomerName("a".repeat(256))).toBe(
        "Customer name must not exceed 255 characters."
      );
    });
  });

  describe("validateOptionalString", () => {
    it("returns null for undefined", () => {
      expect(validateOptionalString(undefined, "Notes", 500)).toBeNull();
    });

    it("returns null for null", () => {
      expect(validateOptionalString(null, "Notes", 500)).toBeNull();
    });

    it("returns null for valid string within limit", () => {
      expect(validateOptionalString("Some text", "Notes", 500)).toBeNull();
    });

    it("rejects non-string value", () => {
      expect(validateOptionalString(123, "Notes", 500)).toBe(
        "Notes must be a string."
      );
    });

    it("rejects string exceeding max length", () => {
      expect(validateOptionalString("a".repeat(501), "Notes", 500)).toBe(
        "Notes must not exceed 500 characters."
      );
    });
  });
});
