-- YTCombinator Keyword Intelligence Pipeline
-- Phase 0 schema migration
-- Run against Neon PostgreSQL

-- Keywords being tracked
CREATE TABLE IF NOT EXISTS keywords (
  id            SERIAL PRIMARY KEY,
  keyword       VARCHAR(500) NOT NULL UNIQUE,
  category      VARCHAR(100),
  is_targeted   BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  last_queried  TIMESTAMPTZ
);

-- Daily ranking snapshots: what videos rank for what keywords
CREATE TABLE IF NOT EXISTS keyword_rankings (
  id              SERIAL PRIMARY KEY,
  keyword_id      INT NOT NULL REFERENCES keywords(id) ON DELETE CASCADE,
  snapshot_date   DATE NOT NULL,
  rank_position   INT NOT NULL,
  video_id        VARCHAR(64) NOT NULL,
  channel_id      VARCHAR(64) NOT NULL,
  channel_name    VARCHAR(255),
  video_title     VARCHAR(500),
  view_count      BIGINT,
  like_count      BIGINT,
  comment_count   BIGINT,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(keyword_id, snapshot_date, rank_position)
);

-- Performance indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_rankings_keyword_date
  ON keyword_rankings(keyword_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_rankings_date_keyword
  ON keyword_rankings(snapshot_date, keyword_id);

CREATE INDEX IF NOT EXISTS idx_rankings_channel
  ON keyword_rankings(channel_id);

-- Auto-generated topic tags (extracted from YouTube result titles)
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Collection job log
CREATE TABLE IF NOT EXISTS collection_log (
  id              SERIAL PRIMARY KEY,
  run_at          TIMESTAMPTZ DEFAULT NOW(),
  keywords_queried INT DEFAULT 0,
  quota_used      INT DEFAULT 0,
  errors          TEXT[],
  duration_ms     INT
);
