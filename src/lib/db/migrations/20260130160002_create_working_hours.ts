import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("working_hours", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table
      .uuid("tradesman_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.integer("day_of_week").notNullable(); // 0=Monday ... 6=Sunday (ISO 8601)
    table.string("start_time", 5).notNullable(); // "HH:MM" local UK time
    table.string("end_time", 5).notNullable(); // "HH:MM" local UK time
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index(["tradesman_id", "day_of_week"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("working_hours");
}
