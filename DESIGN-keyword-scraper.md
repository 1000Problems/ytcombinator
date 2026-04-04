# Design: YouTube Keyword Scraper MVP

## Goal

Build a daily data collection pipeline that scrapes YouTube's search.list API to populate a keyword research database. No users yet — this is about accumulating data so that when the product launches, keyword identification and difficulty/volume analysis are already populated.

## Target Features

1. **Advanced Keyword Identification** — Given a topic, return ranked related keywords by opportunity.
2. **Keyword Difficulty & Volume Analysis** — Score each keyword on volume (demand) and difficulty (competition).

## Data Sources

### YouTube Data API v3 (requires API key, no OAuth)

| Endpoint | Quota Cost | Data Returned |
|----------|-----------|---------------|
| `search.list` | 100 units | `totalResults` (volume proxy), top 50 results with videoId, title, channelId, publishedAt |
| `videos.list` | 1 unit (up to 50 IDs per call) | viewCount, likeCount, commentCount, duration, tags |
| `channels.list` | 1 unit (up to 50 IDs per call) | subscriberCount, videoCount |

### YouTube Autocomplete (free, no API key, no quota)

| Endpoint | Cost | Data Returned |
|----------|------|---------------|
| `GET https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=KEYWORD` | 0 | Array of autocomplete suggestions (real user search behavior) |

## Quota Budget (10,000 units/day)

| Phase | Endpoint | Units Per Keyword | Description |
|-------|----------|-------------------|-------------|
| Search | `search.list` | 100 | Fetch top 50 results + totalResults count |
| Enrich videos | `videos.list` | 1 | Batch 50 video IDs per call |
| Enrich channels | `channels.list` | ~1 | Batch deduplicated channel IDs (often <50 unique per search) |
| Autocomplete | suggestqueries | 0 | Free endpoint, no quota |
| **Total per keyword** | | **~102** | |

**Daily throughput: ~95 fully analyzed keywords** within 10K quota.

Over 30 days: ~2,850 keywords with scores.

## Database Schema

### `keywords`

The keyword queue. Every keyword we want to track lives here. Grows over time from seed list + autocomplete expansion.

```sql
CREATE TABLE keywords (
  id              SERIAL PRIMARY KEY,
  keyword         VARCHAR(500) NOT NULL UNIQUE,
  category        VARCHAR(100),           -- niche grouping (e.g., 'programming', 'gaming', 'finance')
  source          VARCHAR(50) NOT NULL,    -- 'seed', 'autocomplete', 'tags'
  parent_id       INT REFERENCES keywords(id), -- which keyword spawned this one (for autocomplete/tag expansion)
  priority        INT DEFAULT 50,          -- 1-100, higher = scraped sooner
  total_results   BIGINT,                  -- latest totalResults from search.list (volume proxy)
  volume_score    DECIMAL(5,2),            -- computed: normalized 0-100
  difficulty_score DECIMAL(5,2),           -- computed: normalized 0-100
  opportunity_score DECIMAL(5,2),          -- computed: volume_score / difficulty_score
  last_searched_at TIMESTAMPTZ,            -- when we last ran search.list for this keyword
  search_count    INT DEFAULT 0,           -- how many times we've searched this keyword
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_keywords_priority ON keywords(priority DESC, last_searched_at ASC NULLS FIRST);
CREATE INDEX idx_keywords_opportunity ON keywords(opportunity_score DESC NULLS LAST);
```

### `search_snapshots`

One row per keyword per day. Tracks how totalResults changes over time (trending signal).

```sql
CREATE TABLE search_snapshots (
  id              SERIAL PRIMARY KEY,
  keyword_id      INT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  total_results   BIGINT NOT NULL,         -- YouTube's estimated total matching videos
  snapshot_date   DATE NOT NULL,
  avg_views_top50 BIGINT,                  -- average view count of top 50 results
  avg_likes_top50 BIGINT,                  -- average likes of top 50 results
  avg_channel_subs BIGINT,                 -- average subscriber count of channels in top 50
  title_match_count INT,                   -- how many of top 50 have exact keyword in title
  avg_video_age_days INT,                  -- average age of top 50 videos in days
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(keyword_id, snapshot_date)
);

CREATE INDEX idx_snapshots_keyword_date ON search_snapshots(keyword_id, snapshot_date DESC);
```

### `search_results`

Individual video results per keyword search. Tracks rank position over time.

```sql
CREATE TABLE search_results (
  id              SERIAL PRIMARY KEY,
  keyword_id      INT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  video_id        VARCHAR(20) NOT NULL,    -- YouTube video ID (e.g., 'dQw4w9WgXcQ')
  rank_position   INT NOT NULL,            -- 1-50, position in search results
  snapshot_date   DATE NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(keyword_id, video_id, snapshot_date)
);

CREATE INDEX idx_search_results_video ON search_results(video_id);
CREATE INDEX idx_search_results_keyword_date ON search_results(keyword_id, snapshot_date DESC);
```

### `video_cache`

Enriched video data from videos.list. Refreshed at most once per 24 hours.

```sql
CREATE TABLE video_cache (
  id              SERIAL PRIMARY KEY,
  video_id        VARCHAR(20) NOT NULL UNIQUE, -- YouTube video ID
  channel_id      VARCHAR(30) NOT NULL,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  tags            TEXT[],                   -- video tags (gold mine for keyword expansion)
  view_count      BIGINT DEFAULT 0,
  like_count      BIGINT DEFAULT 0,
  comment_count   BIGINT DEFAULT 0,
  duration_seconds INT,                    -- ISO 8601 duration parsed to seconds
  published_at    TIMESTAMPTZ,
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_video_cache_channel ON video_cache(channel_id);
CREATE INDEX idx_video_cache_fetched ON video_cache(last_fetched_at);
```

### `channel_cache`

Channel-level data. Used to assess competition (big channels vs small creators).

```sql
CREATE TABLE channel_cache (
  id              SERIAL PRIMARY KEY,
  channel_id      VARCHAR(30) NOT NULL UNIQUE,
  channel_name    VARCHAR(255),
  subscriber_count BIGINT DEFAULT 0,
  video_count     INT DEFAULT 0,
  last_fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_channel_cache_fetched ON channel_cache(last_fetched_at);
```

### `quota_log`

Track every API call to stay under 10K daily limit.

```sql
CREATE TABLE quota_log (
  id              SERIAL PRIMARY KEY,
  log_date        DATE NOT NULL,
  endpoint        VARCHAR(50) NOT NULL,    -- 'search.list', 'videos.list', 'channels.list'
  units_used      INT NOT NULL,
  calls_made      INT NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quota_log_date ON quota_log(log_date);
```

## Scraper Pipeline

### Flow (runs once daily via cron)

```
1. CHECK QUOTA
   └─ Query quota_log for today's total
   └─ If >= 9,500 units used → abort (reserve 500 for emergencies)

2. SELECT KEYWORDS
   └─ Pick top N keywords from `keywords` table
   └─ ORDER BY priority DESC, last_searched_at ASC NULLS FIRST
   └─ N = (remaining_quota - 500) / 102  (usually ~90)

3. FOR EACH KEYWORD:
   a. AUTOCOMPLETE (free)
      └─ Hit suggestqueries endpoint
      └─ INSERT new suggestions into `keywords` table (source='autocomplete', parent_id=current)
      └─ Skip duplicates (ON CONFLICT DO NOTHING)

   b. SEARCH (100 units)
      └─ Call search.list with maxResults=50, order=relevance, type=video
      └─ Store totalResults in search_snapshots
      └─ Store each result in search_results
      └─ Collect all videoIds and channelIds
      └─ Log to quota_log

   c. ENRICH VIDEOS (1 unit per batch of 50)
      └─ Filter out video_cache entries fetched in last 24 hours
      └─ Call videos.list with part=statistics,snippet,contentDetails
      └─ Upsert into video_cache
      └─ Extract tags → INSERT new tags as keywords (source='tags', parent_id=current)
      └─ Log to quota_log

   d. ENRICH CHANNELS (1 unit per batch of 50)
      └─ Filter out channel_cache entries fetched in last 24 hours
      └─ Call channels.list with part=statistics,snippet
      └─ Upsert into channel_cache
      └─ Log to quota_log

   e. COMPUTE SCORES
      └─ Calculate search_snapshot aggregate fields (avg_views, title_match_count, etc.)
      └─ Update keyword.volume_score, difficulty_score, opportunity_score
      └─ Update keyword.last_searched_at = NOW()

4. LOG SUMMARY
   └─ Total keywords processed, quota used, new keywords discovered
```

### Keyword Queue Growth Strategy

The system is self-expanding. Every keyword search discovers new keywords through two channels:

1. **Autocomplete expansion** — Each seed keyword spawns 5-10 long-tail suggestions. "react tutorial" → "react tutorial for beginners", "react tutorial 2026", "react tutorial project", etc.

2. **Tag mining** — Top-ranking videos have tags that creators chose. These are validated keywords that real creators target. Extract and add to the queue.

With 95 keywords/day, each discovering ~10 new keywords:
- Day 1: 100 seed keywords → 95 searched, ~950 new discovered
- Day 7: ~1,000 keywords in DB, 665 searched
- Day 30: ~5,000+ keywords, all with scores and daily snapshots

Priority management keeps the system useful:
- New autocomplete/tag keywords start at priority 30
- Seed keywords start at priority 50
- Keywords requested by users (future) get priority 80
- Trending keywords (totalResults increasing >20% day-over-day) get boosted +10

## Scoring Algorithms

### Volume Score (0-100)

```
inputs:
  - total_results: from search.list
  - avg_views_top50: average views of top 50 results
  - autocomplete_present: boolean (does it appear in YouTube autocomplete?)

raw_volume = log10(total_results) * 10          -- log scale: 1M results = 60, 10K = 40
view_signal = min(avg_views_top50 / 10000, 20)  -- cap at 20 points for avg 200K+ views
autocomplete_bonus = 10 if autocomplete_present else 0

volume_score = min(raw_volume + view_signal + autocomplete_bonus, 100)
```

### Difficulty Score (0-100)

```
inputs:
  - title_match_count: how many of top 50 have exact keyword in title
  - avg_views_top50: average views of top results
  - avg_channel_subs: average subscriber count of top channels
  - avg_video_age_days: average age of top results

title_competition = (title_match_count / 50) * 30     -- max 30 points
view_dominance = min(log10(avg_views_top50 + 1) * 5, 25)  -- max 25 points
channel_authority = min(log10(avg_channel_subs + 1) * 5, 25) -- max 25 points
freshness_penalty = max(0, 20 - (avg_video_age_days / 30))   -- newer = harder, max 20 points

difficulty_score = min(title_competition + view_dominance + channel_authority + freshness_penalty, 100)
```

### Opportunity Score

```
opportunity_score = (volume_score / max(difficulty_score, 1)) * 50
-- Capped at 100, higher = better opportunity
-- A keyword with volume 80 and difficulty 20 scores 200 → capped at 100
-- A keyword with volume 40 and difficulty 80 scores 25
```

## Project Structure (new files)

```
app/
  api/
    scrape/
      run/
        route.ts            -- POST: trigger daily scrape (called by cron)
    keywords/
      route.ts              -- GET: list keywords with scores, POST: add seed keywords
      [id]/
        route.ts            -- GET: keyword detail with snapshots history
lib/
  db.ts                     -- Neon connection pool (existing, extend)
  youtube.ts                -- YouTube Data API v3 wrapper
  autocomplete.ts           -- YouTube autocomplete fetcher
  scraper.ts                -- Orchestrates the daily scrape pipeline
  scoring.ts                -- Volume, difficulty, opportunity score calculations
scripts/
  migrate.sql               -- All CREATE TABLE statements above
  seed-keywords.ts          -- Loads initial keyword list into DB
```

## Environment Variables (new)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `SCRAPER_SECRET` | Secret token to authenticate cron calls to /api/scrape/run |

## Seed Keyword Strategy

Start with ~100 seed keywords across popular YouTube niches:

- **Programming**: react tutorial, python for beginners, javascript project, web development, coding interview
- **Gaming**: minecraft lets play, fortnite tips, gaming setup, game review
- **Finance**: passive income, investing for beginners, stock market, crypto, budgeting
- **Fitness**: home workout, weight loss, gym routine, yoga for beginners
- **Education**: study tips, math tutorial, science experiment, language learning
- **Tech reviews**: best laptop, iphone review, budget phone, tech comparison
- **Cooking**: easy recipes, meal prep, air fryer, cooking for beginners
- **Vlogging**: day in my life, travel vlog, moving to, apartment tour

These 100 seeds will expand to ~1,000 keywords within the first week through autocomplete + tag mining.

## Cron Schedule

Run once daily at **3:00 AM UTC** (off-peak, quota resets at midnight PT = 7:00 AM UTC).

Vercel Cron config in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/scrape/run",
      "schedule": "0 3 * * *"
    }
  ]
}
```

The endpoint validates `SCRAPER_SECRET` via Authorization header or Vercel's built-in cron authentication.

## Safety Rails

1. **Hard quota cap**: Never exceed 9,500 units/day. Check `quota_log` before every API call.
2. **Rate limiting**: 1-second delay between search.list calls to avoid YouTube rate limits.
3. **Deduplication**: ON CONFLICT DO NOTHING on all inserts. Never waste quota re-fetching fresh data.
4. **24-hour cache**: Skip videos.list and channels.list for entries fetched within 24 hours.
5. **Error handling**: Log failures, skip the keyword, continue to next. Don't let one bad response kill the run.
6. **Idempotent runs**: If the cron fires twice in a day, the second run sees today's quota usage and processes fewer keywords.

## Success Criteria

After 30 days of running:
- 2,500+ keywords with volume/difficulty/opportunity scores
- Daily totalResults snapshots showing trending keywords
- 50,000+ videos cached with engagement metrics
- 5,000+ channels cached with subscriber counts
- Enough data to power keyword search and difficulty analysis at launch
