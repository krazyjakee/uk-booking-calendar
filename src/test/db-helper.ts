import knex, { type Knex } from "knex";
import path from "path";
import fs from "fs";

let testDb: Knex | null = null;

/**
 * Custom migration source that uses dynamic import() instead of require().
 * This is necessary because Vitest's Vite transform pipeline handles import()
 * but not require(), and knex's default migration loading uses require().
 */
export class VitestMigrationSource {
  private migrationsDir: string;

  constructor(migrationsDir: string) {
    this.migrationsDir = migrationsDir;
  }

  async getMigrations(): Promise<string[]> {
    const files = fs.readdirSync(this.migrationsDir);
    return files
      .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .sort();
  }

  getMigrationName(migration: string): string {
    return migration;
  }

  async getMigration(migration: string): Promise<Knex.Migration> {
    const filePath = path.join(this.migrationsDir, migration);
    const mod = await import(filePath);
    return mod;
  }
}

/**
 * Creates an in-memory SQLite database for testing.
 * Runs all migrations so the schema matches production.
 */
export async function getTestDb(): Promise<Knex> {
  if (testDb) return testDb;

  testDb = knex({
    client: "better-sqlite3",
    connection: { filename: ":memory:" },
    useNullAsDefault: true,
  });

  const migrationsDir = path.resolve("src/lib/db/migrations");
  await testDb.migrate.latest({
    migrationSource: new VitestMigrationSource(migrationsDir),
  });

  return testDb;
}

/**
 * Destroys the test database connection.
 */
export async function destroyTestDb(): Promise<void> {
  if (testDb) {
    await testDb.destroy();
    testDb = null;
  }
}

/**
 * Clears all rows from the specified tables (preserving schema).
 */
export async function clearTables(
  db: Knex,
  tables: string[]
): Promise<void> {
  for (const table of tables) {
    await db(table).del();
  }
}
