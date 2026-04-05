/**
 * Seed 50 kids YouTube keywords for channel research.
 * Niche: real woman narrator + animated stories for children.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx scripts/seed-kids-keywords.ts
 */

import { Pool } from "@neondatabase/serverless";

// ── Kids YouTube Keywords ────────────────────────────────────────────────────
// Format: [keyword, category, is_targeted]
// is_targeted = true → core niche we're competing in directly

const SEEDS: [string, string, boolean][] = [
  // ── Bedtime stories (highest retention, parents autoplay) ──────────────
  ["bedtime stories for kids", "bedtime", true],
  ["bedtime stories for toddlers", "bedtime", true],
  ["5 minute bedtime story", "bedtime", true],
  ["animated bedtime stories", "bedtime", true],
  ["bedtime stories for kids in english", "bedtime", true],
  ["sleep stories for children", "bedtime", true],
  ["calming stories for kids", "bedtime", true],
  ["long bedtime stories for kids", "bedtime", false],

  // ── Fairy tales & classic stories (evergreen, massive search volume) ───
  ["fairy tales for kids", "fairy-tales", true],
  ["animated fairy tales", "fairy-tales", true],
  ["princess stories for kids", "fairy-tales", true],
  ["cinderella story for children", "fairy-tales", false],
  ["three little pigs story", "fairy-tales", false],
  ["rapunzel story for kids", "fairy-tales", false],
  ["little red riding hood animated", "fairy-tales", false],
  ["goldilocks and the three bears", "fairy-tales", false],

  // ── Moral stories (parents love these, high CPM) ──────────────────────
  ["moral stories for kids", "moral", true],
  ["moral stories for kids in english", "moral", true],
  ["kindness stories for children", "moral", true],
  ["stories about sharing for kids", "moral", true],
  ["honesty stories for kids", "moral", false],
  ["stories about being brave for kids", "moral", false],
  ["animated moral stories", "moral", true],

  // ── Educational stories (ABCs, counting, colors — high ad value) ──────
  ["learning stories for kids", "educational", true],
  ["abc stories for toddlers", "educational", true],
  ["counting stories for kids", "educational", false],
  ["colors learning story for kids", "educational", false],
  ["shapes story for toddlers", "educational", false],
  ["phonics stories for kids", "educational", true],
  ["educational cartoons for toddlers", "educational", false],

  // ── Animal stories (kids love animals, great for animation) ───────────
  ["animal stories for kids", "animals", true],
  ["dinosaur stories for kids", "animals", true],
  ["dog stories for children", "animals", false],
  ["ocean animal stories for kids", "animals", false],
  ["jungle stories for kids animated", "animals", true],

  // ── Adventure / action stories (older kids 4-8, longer watch time) ────
  ["adventure stories for kids", "adventure", true],
  ["superhero stories for kids", "adventure", false],
  ["pirate stories for children", "adventure", false],
  ["space stories for kids", "adventure", true],
  ["treasure hunt story for kids", "adventure", false],

  // ── Spanish / bilingual (massive underserved market, your edge) ───────
  ["cuentos para niños en español", "spanish", true],
  ["cuentos infantiles para dormir", "spanish", true],
  ["cuentos animados para niños", "spanish", true],
  ["bilingual stories for kids english spanish", "spanish", true],
  ["cuentos de hadas para niños", "spanish", false],

  // ── Format / compilation keywords (algorithm favorites) ───────────────
  ["kids stories compilation", "compilation", false],
  ["1 hour kids stories", "compilation", true],
  ["stories for kids to watch", "compilation", false],
  ["cartoon stories for kids", "compilation", false],
  ["animated stories for children", "compilation", true],
  ["story time for kids", "compilation", true],
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });

  console.log(`[seed] Inserting ${SEEDS.length} kids keywords...`);
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
        console.log(`  ✓ ${keyword} [${category}]${isTargeted ? " ★" : ""}`);
      } else {
        skipped++;
        console.log(`  ○ ${keyword} (already exists)`);
      }
    } catch (err) {
      skipped++;
      console.warn(`  ✗ ${keyword}: ${err}`);
    }
  }

  await pool.end();
  console.log(`\n[seed] Done. Inserted: ${inserted}, Skipped: ${skipped}`);
  console.log(`[seed] Next step: run collection via POST /api/collect or wait for daily cron.`);
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
