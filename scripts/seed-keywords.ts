/**
 * Seed the keywords table with an initial set of keywords.
 * Edit the SEEDS array below to customize your starting keyword list.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/seed-keywords.ts
 */

import { Pool } from "@neondatabase/serverless";

// ── Seed keywords ────────────────────────────────────────────────────────────
// Format: [keyword, category, is_targeted]

const SEEDS: [string, string, boolean][] = [
  // React / Next.js
  ["react tutorial 2024", "react", true],
  ["nextjs tutorial", "nextjs", true],
  ["react server components", "react", true],
  ["nextjs app router", "nextjs", true],
  ["react hooks tutorial", "react", false],
  ["nextjs api routes", "nextjs", false],
  ["react state management", "react", false],
  ["react vs vue 2024", "react", false],

  // TypeScript
  ["typescript tutorial", "typescript", true],
  ["typescript for beginners", "typescript", false],
  ["typescript generics", "typescript", false],
  ["typescript vs javascript", "typescript", false],

  // Web development
  ["tailwind css tutorial", "css", false],
  ["web development roadmap 2024", "webdev", false],
  ["fullstack project tutorial", "webdev", false],
  ["deploy nextjs vercel", "deployment", true],

  // YouTube / content creation
  ["youtube automation", "youtube", true],
  ["youtube seo tips", "youtube", true],
  ["youtube thumbnail design", "youtube", false],
  ["youtube algorithm 2024", "youtube", false],
  ["vidiq alternative", "youtube", true],
  ["youtube keyword research", "youtube", true],

  // Programming general
  ["learn to code 2024", "general", false],
  ["coding project ideas", "general", false],
  ["ai coding tools", "ai", false],
  ["github copilot tutorial", "ai", false],

  // Node.js / backend
  ["nodejs tutorial", "node", false],
  ["rest api tutorial", "backend", false],
  ["postgresql tutorial", "database", false],
  ["prisma vs drizzle", "database", false],

  // Trending / competitive
  ["build a saas", "saas", true],
  ["saas starter template", "saas", false],
  ["indie hacker", "saas", false],
  ["side project ideas 2024", "general", false],

  // Long-tail
  ["how to build a youtube dashboard", "youtube", true],
  ["youtube analytics api tutorial", "youtube", true],
  ["neon database tutorial", "database", true],
  ["vercel cron jobs", "deployment", false],
  ["youtube data api v3", "youtube", true],
  ["react data table component", "react", false],
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });

  console.log(`[seed] Inserting ${SEEDS.length} keywords...`);
  let inserted = 0;
  let skipped = 0;

  for (const [keyword, category, isTargeted] of SEEDS) {
    try {
      const result = await pool.query(
        `INSERT INTO keywords (keyword, category, is_targeted)
         VALUES ($1, $2, $3)
         ON CONFLICT (keyword) DO NOTHING`,
        [keyword.toLowerCase(), category, isTargeted]
      );
      if (result.rowCount && result.rowCount > 0) {
        inserted++;
        console.log(`  \u2713 ${keyword} [${category}]${isTargeted ? " \u2605" : ""}`);
      } else {
        skipped++;
        console.log(`  \u25CB ${keyword} (already exists)`);
      }
    } catch (err) {
      skipped++;
      console.warn(`  \u2717 ${keyword}: ${err}`);
    }
  }

  await pool.end();
  console.log(`[seed] Done. Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
