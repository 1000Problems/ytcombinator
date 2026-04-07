# YTCombinator

A comprehensive YouTube channel automation suite — scheduling, analytics, content optimization, and thumbnail management in one dashboard.

## Before Implementing Any TASK

1. **Read the full TASK spec** — understand scope, acceptance criteria, and the Do Not Change section.
2. **Query LightRAG** for cross-project context before touching shared patterns:
   ```bash
   curl -X POST http://localhost:9621/query \
     -H "Content-Type: application/json" \
     -d '{"query": "architectural context for [feature being implemented]", "mode": "hybrid"}'
   ```
3. **Stay in scope.** Only modify files and components explicitly listed in the TASK spec. If you discover something that needs changing outside the spec, create a new VybePM task — do NOT fix it inline.
4. **Verify before committing.** Run `npm run build`, confirm zero type errors, and check that nothing outside the TASK scope changed with `git diff`.

### Protected Areas (global — TASK specs may add more)

These components are stable and must NOT be modified unless the TASK spec explicitly names them:

- `lib/collector.ts` — YouTube API collection logic and quota management
- `lib/quota-budget.ts` — budget constants (DAILY_LIMIT, SEARCH_COST, COLLECTOR_BUDGET, MAX_KEYWORDS_PER_RUN)
- `lib/db.ts` — Neon connection pool
- `app/api/keywords/route.ts` — POST handler with collect_inline flow (complex, easy to break)
- `scripts/collect.ts` — cron collection script
- `.github/workflows/collect.yml` — daily collection cron
- Database schema in `scripts/migrate.sql` — additive changes only (new columns/tables), never drop or rename existing

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Hosting**: Vercel
- **Auth**: API key per channel (stored hashed in DB, passed via `Authorization: Bearer <key>` header)
- **External API**: YouTube Data API v3

## Project Structure

```
app/
  page.tsx                    -- Landing page / dashboard
  layout.tsx                  -- Root layout
  api/
    auth/
      route.ts                -- POST: generate API key for a channel
    videos/
      route.ts                -- GET: list videos, POST: create draft video
      [id]/
        route.ts              -- GET/PATCH/DELETE a single video
    schedule/
      route.ts                -- GET: list scheduled uploads, POST: schedule a new upload
      [id]/
        route.ts              -- PATCH: reschedule, DELETE: cancel
    analytics/
      route.ts                -- GET: channel-level metrics (views, subs, watch time)
      videos/
        route.ts              -- GET: per-video analytics (views, CTR, retention)
    content/
      thumbnails/
        route.ts              -- POST: generate thumbnail suggestions
      titles/
        route.ts              -- POST: generate optimized title/description/tags
lib/
  db.ts                       -- Neon connection pool + query helpers
  youtube.ts                  -- YouTube Data API v3 wrapper
  auth.ts                     -- API key hashing, verification, middleware
  types.ts                    -- Shared TypeScript types
public/
  ytcombinator-logo.svg       -- Project logo (320x192)
```

## Database Schema

```sql
-- Channels registered in YTCombinator
CREATE TABLE channels (
  id            SERIAL PRIMARY KEY,
  youtube_id    VARCHAR(64) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  api_key_hash  VARCHAR(128) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Cached video metadata (synced from YouTube API)
CREATE TABLE videos (
  id              SERIAL PRIMARY KEY,
  channel_id      INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  youtube_video_id VARCHAR(64) NOT NULL UNIQUE,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  tags            TEXT[],
  thumbnail_url   VARCHAR(1000),
  status          VARCHAR(20) NOT NULL DEFAULT 'draft',
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Valid video statuses: draft -> scheduled -> published | failed
-- A video starts as 'draft', moves to 'scheduled' when a publish
-- time is set, then transitions to 'published' or 'failed'.

-- Scheduled upload jobs
CREATE TABLE schedules (
  id            SERIAL PRIMARY KEY,
  video_id      INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Valid schedule statuses: pending -> processing -> completed | failed | cancelled

-- Analytics snapshots (pulled periodically from YouTube API)
CREATE TABLE analytics_snapshots (
  id              SERIAL PRIMARY KEY,
  channel_id      INT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  video_id        INT REFERENCES videos(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,
  views           BIGINT DEFAULT 0,
  likes           BIGINT DEFAULT 0,
  comments        BIGINT DEFAULT 0,
  subscribers     BIGINT DEFAULT 0,
  watch_time_mins BIGINT DEFAULT 0,
  ctr             DECIMAL(5,2),
  avg_view_pct    DECIMAL(5,2),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, video_id, snapshot_date)
);

-- Content optimization history
CREATE TABLE content_suggestions (
  id            SERIAL PRIMARY KEY,
  video_id      INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  suggestion_type VARCHAR(20) NOT NULL, -- 'title', 'description', 'tags', 'thumbnail'
  original      TEXT,
  suggested     TEXT NOT NULL,
  accepted      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Auth

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/auth` | Register a channel and get an API key | None (creates key) |

**POST /api/auth**
- Body: `{ "youtube_id": "UC...", "name": "My Channel" }`
- Response: `{ "api_key": "ytc_...", "channel_id": 1 }`
- The raw API key is returned once; only the hash is stored.

### Videos

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/videos` | List all videos for the authenticated channel | Bearer |
| POST | `/api/videos` | Create a draft video entry | Bearer |
| GET | `/api/videos/[id]` | Get a single video | Bearer |
| PATCH | `/api/videos/[id]` | Update video metadata | Bearer |
| DELETE | `/api/videos/[id]` | Delete a video entry | Bearer |

### Schedule

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/schedule` | List all scheduled uploads | Bearer |
| POST | `/api/schedule` | Schedule a video for upload | Bearer |
| PATCH | `/api/schedule/[id]` | Reschedule | Bearer |
| DELETE | `/api/schedule/[id]` | Cancel a scheduled upload | Bearer |

**POST /api/schedule**
- Body: `{ "video_id": 5, "scheduled_at": "2026-04-10T14:00:00Z" }`
- Validates: video exists, belongs to channel, not already scheduled
- Response: `201 { "id": 1, "video_id": 5, "scheduled_at": "...", "status": "pending" }`

### Analytics

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/analytics` | Channel-level metrics (query: `?days=30`) | Bearer |
| GET | `/api/analytics/videos` | Per-video metrics (query: `?video_id=5&days=30`) | Bearer |

### Content Optimization

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/content/titles` | Generate title/desc/tag suggestions | Bearer |
| POST | `/api/content/thumbnails` | Generate thumbnail composition ideas | Bearer |

**POST /api/content/titles**
- Body: `{ "video_id": 5, "topic": "React Server Components tutorial" }`
- Response: `{ "suggestions": [{ "title": "...", "description": "...", "tags": [...] }] }`

## Auth Model

1. Channel registers via `POST /api/auth` with their YouTube channel ID and name.
2. Server generates a random API key prefixed `ytc_`, hashes it with SHA-256, stores the hash.
3. The raw key is returned once in the response — client must save it.
4. All subsequent requests pass `Authorization: Bearer ytc_...`.
5. Auth middleware hashes the provided key and looks up the matching channel.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `API_KEY_SALT` | Salt for API key hashing |

## State Machines

### Video Status
```
draft --> scheduled --> published
                  \--> failed
```

### Schedule Status
```
pending --> processing --> completed
                     \--> failed
pending --> cancelled
```

## Critical Notes

1. **YouTube API quotas**: The Data API v3 has a 10,000 unit daily quota. Analytics pulls should be batched and cached aggressively. Never poll in real-time — use the snapshots table.
2. **Neon cold starts**: First query after idle may take 1-2s. Use connection pooling via `@neondatabase/serverless` pool mode.
3. **Scheduled uploads**: The schedule table tracks intent. Actual uploading requires YouTube upload API + OAuth (not just a Data API key). Phase 1 tracks schedules; phase 2 will add the upload integration.
4. **Content suggestions are local**: Title/tag optimization runs server-side logic (keyword analysis, character counts, SEO scoring). No external AI API calls in v1 — keeps it deterministic and free of rate limits.
5. **Timezone handling**: All timestamps stored as UTC (`TIMESTAMPTZ`). Client converts to local for display.
