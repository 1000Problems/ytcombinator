/**
 * Standalone keyword collector script.
 * Run by GitHub Actions on a daily cron schedule.
 *
 * Usage:
 *   npx tsx scripts/collect.ts
 *
 * Required env vars:
 *   DATABASE_URL     — Neon PostgreSQL connection string
 *   YOUTUBE_API_KEY  — YouTube Data API v3 key
 */

import { runCollection, logCollection, QuotaExceededError } from "../lib/collector";

async function main() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY is not set. Aborting.");
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Aborting.");
    process.exit(1);
  }

  console.log(`[collect] Starting keyword collection at ${new Date().toISOString()}`);
  const startTime = Date.now();

  const result = await runCollection(apiKey);
  const durationMs = Date.now() - startTime;

  // Log to database
  try {
    await logCollection(result, durationMs);
  } catch (logErr) {
    console.error("[collect] Failed to write collection log:", logErr);
  }

  // Console output for GitHub Actions logs
  console.log(`[collect] Completed in ${durationMs}ms`);
  console.log(`[collect] Keywords queried: ${result.keywordsQueried}`);
  console.log(`[collect] Quota used: ${result.quotaUsed}`);

  if (result.errors.length > 0) {
    console.warn(`[collect] Errors (${result.errors.length}):`);
    for (const err of result.errors) {
      console.warn(`  - ${err}`);
    }
  }

  if (result.abortReason === "quota_exceeded") {
    console.log("[collect] Exiting normally — quota reached, remaining keywords deferred to next run.");
    process.exit(0);
  }

  if (result.abortReason === "infra_error") {
    console.error("[collect] Exiting with error — infrastructure failure.");
    process.exit(1);
  }

  console.log("[collect] Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("[collect] Unhandled error:", err);
  process.exit(1);
});
