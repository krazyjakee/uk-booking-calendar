import { describe, it, expect, beforeAll, afterAll } from "vitest";
import knex, { type Knex } from "knex";
import path from "path";
import { VitestMigrationSource } from "@/test/db-helper";

const migrationsDir = path.resolve("src/lib/db/migrations");

describe("Phase 1 — Database migrations", () => {
  let db: Knex;

  beforeAll(async () => {
    db = knex({
      client: "better-sqlite3",
      connection: { filename: ":memory:" },
      useNullAsDefault: true,
    });
    await db.migrate.latest({
      migrationSource: new VitestMigrationSource(migrationsDir),
    });
  });

  afterAll(async () => {
    await db.destroy();
  });

  it("creates the users table with correct columns", async () => {
    const hasTable = await db.schema.hasTable("users");
    expect(hasTable).toBe(true);

    const columns = await db.schema.raw("PRAGMA table_info('users')");
    const colNames = columns.map((c: { name: string }) => c.name);
    expect(colNames).toContain("id");
    expect(colNames).toContain("email");
    expect(colNames).toContain("password_hash");
    expect(colNames).toContain("name");
    expect(colNames).toContain("role");
    expect(colNames).toContain("is_active");
    expect(colNames).toContain("created_at");
    expect(colNames).toContain("updated_at");
  });

  it("creates the tradesman_profiles table", async () => {
    const hasTable = await db.schema.hasTable("tradesman_profiles");
    expect(hasTable).toBe(true);

    const columns = await db.schema.raw(
      "PRAGMA table_info('tradesman_profiles')"
    );
    const colNames = columns.map((c: { name: string }) => c.name);
    expect(colNames).toContain("id");
    expect(colNames).toContain("user_id");
    expect(colNames).toContain("business_name");
    expect(colNames).toContain("buffer_minutes");
    expect(colNames).toContain("cancellation_notice_hours");
    expect(colNames).toContain("service_area_centre");
    expect(colNames).toContain("service_area_radius_miles");
  });

  it("creates the working_hours table", async () => {
    const hasTable = await db.schema.hasTable("working_hours");
    expect(hasTable).toBe(true);

    const columns = await db.schema.raw(
      "PRAGMA table_info('working_hours')"
    );
    const colNames = columns.map((c: { name: string }) => c.name);
    expect(colNames).toContain("tradesman_id");
    expect(colNames).toContain("day_of_week");
    expect(colNames).toContain("start_time");
    expect(colNames).toContain("end_time");
    expect(colNames).toContain("is_active");
  });

  it("creates the customers table", async () => {
    const hasTable = await db.schema.hasTable("customers");
    expect(hasTable).toBe(true);

    const columns = await db.schema.raw("PRAGMA table_info('customers')");
    const colNames = columns.map((c: { name: string }) => c.name);
    expect(colNames).toContain("id");
    expect(colNames).toContain("email");
    expect(colNames).toContain("name");
    expect(colNames).toContain("phone");
    expect(colNames).toContain("postcode");
    expect(colNames).toContain("is_anonymised");
  });

  it("creates the bookings table with all required columns", async () => {
    const hasTable = await db.schema.hasTable("bookings");
    expect(hasTable).toBe(true);

    const columns = await db.schema.raw("PRAGMA table_info('bookings')");
    const colNames = columns.map((c: { name: string }) => c.name);
    expect(colNames).toContain("id");
    expect(colNames).toContain("tradesman_id");
    expect(colNames).toContain("customer_id");
    expect(colNames).toContain("date");
    expect(colNames).toContain("start_time");
    expect(colNames).toContain("end_time");
    expect(colNames).toContain("duration_minutes");
    expect(colNames).toContain("status");
    expect(colNames).toContain("recurrence_group_id");
    expect(colNames).toContain("is_recurring");
    expect(colNames).toContain("multi_day_group_id");
    expect(colNames).toContain("multi_day_sequence");
  });

  it("creates the booking_status_log table", async () => {
    const hasTable = await db.schema.hasTable("booking_status_log");
    expect(hasTable).toBe(true);

    const columns = await db.schema.raw(
      "PRAGMA table_info('booking_status_log')"
    );
    const colNames = columns.map((c: { name: string }) => c.name);
    expect(colNames).toContain("booking_id");
    expect(colNames).toContain("from_status");
    expect(colNames).toContain("to_status");
    expect(colNames).toContain("changed_by");
    expect(colNames).toContain("reason");
  });

  it("creates the recurrence_rules table", async () => {
    const hasTable = await db.schema.hasTable("recurrence_rules");
    expect(hasTable).toBe(true);

    const columns = await db.schema.raw(
      "PRAGMA table_info('recurrence_rules')"
    );
    const colNames = columns.map((c: { name: string }) => c.name);
    expect(colNames).toContain("frequency");
    expect(colNames).toContain("interval");
    expect(colNames).toContain("start_date");
    expect(colNames).toContain("end_date");
    expect(colNames).toContain("max_occurrences");
  });

  it("creates the uk_public_holidays table", async () => {
    const hasTable = await db.schema.hasTable("uk_public_holidays");
    expect(hasTable).toBe(true);

    const columns = await db.schema.raw(
      "PRAGMA table_info('uk_public_holidays')"
    );
    const colNames = columns.map((c: { name: string }) => c.name);
    expect(colNames).toContain("date");
    expect(colNames).toContain("name");
    expect(colNames).toContain("region");
  });

  it("seeds UK public holiday data", async () => {
    const holidays = await db("uk_public_holidays").select("*");
    expect(holidays.length).toBeGreaterThan(0);

    // Check a known holiday exists (New Year's Day 2026)
    const newYears = holidays.find(
      (h: { date: string; name: string }) =>
        h.date === "2026-01-01" && h.name === "New Year's Day"
    );
    expect(newYears).toBeDefined();
  });

  it("supports rollback of all migrations", async () => {
    const migrationSource = new VitestMigrationSource(migrationsDir);
    let rolled = true;
    try {
      await db.migrate.rollback({ migrationSource }, true);
      // Re-run migrations so other tests aren't affected
      await db.migrate.latest({ migrationSource });
    } catch {
      rolled = false;
    }
    expect(rolled).toBe(true);
  });

  it("seeds the initial admin user", async () => {
    const users = await db("users").select("*");
    // The seed migration should have created at least one user
    expect(users.length).toBeGreaterThanOrEqual(1);
    const admin = users.find(
      (u: { role: string }) => u.role === "admin"
    );
    expect(admin).toBeDefined();
  });
});
