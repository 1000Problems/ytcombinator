# TASK: Replace flat CPM with category-aware revenue model

## Problem

The current revenue estimation uses a hardcoded `$5 / 1000 views` flat rate across all keywords. This is wildly inaccurate. Real YouTube CPM varies from $0.25 (Made for Kids COPPA content) to $45+ (finance niche). For kids content specifically, the difference between "Made for Kids" and "Family/Educational" classification is 10-50x in revenue.

## Research findings (April 2026)

### COPPA is the single biggest variable

Content flagged "Made for Kids" on YouTube loses personalized ads entirely. CPM drops to $0.25-$3.00. Content classified as general/family (not exclusively for children under 13) gets normal CPM rates of $4-$25 depending on niche.

### CPM benchmarks by category (US audience)

| Category | Made for Kids CPM | Family/General CPM | Notes |
|----------|------------------|--------------------|-------|
| bedtime | $0.50 - $2.00 | $4.00 - $8.00 | High watch time, autoplay loops |
| fairy-tales | $0.30 - $1.50 | $3.00 - $7.00 | Evergreen, massive volume |
| moral | $1.00 - $3.00 | $6.00 - $12.00 | Parents love these, premium advertisers |
| educational | $1.50 - $3.00 | $10.00 - $25.00 | Highest CPM in kids space |
| animals | $0.50 - $2.00 | $4.00 - $8.00 | Great for animation |
| adventure | $0.30 - $1.50 | $3.00 - $7.00 | Longer watch time, older kids 4-8 |
| spanish | $0.15 - $0.80 | $1.50 - $4.00 | LatAm audience depresses CPM |
| compilation | $0.25 - $1.00 | $3.00 - $6.00 | Volume play, low per-view value |

### Region multipliers

| Region | Multiplier | Notes |
|--------|-----------|-------|
| US English | 1.00 | Baseline |
| US Spanish | 0.70 | US Hispanic audience, decent CPM |
| UK/Canada/Australia | 0.85 | Tier 1 English markets |
| Latin America | 0.25 | Large audience, low ad spend |
| India | 0.10 | Massive volume, very low CPM |
| Rest of world | 0.30 | Default |

### Sources
- https://www.lenostube.com/en/youtube-cpm-rpm-rates/
- https://pastory.app/articles/making-money-youtube-kids-channel/
- https://upgrowth.in/youtube-cpm-overview-highest-paying-niches-2026/
- https://www.notelm.ai/blog/youtube-cpm-rates-2026
- https://kidscreen.com/2025/10/27/how-kids-creators-are-making-youtube-work-again/
- https://air.io/en/youtube-hacks/coppa-20-and-gdpr-k-what-kids-creators-must-know-in-2026

## What to build

### 1. New database table: `category_cpm`

```sql
CREATE TABLE category_cpm (
  id              SERIAL PRIMARY KEY,
  category        VARCHAR(50) NOT NULL,
  coppa_flag      VARCHAR(20) NOT NULL DEFAULT 'made_for_kids',  -- 'made_for_kids' | 'family_general'
  cpm_low         DECIMAL(6,2) NOT NULL,
  cpm_mid         DECIMAL(6,2) NOT NULL,
  cpm_high        DECIMAL(6,2) NOT NULL,
  region          VARCHAR(20) NOT NULL DEFAULT 'us_en',
  source          TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, coppa_flag, region)
);
```

Seed it with the benchmark data from the table above. Every category in the keywords table should have at least a `us_en` + `made_for_kids` and `us_en` + `family_general` row.

### 2. Add `coppa_flag` column to `keywords` table

```sql
ALTER TABLE keywords ADD COLUMN coppa_flag VARCHAR(20) NOT NULL DEFAULT 'made_for_kids';
```

Default to `made_for_kids` (conservative estimate). Allow override per keyword.

### 3. Update revenue formula in GET /api/keywords

Current formula (in the SQL query):
```sql
CASE WHEN tv.top5_views_sum IS NOT NULL
  THEN ROUND(tv.top5_views_sum::numeric * 5 / 1000, 2)
  ELSE NULL END AS revenue_est
```

New formula — join to `category_cpm` and use `cpm_mid`:
```sql
CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_mid IS NOT NULL
  THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_mid / 1000, 2)
  ELSE NULL END AS revenue_est_low,
CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_mid IS NOT NULL
  THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_mid / 1000, 2)
  ELSE NULL END AS revenue_est,
CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_high IS NOT NULL
  THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_high / 1000, 2)
  ELSE NULL END AS revenue_est_high
```

Join: `LEFT JOIN category_cpm cc ON cc.category = k.category AND cc.coppa_flag = k.coppa_flag AND cc.region = 'us_en'`

This gives the dashboard three columns: low/mid/high revenue estimates instead of one fake number.

### 4. Update dashboard UI

In `app/dashboard/page.tsx`, update the revenue column to show range: `$X - $Y` using `revenue_est_low` and `revenue_est_high`, with `revenue_est` (mid) as the sort value.

Add a small COPPA toggle somewhere in the dashboard header — a switch between "Made for Kids" and "Family/General" that updates the `coppa_flag` default and recalculates all estimates. This is the single most impactful variable.

### 5. Seed script

Create `scripts/seed-cpm-benchmarks.ts` that inserts all the benchmark rows from the table above into `category_cpm`. Use `ON CONFLICT DO UPDATE` so it's idempotent and can be re-run as we refine numbers.

## Non-negotiables

- Never hardcode CPM values in application code. They must come from the database table.
- Default to `made_for_kids` (pessimistic). The user can toggle to `family_general` to see optimistic estimates.
- Keep the old `revenue_est` field working during transition — don't break the dashboard.
- The `category_cpm` table must be editable through a future admin UI (don't build the UI now, just make sure the data model supports it).

## Do NOT build

- Admin UI for editing CPM values (future task)
- Region-based multipliers in the SQL query (future task — document the multiplier table in code comments for now)
- Any COPPA compliance checking or YouTube API classification

## Test

After building, run the seed script, then hit `GET /api/keywords` and verify:
1. `revenue_est` values are different per category (not flat $5 anymore)
2. Changing `coppa_flag` on a keyword changes its revenue estimate
3. Categories without a `category_cpm` row fall back gracefully (NULL, not error)
