import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("booking_status_log", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table
      .uuid("booking_id")
      .notNullable()
      .references("id")
      .inTable("bookings")
      .onDelete("CASCADE");
    table.string("from_status", 20);
    table.string("to_status", 20).notNullable();
    table.uuid("changed_by");
    table.text("reason");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index("booking_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("booking_status_log");
}
