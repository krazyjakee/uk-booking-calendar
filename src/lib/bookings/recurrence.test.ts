import { describe, it, expect } from "vitest";
import { generateRecurrenceDates } from "./recurrence";

describe("Phase 3 — Recurrence date generation", () => {
  describe("daily recurrence", () => {
    it("generates daily dates with interval 1", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "daily",
          interval: 1,
          startDate: "2026-03-01",
          maxOccurrences: 5,
        },
        4
      );
      expect(dates).toEqual([
        "2026-03-01",
        "2026-03-02",
        "2026-03-03",
        "2026-03-04",
        "2026-03-05",
      ]);
    });

    it("generates every-other-day dates with interval 2", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "daily",
          interval: 2,
          startDate: "2026-03-01",
          maxOccurrences: 4,
        },
        4
      );
      expect(dates).toEqual([
        "2026-03-01",
        "2026-03-03",
        "2026-03-05",
        "2026-03-07",
      ]);
    });
  });

  describe("weekly recurrence", () => {
    it("generates weekly dates", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "weekly",
          interval: 1,
          startDate: "2026-03-02",
          maxOccurrences: 4,
        },
        8
      );
      expect(dates).toEqual([
        "2026-03-02",
        "2026-03-09",
        "2026-03-16",
        "2026-03-23",
      ]);
    });

    it("generates bi-weekly dates (interval 2)", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "weekly",
          interval: 2,
          startDate: "2026-03-02",
          maxOccurrences: 3,
        },
        12
      );
      expect(dates).toEqual([
        "2026-03-02",
        "2026-03-16",
        "2026-03-30",
      ]);
    });
  });

  describe("fortnightly recurrence", () => {
    it("generates fortnightly dates", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "fortnightly",
          interval: 1,
          startDate: "2026-03-01",
          maxOccurrences: 3,
        },
        12
      );
      expect(dates).toEqual([
        "2026-03-01",
        "2026-03-15",
        "2026-03-29",
      ]);
    });
  });

  describe("monthly recurrence", () => {
    it("generates monthly dates", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "monthly",
          interval: 1,
          startDate: "2026-01-15",
          maxOccurrences: 3,
        },
        16
      );
      expect(dates).toEqual([
        "2026-01-15",
        "2026-02-15",
        "2026-03-15",
      ]);
    });

    it("generates quarterly dates (interval 3)", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "monthly",
          interval: 3,
          startDate: "2026-01-01",
          maxOccurrences: 2,
        },
        52
      );
      expect(dates).toEqual(["2026-01-01", "2026-04-01"]);
    });
  });

  describe("end conditions", () => {
    it("stops at endDate", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "daily",
          interval: 1,
          startDate: "2026-03-01",
          endDate: "2026-03-03",
        },
        12
      );
      expect(dates).toEqual([
        "2026-03-01",
        "2026-03-02",
        "2026-03-03",
      ]);
    });

    it("stops at maxOccurrences", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "daily",
          interval: 1,
          startDate: "2026-03-01",
          maxOccurrences: 2,
        },
        12
      );
      expect(dates).toHaveLength(2);
    });

    it("stops at horizon when no end conditions are set", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "weekly",
          interval: 1,
          startDate: "2026-03-01",
        },
        4 // 4-week horizon
      );
      // Should generate dates within a 4-week window
      expect(dates.length).toBeGreaterThanOrEqual(4);
      expect(dates.length).toBeLessThanOrEqual(5);
    });

    it("uses default 12-week horizon", () => {
      const dates = generateRecurrenceDates({
        frequency: "weekly",
        interval: 1,
        startDate: "2026-03-01",
      });
      // 12 weeks = ~13 weekly dates (start date + 12 weeks)
      expect(dates.length).toBeGreaterThanOrEqual(12);
      expect(dates.length).toBeLessThanOrEqual(13);
    });

    it("includes start date as first occurrence", () => {
      const dates = generateRecurrenceDates(
        {
          frequency: "weekly",
          interval: 1,
          startDate: "2026-04-01",
          maxOccurrences: 3,
        },
        12
      );
      expect(dates[0]).toBe("2026-04-01");
    });
  });
});
