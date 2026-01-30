import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("bookings", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table
      .uuid("tradesman_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .uuid("customer_id")
      .notNullable()
      .references("id")
      .inTable("customers")
      .onDelete("CASCADE");

    // Scheduling — stored as UK local time strings
    table.string("date", 10).notNullable(); // "YYYY-MM-DD"
    table.string("start_time", 5).notNullable(); // "HH:MM"
    table.string("end_time", 5).notNullable(); // "HH:MM"
    table.integer("duration_minutes").notNullable();

    // Status
    table
      .enum("status", [
        "pending",
        "confirmed",
        "in-progress",
        "completed",
        "cancelled",
        "no-show",
      ])
      .notNullable()
      .defaultTo("pending");

    // Booking details
    table.text("description");
    table.text("customer_notes");
    table.text("internal_notes");
    table.string("postcode", 20);

    // Recurrence
    table.uuid("recurrence_group_id");
    table.boolean("is_recurring").notNullable().defaultTo(false);

    // Multi-day
    table.uuid("multi_day_group_id");
    table.integer("multi_day_sequence");

    // Cancellation
    table.string("cancelled_by", 20);
    table.text("cancellation_reason");
    table.timestamp("cancelled_at");

    // Audit
    table.uuid("created_by");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(["tradesman_id", "date"]);
    table.index(["tradesman_id", "status"]);
    table.index("customer_id");
    table.index("recurrence_group_id");
    table.index("multi_day_group_id");
    table.index("date");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("bookings");
}
