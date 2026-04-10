# YTCombinator — Build Reference

Schema DDL, API endpoints, auth model, and state machines. Read CLAUDE.md first for architecture and constraints.

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
CREATE TABLE channels (
  id            SERIAL PRIMARY KEY,
  youtube_id    VARCHAR(64) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  api_key_hash  VARCHAR(128) NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

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
| POST | `/api/auth` | Register a channel and get an API key | None |

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

## Auth Model

1. Channel registers via `POST /api/auth` with YouTube channel ID and name.
2. Server generates a random API key prefixed `ytc_`, hashes with SHA-256, stores hash.
3. Raw key returned once — client must save it.
4. All subsequent requests pass `Authorization: Bearer ytc_...`.
5. Auth middleware hashes the provided key and looks up the matching channel.

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
