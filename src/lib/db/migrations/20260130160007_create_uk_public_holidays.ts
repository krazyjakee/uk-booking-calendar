import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("uk_public_holidays", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("date", 10).notNullable().unique();
    table.string("name", 255).notNullable();
    table.string("region", 50).notNullable().defaultTo("england-and-wales");
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("uk_public_holidays");
}
