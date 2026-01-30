import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("chat_messages", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table
      .uuid("tradesman_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.string("customer_name", 255).notNullable();
    table.string("customer_email", 255).notNullable();
    table.string("customer_phone", 50);
    table.text("message").notNullable();
    table.boolean("is_read").notNullable().defaultTo(false);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());

    table.index("tradesman_id");
    table.index(["tradesman_id", "is_read"]);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("chat_messages");
}
