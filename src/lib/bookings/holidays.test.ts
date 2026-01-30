import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import type { Knex } from "knex";

let testDb: Knex;

// Mock @/lib/db before any imports that use it.
// vi.hoisted ensures the variable is available to the hoisted vi.mock call.
const { mockDb } = vi.hoisted(() => {
  return { mockDb: { __esModule: true, default: null as unknown } };
});

vi.mock("@/lib/db", () => mockDb);

describe("Phase 3 — UK public holidays", () => {
  beforeAll(async () => {
    const { getTestDb } = await import("@/test/db-helper");
    testDb = await getTestDb();
    mockDb.default = testDb;
  });

  afterAll(async () => {
    const { destroyTestDb } = await import("@/test/db-helper");
    vi.restoreAllMocks();
    await destroyTestDb();
  });

  describe("isPublicHoliday", () => {
    it("returns true for New Year's Day 2026", async () => {
      const { isPublicHoliday } = await import("./holidays");
      const result = await isPublicHoliday("2026-01-01");
      expect(result.isHoliday).toBe(true);
      expect(result.name).toBe("New Year's Day");
    });

    it("returns true for Christmas Day 2026", async () => {
      const { isPublicHoliday } = await import("./holidays");
      const result = await isPublicHoliday("2026-12-25");
      expect(result.isHoliday).toBe(true);
      expect(result.name).toBe("Christmas Day");
    });

    it("returns false for a regular working day", async () => {
      const { isPublicHoliday } = await import("./holidays");
      const result = await isPublicHoliday("2026-03-10");
      expect(result.isHoliday).toBe(false);
      expect(result.name).toBeNull();
    });

    it("checks region-specific holidays", async () => {
      const { isPublicHoliday } = await import("./holidays");
      const scotlandResult = await isPublicHoliday("2026-11-30", "scotland");
      expect(scotlandResult).toHaveProperty("isHoliday");
      expect(scotlandResult).toHaveProperty("name");
    });
  });

  describe("getPublicHolidays", () => {
    it("returns holidays within a date range", async () => {
      const { getPublicHolidays } = await import("./holidays");
      const holidays = await getPublicHolidays("2026-12-01", "2026-12-31");
      expect(holidays.length).toBeGreaterThan(0);
      const names = holidays.map((h: { name: string }) => h.name);
      expect(names).toContain("Christmas Day");
      expect(names).toContain("Boxing Day (substitute)");
    });

    it("returns empty array for range with no holidays", async () => {
      const { getPublicHolidays } = await import("./holidays");
      const holidays = await getPublicHolidays("2026-02-10", "2026-02-20");
      expect(holidays).toEqual([]);
    });

    it("returns holidays in ascending date order", async () => {
      const { getPublicHolidays } = await import("./holidays");
      const holidays = await getPublicHolidays("2026-01-01", "2026-12-31");
      for (let i = 1; i < holidays.length; i++) {
        expect(holidays[i].date >= holidays[i - 1].date).toBe(true);
      }
    });
  });
});
