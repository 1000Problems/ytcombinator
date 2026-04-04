/**
 * Run the schema migration against Neon.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/migrate.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { Pool } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const migrationPath = resolve(__dirname, "migrate.sql");
  const migration = readFileSync(migrationPath, "utf-8");

  console.log("[migrate] Running migration...");

  try {
    // Execute the entire migration as one statement block.
    // All statements use IF NOT EXISTS / IF EXISTS, so this is idempotent.
    await pool.query(migration);
    console.log("[migrate] Done \u2014 all tables and indexes created.");
  } catch (err) {
    console.error("[migrate] Migration failed:", err);
    await pool.end();
    process.exit(1);
  }

  await pool.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
