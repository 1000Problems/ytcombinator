# TASK: Video Analyzer — Paste a YouTube URL, Get vidIQ-Style Stats

## Summary

New `/analyze` page where you paste a YouTube video URL and get a full breakdown: video stats, channel stats, SEO score, revenue estimates, and an outlier rating. Analyzed videos are saved and displayed in a ranked history table sorted by estimated monthly revenue.

This replicates the core vidIQ Chrome extension scorecard as a web tool, using only the YouTube Data API v3 (no scraping, no OAuth).

---

## Part 1: Database

### 1A. New table: `analyzed_videos`

**File:** `scripts/migrate.sql` (append)

```sql
CREATE TABLE IF NOT EXISTS analyzed_videos (
  id              SERIAL PRIMARY KEY,
  video_id        VARCHAR(64) NOT NULL UNIQUE,
  channel_id      VARCHAR(64) NOT NULL,
  channel_name    VARCHAR(255),
  channel_subs    BIGINT,
  channel_views   BIGINT,
  channel_videos  INT,
  video_title     VARCHAR(500),
  video_description TEXT,
  video_tags      TEXT[],
  video_category  VARCHAR(100),
  youtube_category_id INT,
  duration_seconds INT,
  published_at    TIMESTAMPTZ,
  view_count      BIGINT,
  like_count      BIGINT,
  comment_count   BIGINT,
  thumbnail_url   VARCHAR(1000),
  -- Computed metrics (calculated at analysis time)
  engagement_rate   DECIMAL(8,4),     -- (likes + comments) / views * 100
  views_per_day     DECIMAL(12,2),    -- views / days since publish
  est_monthly_views BIGINT,           -- views_per_day * 30
  outlier_score     DECIMAL(8,2),     -- view_count / (channel_views / channel_videos)
  seo_score         INT,              -- 0-100
  -- Revenue estimates (using category_cpm at analysis time)
  revenue_region    VARCHAR(20) DEFAULT 'us_en',
  revenue_coppa     VARCHAR(20) DEFAULT 'made_for_kids',
  revenue_est_low   DECIMAL(10,2),
  revenue_est_mid   DECIMAL(10,2),
  revenue_est_high  DECIMAL(10,2),
  annual_est        DECIMAL(12,2),    -- revenue_est_mid * 12
  -- Metadata
  analyzed_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analyzed_videos_channel
  ON analyzed_videos(channel_id);

CREATE INDEX IF NOT EXISTS idx_analyzed_videos_revenue
  ON analyzed_videos(revenue_est_mid DESC NULLS LAST);
```

Run the migration:
```bash
DATABASE_URL=$DATABASE_URL npx tsx scripts/run-migrate.mjs
```

---

## Part 2: API

### 2A. New route: `POST /api/analyze`

**File:** `app/api/analyze/route.ts`

**Auth:** Same session/cookie check as other API routes (middleware already covers `/dashboard` but this route needs protection too — either add `/analyze` to the middleware matcher or check auth inline).

**Request body:**
```json
{ "url": "https://www.youtube.com/watch?v=VIDEO_ID", "region": "us_en", "coppa_flag": "made_for_kids" }
```

**Steps:**

1. **Parse the video ID** from the URL. Support these formats:
   - `youtube.com/watch?v=VIDEO_ID`
   - `youtu.be/VIDEO_ID`
   - `youtube.com/shorts/VIDEO_ID`
   - Raw 11-char video ID string
   - Return 400 if unparseable.

2. **Call `videos.list`** with `part=snippet,statistics,contentDetails` and the parsed ID. Cost: 1 + 2 + 2 + 2 = 7 units. If the video doesn't exist, return 404.

3. **Call `channels.list`** with `part=snippet,statistics` and the channel ID from step 2. Cost: 1 + 2 + 2 = 5 units.

   Total quota per analysis: **12 units**. Update `quota-budget.ts` with a new constant:
   ```typescript
   ANALYZE_COST: 12, // videos.list(snippet+stats+contentDetails) + channels.list(snippet+stats)
   ```

4. **Map YouTube category to our category.** YouTube has numeric category IDs (1=Film, 2=Autos, 10=Music, 22=People & Blogs, 24=Entertainment, 25=News, 27=Education, etc.). Build a mapping object in a new file `lib/category-map.ts`:

   ```typescript
   export const YOUTUBE_TO_YTC_CATEGORY: Record<number, string> = {
     1: "adventure",       // Film & Animation
     2: "adventure",       // Autos & Vehicles
     10: "compilation",    // Music
     15: "animals",        // Pets & Animals
     17: "adventure",      // Sports
     22: "moral",          // People & Blogs
     24: "adventure",      // Entertainment
     25: "educational",    // News & Politics
     26: "educational",    // Howto & Style
     27: "educational",    // Education
     28: "educational",    // Science & Technology
   };
   export const DEFAULT_CATEGORY = "educational";
   ```

   This mapping is approximate. Users can override via UI later.

5. **Look up CPM** from `category_cpm` table using the mapped category + region + coppa_flag params.

6. **Compute all metrics:**

   ```typescript
   const daysSincePublish = Math.max(1, Math.floor((Date.now() - publishedAt.getTime()) / 86400000));
   const viewsPerDay = viewCount / daysSincePublish;
   const estMonthlyViews = Math.round(viewsPerDay * 30);
   const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;
   const avgViewsPerVideo = channelVideoCount > 0 ? channelViewCount / channelVideoCount : 0;
   const outlierScore = avgViewsPerVideo > 0 ? viewCount / avgViewsPerVideo : 0;
   const revenueEstLow = estMonthlyViews * cpmLow / 1000;
   const revenueEstMid = estMonthlyViews * cpmMid / 1000;
   const revenueEstHigh = estMonthlyViews * cpmHigh / 1000;
   const annualEst = revenueEstMid * 12;
   ```

7. **Compute SEO score** (0-100). Score these factors:

   | Factor | Points | Condition |
   |--------|--------|-----------|
   | Has tags | 15 | tags array length > 0 |
   | Tag count | 10 | 10+ tags |
   | Title length | 15 | 30-70 characters |
   | Description length | 15 | 200+ characters |
   | Description has links | 10 | contains `http` |
   | Description has timestamps | 10 | matches `/\d{1,2}:\d{2}/` |
   | Has category | 10 | category is set |
   | Title has keyword-like structure | 15 | contains `|` or `-` or `—` (separator pattern common in SEO titles) |

8. **Upsert into `analyzed_videos`** using `ON CONFLICT (video_id) DO UPDATE SET ...` so re-analyzing the same video refreshes the data.

9. **Return the full analyzed record** as JSON with status 200.

### 2B. New route: `GET /api/analyze`

**File:** `app/api/analyze/route.ts` (same file)

Returns all analyzed videos, sorted by `revenue_est_mid DESC` by default.

**Query params:**
- `sort`: column to sort by (default `revenue_est_mid`). Allow: `revenue_est_mid`, `view_count`, `outlier_score`, `seo_score`, `engagement_rate`, `analyzed_at`
- `dir`: `asc` or `desc` (default `desc`)

**SQL:**
```sql
SELECT * FROM analyzed_videos ORDER BY ${sort} ${dir} NULLS LAST
```

Validate the sort column against an allowlist to prevent injection. Return `{ videos: [...], count: N }`.

### 2C. New route: `DELETE /api/analyze/[id]`

**File:** `app/api/analyze/[id]/route.ts`

Delete an analyzed video by its DB id. Return 204.

---

## Part 3: Frontend

### 3A. New page: `/analyze`

**File:** `app/analyze/page.tsx`

**Layout:** Same chrome as `/dashboard` — header with app title, theme toggle, language toggle, logout link. Re-use the existing patterns from `app/dashboard/page.tsx`.

**URL Input Section (top of page):**

A single input field with a submit button. Placeholder: "Paste a YouTube video URL..." Submit triggers `POST /api/analyze`. While loading, show a spinner or pulse animation on the input. On error, show inline error text below the input (red, small font).

Include a region picker and COPPA toggle next to the input, identical in style to the ones on the dashboard. These get passed in the POST body so the revenue estimate uses the right CPM.

**Video Card (shown after successful analysis):**

After the POST returns, display a card for the just-analyzed video at the top. The card has two sections side by side:

**Left: Video Info**
- Thumbnail (from API, link to YouTube)
- Title (bold, truncated to 2 lines)
- Channel name + subscriber count
- Published date + video duration
- Video tags (pill badges, scrollable row, max 10 shown)

**Right: Metrics Grid (2×4 grid)**

| Metric | Value |
|--------|-------|
| Est. Monthly Revenue | $X,XXX (range: low-high) |
| Annual Projection | $XX,XXX |
| Views Per Day | X,XXX |
| Outlier Score | X.Xx (color: green >2x, yellow 0.5-2x, red <0.5x) |
| Engagement Rate | X.XX% |
| SEO Score | XX/100 (with color bar) |
| Total Views | X,XXX,XXX |
| Likes / Comments | X,XXX / XXX |

Use `formatCurrency` for revenue numbers (import from dashboard or extract to a shared util). Use `Intl.NumberFormat` for view counts.

### 3B. History Table (below the card)

Load all previously analyzed videos via `GET /api/analyze` on page mount. Display as a sortable table, same pattern as the keyword table on the dashboard.

**Columns:**

| Thumbnail | Title | Channel | Views | Est. Monthly ($) | Annual ($) | Outlier | SEO | Engagement | Analyzed |
|-----------|-------|---------|-------|-------------------|------------|---------|-----|------------|----------|

Default sort: Est. Monthly ($) descending. All columns sortable by clicking headers (same `toggleSort` pattern as dashboard).

Each row has a small delete button (trash icon) on the right. Clicking it calls `DELETE /api/analyze/[id]` and removes the row from state.

Clicking a row opens the full video card above (same as after a fresh analysis) so you can review details without re-fetching from YouTube.

### 3C. Navigation

Add an "Analyze" link in the dashboard header (or a shared nav component) so users can navigate between `/dashboard` and `/analyze`. Simple text link, not a full nav bar.

On the landing page (`app/page.tsx`), add an "Analyze" card/link alongside the existing dashboard entry point.

### 3D. Middleware update

**File:** `middleware.ts`

Add `/analyze` to the matcher so it requires authentication:

```typescript
export const config = {
  matcher: ["/dashboard/:path*", "/analyze/:path*"],
};
```

### 3E. i18n strings

**File:** `lib/i18n.ts`

```typescript
// ── Analyze page ──
"analyze.title":          { en: "Video Analyzer", es: "Analizador de Videos" },
"analyze.subtitle":       { en: "Paste a YouTube URL to get estimated stats", es: "Pega una URL de YouTube para obtener estadísticas estimadas" },
"analyze.input_placeholder": { en: "Paste a YouTube video URL...", es: "Pega una URL de video de YouTube..." },
"analyze.button":         { en: "Analyze", es: "Analizar" },
"analyze.analyzing":      { en: "Analyzing...", es: "Analizando..." },
"analyze.error_invalid":  { en: "Could not parse a video ID from that URL", es: "No se pudo obtener un ID de video de esa URL" },
"analyze.error_not_found": { en: "Video not found on YouTube", es: "Video no encontrado en YouTube" },
"analyze.history_title":  { en: "Analyzed Videos", es: "Videos Analizados" },
"analyze.no_history":     { en: "No videos analyzed yet", es: "No hay videos analizados aún" },
"analyze.delete_confirm": { en: "Remove this video from history?", es: "¿Eliminar este video del historial?" },

"metric.est_monthly":     { en: "Est. Monthly Revenue", es: "Ingresos Mensuales Est." },
"metric.annual":          { en: "Annual Projection", es: "Proyección Anual" },
"metric.views_per_day":   { en: "Views / Day", es: "Vistas / Día" },
"metric.outlier":         { en: "Outlier Score", es: "Puntaje Outlier" },
"metric.engagement":      { en: "Engagement", es: "Engagement" },
"metric.seo_score":       { en: "SEO Score", es: "Puntaje SEO" },
"metric.total_views":     { en: "Total Views", es: "Vistas Totales" },
"metric.likes_comments":  { en: "Likes / Comments", es: "Likes / Comentarios" },

"th.thumbnail":           { en: "", es: "" },
"th.title":               { en: "Title", es: "Título" },
"th.channel":             { en: "Channel", es: "Canal" },
"th.views":               { en: "Views", es: "Vistas" },
"th.est_monthly":         { en: "Est. Monthly ($)", es: "Est. Mensual ($)" },
"th.annual_est":          { en: "Annual ($)", es: "Anual ($)" },
"th.outlier":             { en: "Outlier", es: "Outlier" },
"th.seo":                 { en: "SEO", es: "SEO" },
"th.engagement":          { en: "Engage %", es: "Engage %" },
"th.analyzed":            { en: "Analyzed", es: "Analizado" },

"nav.analyze":            { en: "Analyze", es: "Analizar" },
"nav.dashboard":          { en: "Dashboard", es: "Dashboard" },
```

---

## Part 4: Shared Utilities

### 4A. Extract `formatCurrency` to shared util

**File:** `lib/format.ts` (new)

Move `formatCurrency` from `app/dashboard/page.tsx` into a shared file. Import it in both dashboard and analyze pages. If there are other formatting helpers in the dashboard (number formatting, date formatting), move those too.

### 4B. Category mapping

**File:** `lib/category-map.ts` (new, see Part 2 step 4)

### 4C. Quota budget update

**File:** `lib/quota-budget.ts`

Add:
```typescript
ANALYZE_COST: 12, // videos.list(snippet+stats+contentDetails) + channels.list(snippet+stats)
```

---

## Files Modified (summary)

| File | Changes |
|------|---------|
| `scripts/migrate.sql` | Add `analyzed_videos` table + indexes |
| `app/api/analyze/route.ts` | New — POST (analyze video) + GET (list history) |
| `app/api/analyze/[id]/route.ts` | New — DELETE analyzed video |
| `app/analyze/page.tsx` | New — full analyze page with input, card, history table |
| `lib/category-map.ts` | New — YouTube category ID → YTC category mapping |
| `lib/format.ts` | New — shared formatCurrency + number formatting |
| `lib/quota-budget.ts` | Add ANALYZE_COST constant |
| `lib/i18n.ts` | Add ~30 analyze-related strings (en/es) |
| `middleware.ts` | Add `/analyze` to auth matcher |
| `app/dashboard/page.tsx` | Import formatCurrency from lib/format.ts, add nav link to /analyze |
| `app/page.tsx` | Add Analyze entry point link |

## Quota Impact

12 units per analysis. At 10,000 daily quota with 5,250 reserved for the collector, that leaves 4,750 for ad-hoc use — enough for ~395 video analyses per day. Realistically this feature gets used a few times per day.

## Validation

After deploying, verify:
1. Paste `https://www.youtube.com/watch?v=dQw4w9WgXcQ` — should return full stats card
2. Paste `youtu.be/dQw4w9WgXcQ` — same result (short URL format)
3. Paste garbage — should show 400 error inline
4. Paste a deleted/private video ID — should show 404 error inline
5. Re-analyze the same video — should update the existing row, not create a duplicate
6. History table shows all analyzed videos sorted by revenue descending
7. Click column headers to re-sort
8. Delete a video from history — row disappears
9. Switch region to LATAM — re-analyze same video, revenue should drop to ~25% of US/EN
10. SEO score reflects actual tag/description quality of the video
11. Outlier score for a viral video should be >> 1.0
12. `/analyze` redirects to login if not authenticated

## Commit message

```
Add video analyzer — paste YouTube URL, get vidIQ-style stats

- New /analyze page with URL input, video detail card, ranked history table
- POST /api/analyze: fetch video + channel data from YouTube API, compute
  engagement rate, outlier score, SEO score (0-100), revenue estimates
- GET /api/analyze: list all analyzed videos sorted by est. monthly revenue
- DELETE /api/analyze/[id]: remove from history
- analyzed_videos table with computed metrics and CPM-based revenue
- YouTube category ID → YTC category mapping for CPM lookup
- Shared formatCurrency util extracted from dashboard
- i18n strings for all new UI elements (en/es)
- Quota cost: 12 units per analysis (videos.list + channels.list)
```
