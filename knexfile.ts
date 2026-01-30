import type { Knex } from "knex";
import path from "path";

const config: Record<string, Knex.Config> = {
  development: {
    client: "better-sqlite3",
    connection: {
      filename: path.resolve("data/dev.sqlite3"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve("src/lib/db/migrations"),
      extension: "ts",
    },
  },

  production: {
    client: "better-sqlite3",
    connection: {
      filename: path.resolve("data/production.sqlite3"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve("src/lib/db/migrations"),
      extension: "ts",
    },
  },
};

export default config;
