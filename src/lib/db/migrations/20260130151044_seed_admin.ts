import type { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function up(knex: Knex): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_SEED_PASSWORD || "changeme";

  const existing = await knex("users").where({ email }).first();
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);

  await knex("users").insert({
    email,
    password_hash: passwordHash,
    name: "Admin",
    role: "admin",
    is_active: true,
  });
}

export async function down(knex: Knex): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL || "admin@example.com";
  await knex("users").where({ email, role: "admin" }).del();
}
