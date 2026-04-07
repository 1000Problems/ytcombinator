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

-- Backfill any NULL added_at values with today's date
UPDATE keywords SET added_at = NOW() WHERE added_at IS NULL;

-- COPPA flag on keywords: 'made_for_kids' (conservative) or 'family_general' (higher CPM)
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS coppa_flag VARCHAR(20) NOT NULL DEFAULT 'made_for_kids';

-- Category-level CPM benchmarks (editable via future admin UI)
-- Region multipliers (future): US English=1.00, US Spanish=0.70, UK/CA/AU=0.85, LatAm=0.25, India=0.10, RoW=0.30
CREATE TABLE IF NOT EXISTS category_cpm (
  id              SERIAL PRIMARY KEY,
  category        VARCHAR(50) NOT NULL,
  coppa_flag      VARCHAR(20) NOT NULL DEFAULT 'made_for_kids',
  cpm_low         DECIMAL(6,2) NOT NULL,
  cpm_mid         DECIMAL(6,2) NOT NULL,
  cpm_high        DECIMAL(6,2) NOT NULL,
  region          VARCHAR(20) NOT NULL DEFAULT 'us_en',
  source          TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, coppa_flag, region)
);

-- Collection job log
CREATE TABLE IF NOT EXISTS collection_log (
  id              SERIAL PRIMARY KEY,
  run_at          TIMESTAMPTZ DEFAULT NOW(),
  keywords_queried INT DEFAULT 0,
  quota_used      INT DEFAULT 0,
  errors          TEXT[],
  duration_ms     INT
);

-- Analyzed videos (video analyzer feature)
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
