import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("recurrence_rules", (table) => {
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
    table
      .enum("frequency", ["daily", "weekly", "fortnightly", "monthly"])
      .notNullable();
    table.integer("interval").notNullable().defaultTo(1);
    table.string("start_date", 10).notNullable();
    table.string("end_date", 10);
    table.integer("max_occurrences");
    table.string("start_time", 5).notNullable();
    table.string("end_time", 5).notNullable();
    table.text("description");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("recurrence_rules");
}
