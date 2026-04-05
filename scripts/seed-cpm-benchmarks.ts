/**
 * Seed category CPM benchmarks into the category_cpm table.
 * Uses ON CONFLICT DO UPDATE so it's idempotent — safe to re-run as numbers are refined.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/seed-cpm-benchmarks.ts
 *
 * Sources (April 2026):
 *   - lenostube.com/en/youtube-cpm-rpm-rates/
 *   - pastory.app/articles/making-money-youtube-kids-channel/
 *   - upgrowth.in/youtube-cpm-overview-highest-paying-niches-2026/
 *   - notelm.ai/blog/youtube-cpm-rates-2026
 *   - kidscreen.com/2025/10/27/how-kids-creators-are-making-youtube-work-again/
 */

import { Pool } from "@neondatabase/serverless";

// [category, coppa_flag, cpm_low, cpm_mid, cpm_high, region]
const BENCHMARKS: [string, string, number, number, number, string][] = [
  // ── Made for Kids (COPPA — no personalized ads) ──────────────────────
  ["bedtime",      "made_for_kids", 0.50, 1.25, 2.00, "us_en"],
  ["fairy-tales",  "made_for_kids", 0.30, 0.90, 1.50, "us_en"],
  ["moral",        "made_for_kids", 1.00, 2.00, 3.00, "us_en"],
  ["educational",  "made_for_kids", 1.50, 2.25, 3.00, "us_en"],
  ["animals",      "made_for_kids", 0.50, 1.25, 2.00, "us_en"],
  ["adventure",    "made_for_kids", 0.30, 0.90, 1.50, "us_en"],
  ["spanish",      "made_for_kids", 0.15, 0.48, 0.80, "us_en"],
  ["compilation",  "made_for_kids", 0.25, 0.63, 1.00, "us_en"],

  // ── Family/General (not COPPA — full ad personalization) ─────────────
  ["bedtime",      "family_general", 4.00, 6.00,  8.00, "us_en"],
  ["fairy-tales",  "family_general", 3.00, 5.00,  7.00, "us_en"],
  ["moral",        "family_general", 6.00, 9.00, 12.00, "us_en"],
  ["educational",  "family_general", 10.00, 17.50, 25.00, "us_en"],
  ["animals",      "family_general", 4.00, 6.00,  8.00, "us_en"],
  ["adventure",    "family_general", 3.00, 5.00,  7.00, "us_en"],
  ["spanish",      "family_general", 1.50, 2.75,  4.00, "us_en"],
  ["compilation",  "family_general", 3.00, 4.50,  6.00, "us_en"],
];

const SOURCE = "lenostube.com, pastory.app, upgrowth.in, notelm.ai, kidscreen.com (April 2026)";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });

  console.log(`[seed-cpm] Upserting ${BENCHMARKS.length} CPM benchmark rows...`);
  let upserted = 0;

  for (const [category, coppaFlag, cpmLow, cpmMid, cpmHigh, region] of BENCHMARKS) {
    try {
      await pool.query(
        `INSERT INTO category_cpm (category, coppa_flag, cpm_low, cpm_mid, cpm_high, region, source, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (category, coppa_flag, region)
         DO UPDATE SET
           cpm_low = EXCLUDED.cpm_low,
           cpm_mid = EXCLUDED.cpm_mid,
           cpm_high = EXCLUDED.cpm_high,
           source = EXCLUDED.source,
           updated_at = NOW()`,
        [category, coppaFlag, cpmLow, cpmMid, cpmHigh, region, SOURCE]
      );
      upserted++;
      console.log(`  ✓ ${category} / ${coppaFlag}: $${cpmLow} - $${cpmMid} - $${cpmHigh}`);
    } catch (err) {
      console.warn(`  ✗ ${category} / ${coppaFlag}: ${err}`);
    }
  }

  await pool.end();
  console.log(`\n[seed-cpm] Done. Upserted: ${upserted} / ${BENCHMARKS.length}`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
