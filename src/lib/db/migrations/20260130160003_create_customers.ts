import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("customers", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table.string("email", 255).notNullable();
    table.string("name", 255).notNullable();
    table.string("phone", 50);
    table.string("postcode", 20);
    table.boolean("is_anonymised").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());

    table.index("email");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("customers");
}
