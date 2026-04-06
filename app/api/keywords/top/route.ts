import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

// ââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

interface RawKeywordMetrics {
  id: number;
  keyword: string;
  category: string | null;
  is_targeted: boolean;
  your_rank: number | null;
  rank_7d_ago: number | null;
  avg_views: number | null;
  unique_channels: number | null;
  total_results: number | null;
  avg_video_age_days: number | null;
  newest_video_age_days: number | null;
}

interface ScoredKeyword extends RawKeywordMetrics {
  score: number;
  rank_score: number;
  demand_score: number;
  competition_score: number;
  momentum_score: number;
  freshness_score: number;
  signal: string;
}

// ââ Scoring logic ââââââââââââââââââââââââââââââââââââââââââââââââââââ

/**
 * Score a keyword for monetization potential.
 *
 * Components (0â100 total):
 *   Rank          (0â30): Are you actually showing up? Higher rank = better.
 *   Demand        (0â25): How many views do competing videos get? More = bigger pie.
 *   Competition   (0â20): How diverse are the channels in the SERP? More = easier entry.
 *   Momentum      (0â15): Is your rank improving week over week?
 *   Freshness     (0â10): Are newer videos ranking? If so, the algorithm rewards fresh content.
 */
function scoreKeyword(kw: RawKeywordMetrics): ScoredKeyword {
  // Rank score (0â30)
  let rank_score = 0;
  if (kw.your_rank === null) {
    rank_score = 5; // Not ranking yet â small base for potential
  } else if (kw.your_rank <= 3) {
    rank_score = 30;
  } else if (kw.your_rank <= 5) {
    rank_score = 25;
  } else if (kw.your_rank <= 10) {
    rank_score = 18;
  } else if (kw.your_rank <= 20) {
    rank_score = 10;
  } else {
    rank_score = 3;
  }

  // Demand score (0â25): avg views of competing videos as proxy
  let demand_score = 0;
  if (kw.avg_views !== null && kw.avg_views > 0) {
    // Log scale: 1K views = ~8, 10K = ~16, 100K = ~21, 1M = ~25
    demand_score = Math.min(25, Math.round(Math.log10(kw.avg_views) * 5));
  }

  // Competition score (0â20): channel diversity ratio
  let competition_score = 0;
  if (kw.unique_channels !== null && kw.total_results !== null && kw.total_results > 0) {
    const diversity = kw.unique_channels / kw.total_results;
    competition_score = Math.round(diversity * 20);
  }

  // Momentum score (0â15)
  let momentum_score = 0;
  if (kw.your_rank !== null && kw.rank_7d_ago !== null) {
    const delta = kw.rank_7d_ago - kw.your_rank; // positive = improved
    if (delta >= 5) {
      momentum_score = 15;
    } else if (delta >= 3) {
      momentum_score = 12;
    } else if (delta > 0) {
      momentum_score = 8;
    } else if (delta === 0) {
      momentum_score = 4;
    }
    // negative delta = 0 (declining)
  } else if (kw.your_rank !== null && kw.rank_7d_ago === null) {
    momentum_score = 6; // newly ranking â moderate signal
  }

  // Freshness score (0â10): average age of competing videos
  let freshness_score = 0;
  if (kw.newest_video_age_days !== null) {
    if (kw.newest_video_age_days < 30) {
      freshness_score = 10;
    } else if (kw.newest_video_age_days < 90) {
      freshness_score = 8;
    } else if (kw.newest_video_age_days < 180) {
      freshness_score = 5;
    } else if (kw.newest_video_age_days < 365) {
      freshness_score = 3;
    } else {
      freshness_score = 1;
    }
  }

  const score = rank_score + demand_score + competition_score + momentum_score + freshness_score;

  // Generate a human-readable signal
  const signal = pickSignal(kw, { rank_score, demand_score, competition_score, momentum_score, freshness_score });

  return {
    ...kw,
    score,
    rank_score,
    demand_score,
    competition_score,
    momentum_score,
    freshness_score,
    signal,
  };
}

function pickSignal(
  kw: RawKeywordMetrics,
  scores: { rank_score: number; demand_score: number; competition_score: number; momentum_score: number; freshness_score: number }
): string {
  // Pick the most notable thing about this keyword
  if (kw.your_rank !== null && kw.your_rank <= 3 && scores.demand_score >= 18) {
    return "Dominating a high-demand keyword";
  }
  if (scores.momentum_score >= 12) {
    return "Rank climbing fast";
  }
  if (kw.your_rank !== null && kw.your_rank <= 5) {
    return "Strong position â defend it";
  }
  if (scores.demand_score >= 20 && scores.competition_score >= 14) {
    return "High demand, low gatekeeping";
  }
  if (scores.freshness_score >= 8 && kw.your_rank === null) {
    return "Fresh topic â jump in early";
  }
  if (scores.demand_score >= 18 && kw.your_rank !== null && kw.your_rank <= 10) {
    return "Good position on valuable keyword";
  }
  if (scores.competition_score >= 16) {
    return "Wide-open SERP";
  }
  if (scores.freshness_score >= 8) {
    return "Algorithm favoring fresh content";
  }
  if (kw.your_rank === null && scores.demand_score >= 15) {
    return "Untapped opportunity";
  }
  return "Steady performer";
}

// ââ GET /api/keywords/top ââââââââââââââââââââââââââââââââââââââââââââ

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channel_id") || process.env.MY_CHANNEL_ID;
  const limit = Math.min(Number(searchParams.get("limit") || 20), 50);

  try {
    const rows = await query<RawKeywordMetrics>(
      `WITH latest_snapshot AS (
        SELECT COALESCE(MAX(snapshot_date), CURRENT_DATE) AS snap_date
        FROM keyword_rankings
      ),
      your_rank AS (
        SELECT DISTINCT ON (keyword_id)
          keyword_id, rank_position
        FROM keyword_rankings, latest_snapshot
        WHERE channel_id = $1
          AND snapshot_date = latest_snapshot.snap_date
        ORDER BY keyword_id, rank_position ASC
      ),
      your_rank_7d AS (
        SELECT DISTINCT ON (keyword_id)
          keyword_id, rank_position
        FROM keyword_rankings, latest_snapshot
        WHERE channel_id = $1
          AND snapshot_date = latest_snapshot.snap_date - INTERVAL '7 days'
        ORDER BY keyword_id, rank_position ASC
      ),
      serp_stats AS (
        SELECT
          keyword_id,
          AVG(view_count)::bigint AS avg_views,
          COUNT(DISTINCT channel_id) AS unique_channels,
          COUNT(*) AS total_results,
          AVG(EXTRACT(EPOCH FROM (NOW() - published_at)) / 86400)::int AS avg_video_age_days,
          MIN(EXTRACT(EPOCH FROM (NOW() - published_at)) / 86400)::int AS newest_video_age_days
        FROM keyword_rankings, latest_snapshot
        WHERE snapshot_date = latest_snapshot.snap_date
          AND published_at IS NOT NULL
        GROUP BY keyword_id
      )
      SELECT
        k.id,
        k.keyword,
        k.category,
        k.is_targeted,
        yr.rank_position AS your_rank,
        yr7.rank_position AS rank_7d_ago,
        ss.avg_views,
        ss.unique_channels,
        ss.total_results,
        ss.avg_video_age_days,
        ss.newest_video_age_days
      FROM keywords k
      LEFT JOIN your_rank yr ON yr.keyword_id = k.id
      LEFT JOIN your_rank_7d yr7 ON yr7.keyword_id = k.id
      LEFT JOIN serp_stats ss ON ss.keyword_id = k.id
      WHERE k.is_active = TRUE
        AND k.last_queried IS NOT NULL`,
      [channelId || ""]
    );

    // Score each keyword in application code (easier to iterate on than SQL)
    const scored = rows
      .map(scoreKeyword)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({ keywords: scored, count: scored.length });
  } catch (err) {
    console.error("GET /api/keywords/top error:", err);
    return NextResponse.json(
      { error: "Failed to compute top keywords" },
      { status: 500 }
    );
  }
}
