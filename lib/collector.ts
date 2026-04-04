import { query } from "./db";
import { QUOTA, isQuotaError, isTransientError } from "./quota-budget";

// ── Types ────────────────────────────────────────────────────────────

interface Keyword {
  id: number;
  keyword: string;
}

interface YouTubeSearchItem {
  id: { videoId: string };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
  };
  statistics: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
}

interface CollectionResult {
  keywordsQueried: number;
  quotaUsed: number;
  errors: string[];
  abortReason?: "quota_exceeded" | "infra_error";
}

// ── YouTube API calls ────────────────────────────────────────────────

const YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Search YouTube for videos matching a keyword.
 * Costs 100 quota units.
 *
 * Search parameters are locked constants for day-over-day comparability.
 */
async function searchVideos(
  keyword: string,
  apiKey: string
): Promise<{ videoIds: string[]; quotaCost: number }> {
  const params = new URLSearchParams({
    key: apiKey,
    q: keyword,
    type: "video",
    part: "id",
    maxResults: String(QUOTA.SEARCH_MAX_RESULTS),
    order: "relevance",
    regionCode: "US",
    relevanceLanguage: "en",
  });

  const res = await fetch(`${YOUTUBE_BASE}/search?${params}`);

  if (!res.ok) {
    const body = await res.text();
    if (isQuotaError(res.status, body)) {
      throw new QuotaExceededError("YouTube quota exceeded during search");
    }
    if (isTransientError(res.status)) {
      throw new TransientError(`search.list returned ${res.status} for "${keyword}"`);
    }
    throw new Error(`search.list failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const items: YouTubeSearchItem[] = data.items ?? [];
  const videoIds = items.map((item) => item.id.videoId).filter(Boolean);

  return { videoIds, quotaCost: QUOTA.SEARCH_COST };
}

/**
 * Fetch video metadata (snippet + statistics) for a batch of video IDs.
 * Costs 5 quota units per call. Max 50 IDs per call.
 */
async function fetchVideoMetadata(
  videoIds: string[],
  apiKey: string
): Promise<{ videos: YouTubeVideoItem[]; quotaCost: number }> {
  if (videoIds.length === 0) {
    return { videos: [], quotaCost: 0 };
  }

  const params = new URLSearchParams({
    key: apiKey,
    id: videoIds.join(","),
    part: "snippet,statistics",
  });

  const res = await fetch(`${YOUTUBE_BASE}/videos?${params}`);

  if (!res.ok) {
    const body = await res.text();
    if (isQuotaError(res.status, body)) {
      throw new QuotaExceededError("YouTube quota exceeded during videos.list");
    }
    if (isTransientError(res.status)) {
      throw new TransientError(`videos.list returned ${res.status}`);
    }
    throw new Error(`videos.list failed (${res.status}): ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  return {
    videos: data.items ?? [],
    quotaCost: QUOTA.VIDEOS_LIST_COST,
  };
}

// ── Error classes ────────────────────────────────────────────────────

export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaExceededError";
  }
}

export class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransientError";
  }
}

// ── Core collector ───────────────────────────────────────────────────

/**
 * Fetch active keywords that haven't been queried today yet.
 * Ordered by last_queried ASC NULLS FIRST (never-queried get priority).
 * Limited to MAX_KEYWORDS_PER_RUN.
 */
async function getKeywordsToCollect(): Promise<Keyword[]> {
  return query<Keyword>(
    `SELECT id, keyword
     FROM keywords
     WHERE is_active = TRUE
       AND (last_queried IS NULL OR last_queried::date < CURRENT_DATE)
     ORDER BY last_queried ASC NULLS FIRST
     LIMIT $1`,
    [QUOTA.MAX_KEYWORDS_PER_RUN]
  );
}

/**
 * Upsert ranking data for a single keyword + snapshot date.
 * Idempotent: re-running on the same day overwrites with latest data.
 */
async function upsertRankings(
  keywordId: number,
  snapshotDate: string,
  videoIds: string[],
  videos: YouTubeVideoItem[]
): Promise<void> {
  // Build a lookup map: videoId → metadata
  const videoMap = new Map(videos.map((v) => [v.id, v]));

  for (let rank = 0; rank < videoIds.length; rank++) {
    const vid = videoIds[rank];
    const meta = videoMap.get(vid);

    // Skip videos that were deleted between search and videos.list
    if (!meta) continue;

    const stats = meta.statistics;
    await query(
      `INSERT INTO keyword_rankings
         (keyword_id, snapshot_date, rank_position, video_id, channel_id,
          channel_name, video_title, view_count, like_count, comment_count, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (keyword_id, snapshot_date, rank_position)
       DO UPDATE SET
         video_id      = EXCLUDED.video_id,
         channel_id    = EXCLUDED.channel_id,
         channel_name  = EXCLUDED.channel_name,
         video_title   = EXCLUDED.video_title,
         view_count    = EXCLUDED.view_count,
         like_count    = EXCLUDED.like_count,
         comment_count = EXCLUDED.comment_count,
         published_at  = EXCLUDED.published_at`,
      [
        keywordId,
        snapshotDate,
        rank + 1, // 1-based position
        vid,
        meta.snippet.channelId,
        meta.snippet.channelTitle,
        meta.snippet.title,
        stats.viewCount ? BigInt(stats.viewCount) : null,
        stats.likeCount ? BigInt(stats.likeCount) : null,
        stats.commentCount ? BigInt(stats.commentCount) : null,
        meta.snippet.publishedAt || null,
      ]
    );
  }
}

/**
 * Run the full collection pipeline.
 *
 * For each active keyword:
 *   1. search.list → get video IDs
 *   2. videos.list → get metadata
 *   3. Upsert into keyword_rankings
 *   4. Update keywords.last_queried
 *
 * Error handling:
 *   - Transient errors: skip keyword, continue batch
 *   - Quota errors: abort entire batch immediately
 *   - Infra errors (DB): abort batch
 */
export async function runCollection(apiKey: string): Promise<CollectionResult> {
  const result: CollectionResult = {
    keywordsQueried: 0,
    quotaUsed: 0,
    errors: [],
  };

  let keywords: Keyword[];
  try {
    keywords = await getKeywordsToCollect();
  } catch (err) {
    result.abortReason = "infra_error";
    result.errors.push(`Failed to fetch keywords: ${String(err)}`);
    return result;
  }

  if (keywords.length === 0) {
    return result; // Nothing to collect today
  }

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  for (const kw of keywords) {
    try {
      // Step 1: Search
      const { videoIds, quotaCost: searchCost } = await searchVideos(kw.keyword, apiKey);
      result.quotaUsed += searchCost;

      if (videoIds.length === 0) {
        // No results — still mark as queried so we don't re-query today
        await query("UPDATE keywords SET last_queried = NOW() WHERE id = $1", [kw.id]);
        result.keywordsQueried++;
        continue;
      }

      // Step 2: Fetch video metadata
      const { videos, quotaCost: videosCost } = await fetchVideoMetadata(videoIds, apiKey);
      result.quotaUsed += videosCost;

      // Step 3: Upsert rankings
      await upsertRankings(kw.id, today, videoIds, videos);

      // Step 4: Mark keyword as queried
      await query("UPDATE keywords SET last_queried = NOW() WHERE id = $1", [kw.id]);
      result.keywordsQueried++;
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        result.abortReason = "quota_exceeded";
        result.errors.push(`Quota exceeded at keyword "${kw.keyword}": ${err.message}`);
        break; // Abort entire batch
      }

      if (err instanceof TransientError) {
        result.errors.push(`Transient error for "${kw.keyword}": ${err.message}`);
        continue; // Skip this keyword, try next
      }

      // Unknown error — treat as infra failure, abort
      result.abortReason = "infra_error";
      result.errors.push(`Fatal error for "${kw.keyword}": ${String(err)}`);
      break;
    }
  }

  return result;
}

/**
 * Collect rankings for a single keyword on demand.
 * Used by POST /api/keywords to immediately populate a newly added keyword.
 *
 * Returns the quota cost incurred, or null if collection failed.
 * Failures are swallowed — the keyword still gets created; it just
 * stays in "pending" state until the next cron run picks it up.
 */
export async function collectSingleKeyword(
  keywordId: number,
  keywordText: string,
  apiKey: string
): Promise<{ quotaUsed: number } | null> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { videoIds, quotaCost: searchCost } = await searchVideos(keywordText, apiKey);
    let quotaUsed = searchCost;

    if (videoIds.length === 0) {
      await query("UPDATE keywords SET last_queried = NOW() WHERE id = $1", [keywordId]);
      return { quotaUsed };
    }

    const { videos, quotaCost: videosCost } = await fetchVideoMetadata(videoIds, apiKey);
    quotaUsed += videosCost;

    await upsertRankings(keywordId, today, videoIds, videos);
    await query("UPDATE keywords SET last_queried = NOW() WHERE id = $1", [keywordId]);

    return { quotaUsed };
  } catch {
    // Swallow errors — keyword was already created, cron will retry
    return null;
  }
}

/**
 * Log a collection run to the collection_log table.
 */
export async function logCollection(result: CollectionResult, durationMs: number): Promise<void> {
  await query(
    `INSERT INTO collection_log (keywords_queried, quota_used, errors, duration_ms)
     VALUES ($1, $2, $3, $4)`,
    [
      result.keywordsQueried,
      result.quotaUsed,
      result.errors.length > 0 ? result.errors : null,
      durationMs,
    ]
  );
}
