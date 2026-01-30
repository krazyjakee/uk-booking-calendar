import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("chatbot_settings", (table) => {
    table.uuid("id").primary().defaultTo(knex.fn.uuid());
    table
      .uuid("tradesman_id")
      .notNullable()
      .unique()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.text("gemini_api_key_encrypted");
    table.string("gemini_api_key_iv", 32);
    table.string("gemini_api_key_tag", 32);
    table.text("greeting_message").notNullable().defaultTo("Hello! How can I help you today?");
    table.text("system_prompt_override");
    table.string("model_name", 100).notNullable().defaultTo("gemini-2.0-flash");
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("chatbot_settings");
}
