import knex from "knex";
import path from "path";

const env = process.env.NODE_ENV || "development";

const db = knex({
  client: "better-sqlite3",
  connection: {
    filename: path.resolve(
      env === "production" ? "data/production.sqlite3" : "data/dev.sqlite3"
    ),
  },
  useNullAsDefault: true,
  migrations: {
    directory: path.resolve("src/lib/db/migrations"),
    extension: "ts",
  },
});

export default db;
