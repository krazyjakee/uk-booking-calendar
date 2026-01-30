import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("tradesman_profiles", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table
      .uuid("user_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("business_name", 255);
    table.string("phone", 50);
    table.integer("buffer_minutes").notNullable().defaultTo(0);
    table.integer("cancellation_notice_hours").notNullable().defaultTo(24);
    table.string("service_area_centre", 20);
    table.float("service_area_radius_miles");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("tradesman_profiles");
}
