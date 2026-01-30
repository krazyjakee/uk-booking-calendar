import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import type { Knex } from "knex";

let testDb: Knex;

const TRADESMAN_USER_ID = "test-tradesman-user-id";
const TRADESMAN_PROFILE_ID = "test-tradesman-profile-id";
const CUSTOMER_ID = "test-customer-id";

// Mock @/lib/db before any imports that use it.
const { mockDb } = vi.hoisted(() => {
  return { mockDb: { __esModule: true, default: null as unknown } };
});

vi.mock("@/lib/db", () => mockDb);

describe("Phase 3 — Availability checking", () => {
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

  beforeEach(async () => {
    const { clearTables } = await import("@/test/db-helper");
    // Clean up tables in correct order (foreign key dependencies)
    await clearTables(testDb, [
      "bookings",
      "working_hours",
      "tradesman_profiles",
      "customers",
    ]);

    // Insert test tradesman user
    const existingUser = await testDb("users")
      .where("id", TRADESMAN_USER_ID)
      .first();
    if (!existingUser) {
      await testDb("users").insert({
        id: TRADESMAN_USER_ID,
        email: "tradesman@test.com",
        password_hash: "$2a$12$fakehashfortesting",
        name: "Test Tradesman",
        role: "tradesman",
        is_active: true,
      });
    }

    // Insert tradesman profile
    await testDb("tradesman_profiles").insert({
      id: TRADESMAN_PROFILE_ID,
      user_id: TRADESMAN_USER_ID,
      buffer_minutes: 0,
      cancellation_notice_hours: 24,
    });

    // Insert customer
    await testDb("customers").insert({
      id: CUSTOMER_ID,
      email: "customer@test.com",
      name: "Test Customer",
      is_anonymised: false,
    });

    // Insert working hours: Monday 09:00–17:00
    await testDb("working_hours").insert({
      id: "wh-monday",
      tradesman_id: TRADESMAN_USER_ID,
      day_of_week: 0, // Monday (ISO)
      start_time: "09:00",
      end_time: "17:00",
      is_active: true,
    });
  });

  describe("getAvailableSlots", () => {
    it("returns slots within working hours on a working day", async () => {
      const { getAvailableSlots } = await import("./availability");
      // 2026-01-05 is a Monday
      const result = await getAvailableSlots(TRADESMAN_USER_ID, "2026-01-05");
      expect(result.isHoliday).toBe(false);
      expect(result.slots.length).toBeGreaterThan(0);

      // Should have 8 x 1-hour slots (09:00 to 17:00)
      expect(result.slots).toHaveLength(8);
      expect(result.slots[0].start_time).toBe("09:00");
      expect(result.slots[0].end_time).toBe("10:00");
      expect(result.slots[7].start_time).toBe("16:00");
      expect(result.slots[7].end_time).toBe("17:00");
    });

    it("marks all slots as available when no bookings exist", async () => {
      const { getAvailableSlots } = await import("./availability");
      const result = await getAvailableSlots(TRADESMAN_USER_ID, "2026-01-05");
      const allAvailable = result.slots.every((s) => s.available);
      expect(allAvailable).toBe(true);
    });

    it("marks a booked slot as unavailable", async () => {
      const { getAvailableSlots } = await import("./availability");
      await testDb("bookings").insert({
        id: "booking-1",
        tradesman_id: TRADESMAN_USER_ID,
        customer_id: CUSTOMER_ID,
        date: "2026-01-05",
        start_time: "10:00",
        end_time: "11:00",
        duration_minutes: 60,
        status: "confirmed",
        is_recurring: false,
      });

      const result = await getAvailableSlots(TRADESMAN_USER_ID, "2026-01-05");

      const tenAm = result.slots.find((s) => s.start_time === "10:00");
      expect(tenAm?.available).toBe(false);

      const nineAm = result.slots.find((s) => s.start_time === "09:00");
      expect(nineAm?.available).toBe(true);
    });

    it("respects buffer time between bookings", async () => {
      const { getAvailableSlots } = await import("./availability");
      await testDb("tradesman_profiles")
        .where("user_id", TRADESMAN_USER_ID)
        .update({ buffer_minutes: 30 });

      await testDb("bookings").insert({
        id: "booking-buffer",
        tradesman_id: TRADESMAN_USER_ID,
        customer_id: CUSTOMER_ID,
        date: "2026-01-05",
        start_time: "10:00",
        end_time: "11:00",
        duration_minutes: 60,
        status: "confirmed",
        is_recurring: false,
      });

      const result = await getAvailableSlots(TRADESMAN_USER_ID, "2026-01-05");

      expect(
        result.slots.find((s) => s.start_time === "10:00")?.available
      ).toBe(false);

      // 11:00 slot should also be unavailable due to 30-min buffer
      expect(
        result.slots.find((s) => s.start_time === "11:00")?.available
      ).toBe(false);
    });

    it("returns no slots on a public holiday", async () => {
      const { getAvailableSlots } = await import("./availability");
      // New Year's Day 2026 is a Thursday — add Thursday working hours
      await testDb("working_hours").insert({
        id: "wh-thursday",
        tradesman_id: TRADESMAN_USER_ID,
        day_of_week: 3, // Thursday (ISO)
        start_time: "09:00",
        end_time: "17:00",
        is_active: true,
      });

      const result = await getAvailableSlots(
        TRADESMAN_USER_ID,
        "2026-01-01"
      );
      expect(result.isHoliday).toBe(true);
      expect(result.slots).toEqual([]);
    });

    it("returns no slots on a day with no working hours", async () => {
      const { getAvailableSlots } = await import("./availability");
      // Tuesday has no working hours set
      const result = await getAvailableSlots(TRADESMAN_USER_ID, "2026-01-06");
      expect(result.slots).toEqual([]);
    });

    it("ignores cancelled bookings when calculating availability", async () => {
      const { getAvailableSlots } = await import("./availability");
      await testDb("bookings").insert({
        id: "booking-cancelled",
        tradesman_id: TRADESMAN_USER_ID,
        customer_id: CUSTOMER_ID,
        date: "2026-01-05",
        start_time: "10:00",
        end_time: "11:00",
        duration_minutes: 60,
        status: "cancelled",
        is_recurring: false,
      });

      const result = await getAvailableSlots(TRADESMAN_USER_ID, "2026-01-05");
      const tenAm = result.slots.find((s) => s.start_time === "10:00");
      expect(tenAm?.available).toBe(true);
    });
  });

  describe("isSlotAvailable", () => {
    it("returns true for an open slot", async () => {
      const { isSlotAvailable } = await import("./availability");
      const available = await isSlotAvailable(
        TRADESMAN_USER_ID,
        "2026-01-05",
        "10:00",
        "11:00"
      );
      expect(available).toBe(true);
    });

    it("returns false for a booked slot", async () => {
      const { isSlotAvailable } = await import("./availability");
      await testDb("bookings").insert({
        id: "booking-slot-check",
        tradesman_id: TRADESMAN_USER_ID,
        customer_id: CUSTOMER_ID,
        date: "2026-01-05",
        start_time: "10:00",
        end_time: "11:00",
        duration_minutes: 60,
        status: "confirmed",
        is_recurring: false,
      });

      const available = await isSlotAvailable(
        TRADESMAN_USER_ID,
        "2026-01-05",
        "10:00",
        "11:00"
      );
      expect(available).toBe(false);
    });

    it("returns false for an overlapping slot", async () => {
      const { isSlotAvailable } = await import("./availability");
      await testDb("bookings").insert({
        id: "booking-overlap",
        tradesman_id: TRADESMAN_USER_ID,
        customer_id: CUSTOMER_ID,
        date: "2026-01-05",
        start_time: "10:00",
        end_time: "12:00",
        duration_minutes: 120,
        status: "confirmed",
        is_recurring: false,
      });

      const available = await isSlotAvailable(
        TRADESMAN_USER_ID,
        "2026-01-05",
        "11:00",
        "12:00"
      );
      expect(available).toBe(false);
    });

    it("excludes a specific booking when checking availability", async () => {
      const { isSlotAvailable } = await import("./availability");
      await testDb("bookings").insert({
        id: "booking-exclude",
        tradesman_id: TRADESMAN_USER_ID,
        customer_id: CUSTOMER_ID,
        date: "2026-01-05",
        start_time: "10:00",
        end_time: "11:00",
        duration_minutes: 60,
        status: "confirmed",
        is_recurring: false,
      });

      const available = await isSlotAvailable(
        TRADESMAN_USER_ID,
        "2026-01-05",
        "10:00",
        "11:00",
        "booking-exclude"
      );
      expect(available).toBe(true);
    });
  });

  describe("isWithinWorkingHours", () => {
    it("returns true for a slot within working hours", async () => {
      const { isWithinWorkingHours } = await import("./availability");
      const result = await isWithinWorkingHours(
        TRADESMAN_USER_ID,
        "2026-01-05",
        "10:00",
        "11:00"
      );
      expect(result).toBe(true);
    });

    it("returns true for a slot at the start of working hours", async () => {
      const { isWithinWorkingHours } = await import("./availability");
      const result = await isWithinWorkingHours(
        TRADESMAN_USER_ID,
        "2026-01-05",
        "09:00",
        "10:00"
      );
      expect(result).toBe(true);
    });

    it("returns true for a slot at the end of working hours", async () => {
      const { isWithinWorkingHours } = await import("./availability");
      const result = await isWithinWorkingHours(
        TRADESMAN_USER_ID,
        "2026-01-05",
        "16:00",
        "17:00"
      );
      expect(result).toBe(true);
    });

    it("returns false for a slot outside working hours", async () => {
      const { isWithinWorkingHours } = await import("./availability");
      const result = await isWithinWorkingHours(
        TRADESMAN_USER_ID,
        "2026-01-05",
        "07:00",
        "08:00"
      );
      expect(result).toBe(false);
    });

    it("returns false for a slot that extends past working hours", async () => {
      const { isWithinWorkingHours } = await import("./availability");
      const result = await isWithinWorkingHours(
        TRADESMAN_USER_ID,
        "2026-01-05",
        "16:30",
        "17:30"
      );
      expect(result).toBe(false);
    });

    it("returns false for a day with no working hours", async () => {
      const { isWithinWorkingHours } = await import("./availability");
      const result = await isWithinWorkingHours(
        TRADESMAN_USER_ID,
        "2026-01-06",
        "10:00",
        "11:00"
      );
      expect(result).toBe(false);
    });
  });
});
