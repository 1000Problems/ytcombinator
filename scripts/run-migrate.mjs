/**
 * Post-build migration runner.
 * Runs the idempotent migrate.sql against Neon on every deploy.
 * Uses dynamic import so it works after `next build` compiles node_modules.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("[migrate] DATABASE_URL not set — skipping migration (dev mode).");
    return;
  }

  const { Pool } = await import("@neondatabase/serverless");
  const pool = new Pool({ connectionString: url });
  const sql = readFileSync(resolve(__dirname, "migrate.sql"), "utf-8");

  console.log("[migrate] Running post-build migration...");
  try {
    await pool.query(sql);
    console.log("[migrate] Done — schema up to date.");
  } catch (err) {
    // Non-fatal: log and continue so the deploy isn't blocked
    console.error("[migrate] Migration error (non-fatal):", err.message ?? err);
  } finally {
    await pool.end();
  }
}

main();
