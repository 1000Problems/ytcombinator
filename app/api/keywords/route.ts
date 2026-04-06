import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { collectSingleKeyword } from "@/lib/collector";

// ---- Types ------------------------------------------------------------------------------------------------------------------------

interface KeywordRow {
  id: number;
  keyword: string;
  category: string | null;
  tags: string[];
  is_targeted: boolean;
  is_active: boolean;
  added_at: string;
  last_queried: string | null;
  results_count: number | null;
}

interface KeywordWithRank extends KeywordRow {
  coppa_flag: string;
  your_rank: number | null;
  rank_7d_ago: number | null;
  top5_views_sum: number | null;
  unique_channel_count: number | null;
  demand_supply: number | null;
  revenue_est: number | null;
  revenue_est_low: number | null;
  revenue_est_high: number | null;
  cpm_mid: number | null;
}

// ---- GET /api/keywords ------------------------------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter"); // "targeted" | "active" | "inactive" | "pending"
  const category = searchParams.get("category");
  const channelId = searchParams.get("channel_id") || process.env.MY_CHANNEL_ID;
  const coppaOverride = searchParams.get("coppa_flag"); // "made_for_kids" | "family_general" — overrides per-keyword flag for CPM lookup

  try {
    // Single CTE query: keywords + latest ranking count + your rank + 7d ago rank
    // Uses latest available snapshot_date instead of CURRENT_DATE to survive UTC midnight rollover
    const rows = await query<KeywordWithRank>(
      `WITH latest_snapshot AS (
        SELECT COALESCE(MAX(snapshot_date), CURRENT_DATE) AS snap_date
        FROM keyword_rankings
      ),
      latest_counts AS (
        SELECT keyword_id, COUNT(*) AS results_count
        FROM keyword_rankings, latest_snapshot
        WHERE snapshot_date = latest_snapshot.snap_date
        GROUP BY keyword_id
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
      top5_views AS (
        SELECT keyword_id, SUM(view_count)::bigint AS top5_views_sum
        FROM (
          SELECT keyword_id, view_count,
            ROW_NUMBER() OVER (PARTITION BY keyword_id ORDER BY rank_position ASC) AS rn
          FROM keyword_rankings, latest_snapshot
          WHERE snapshot_date = latest_snapshot.snap_date
            AND view_count IS NOT NULL
        ) ranked
        WHERE rn <= 5
        GROUP BY keyword_id
      ),
      unique_channels AS (
        SELECT keyword_id, COUNT(DISTINCT channel_id) AS unique_channel_count
        FROM keyword_rankings, latest_snapshot
        WHERE snapshot_date = latest_snapshot.snap_date
        GROUP BY keyword_id
      )
      SELECT
        k.id, k.keyword, k.category, COALESCE(k.tags, '{}') AS tags,
        k.is_targeted, k.is_active, k.coppa_flag,
        k.added_at, k.last_queried,
        lc.results_count,
        yr.rank_position AS your_rank,
        yr7.rank_position AS rank_7d_ago,
        tv.top5_views_sum,
        uc.unique_channel_count,
        CASE WHEN uc.unique_channel_count > 0
          THEN ROUND((tv.top5_views_sum::numeric / 5) / uc.unique_channel_count, 0)
          ELSE NULL END AS demand_supply,
        CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_mid IS NOT NULL
          THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_mid / 1000, 2)
          WHEN tv.top5_views_sum IS NOT NULL
          THEN ROUND(tv.top5_views_sum::numeric * 5 / 1000, 2)
          ELSE NULL END AS revenue_est,
        CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_low IS NOT NULL
          THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_low / 1000, 2)
          ELSE NULL END AS revenue_est_low,
        CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_high IS NOT NULL
          THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_high / 1000, 2)
          ELSE NULL END AS revenue_est_high,
        cc.cpm_mid
      FROM keywords k
      LEFT JOIN latest_counts lc ON lc.keyword_id = k.id
      LEFT JOIN your_rank yr ON yr.keyword_id = k.id
      LEFT JOIN your_rank_7d yr7 ON yr7.keyword_id = k.id
      LEFT JOIN top5_views tv ON tv.keyword_id = k.id
      LEFT JOIN unique_channels uc ON uc.keyword_id = k.id
      LEFT JOIN category_cpm cc ON cc.category = k.category AND cc.coppa_flag = ${coppaOverride ? "$2" : "k.coppa_flag"} AND cc.region = 'us_en'
      WHERE 1=1
        ${filter === "targeted" ? "AND k.is_targeted = TRUE" : ""}
        ${filter === "active" ? "AND k.is_active = TRUE" : ""}
        ${filter === "inactive" ? "AND k.is_active = FALSE" : ""}
        ${filter === "pending" ? "AND k.last_queried IS NULL" : ""}
        ${category ? `AND k.category = $${coppaOverride ? 3 : 2}` : ""}
      ORDER BY
        k.is_targeted DESC,
        k.last_queried ASC NULLS FIRST,
        k.added_at DESC`,
      [channelId || "", ...(coppaOverride ? [coppaOverride] : []), ...(category ? [category] : [])]
    );

    return NextResponse.json({ keywords: rows, count: rows.length });
  } catch (err) {
    console.error("GET /api/keywords error:", err);
    return NextResponse.json(
      { error: "Failed to fetch keywords" },
      { status: 500 }
    );
  }
}

// ---- POST /api/keywords ----------------------------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, category, is_targeted } = body;

    if (!keyword || typeof keyword !== "string" || keyword.trim().length === 0) {
      return NextResponse.json(
        { error: "keyword is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    const trimmed = keyword.trim().toLowerCase();

    // Check for duplicate
    const existing = await queryOne(
      "SELECT id FROM keywords WHERE keyword = $1",
      [trimmed]
    );
    if (existing) {
      return NextResponse.json(
        { error: "Keyword already exists", existing_id: (existing as { id: number }).id },
        { status: 409 }
      );
    }

    const rows = await query<{ id: number; keyword: string }>(
      `INSERT INTO keywords (keyword, category, is_targeted)
       VALUES ($1, $2, $3)
       RETURNING id, keyword`,
      [trimmed, category || null, is_targeted ?? false]
    );

    const inserted = rows[0];

    // Inline collection: if the client sends collect_inline=true, we await
    // the YouTube API call so the dashboard can show data immediately.
    // Otherwise fall back to fire-and-forget for programmatic callers.
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      if (body.collect_inline) {
        // Block until collection finishes (typically 2-4s)
        const result = await collectSingleKeyword(inserted.id, inserted.keyword, apiKey);
        const collected = result !== null;

        // Compute metrics for this keyword immediately after collection
        if (collected) {
          try {
            const metrics = await queryOne<Record<string, unknown>>(
              `WITH latest_snapshot AS (
                SELECT COALESCE(MAX(snapshot_date), CURRENT_DATE) AS snap_date
                FROM keyword_rankings WHERE keyword_id = $1
              ),
              latest_counts AS (
                SELECT keyword_id, COUNT(*) AS results_count
                FROM keyword_rankings, latest_snapshot
                WHERE snapshot_date = latest_snapshot.snap_date AND keyword_id = $1
                GROUP BY keyword_id
              ),
              top5_views AS (
                SELECT keyword_id, SUM(view_count)::bigint AS top5_views_sum
                FROM (
                  SELECT keyword_id, view_count,
                    ROW_NUMBER() OVER (PARTITION BY keyword_id ORDER BY rank_position ASC) AS rn
                  FROM keyword_rankings, latest_snapshot
                  WHERE snapshot_date = latest_snapshot.snap_date AND keyword_id = $1
                ) ranked
                WHERE rn <= 5
                GROUP BY keyword_id
              ),
              unique_channels AS (
                SELECT keyword_id, COUNT(DISTINCT channel_id) AS unique_channel_count
                FROM keyword_rankings, latest_snapshot
                WHERE snapshot_date = latest_snapshot.snap_date AND keyword_id = $1
                GROUP BY keyword_id
              )
              SELECT
                k.id, k.keyword, k.category, COALESCE(k.tags, '{}') AS tags,
                k.is_targeted, k.is_active, k.coppa_flag,
                lc.results_count,
                tv.top5_views_sum,
                uc.unique_channel_count,
                CASE WHEN uc.unique_channel_count > 0
                  THEN ROUND((tv.top5_views_sum::numeric / 5) / uc.unique_channel_count, 0)
                  ELSE NULL END AS demand_supply,
                CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_low IS NOT NULL
                  THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_low / 1000, 2)
                  ELSE NULL END AS revenue_est_low,
                CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_mid IS NOT NULL
                  THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_mid / 1000, 2)
                  WHEN tv.top5_views_sum IS NOT NULL
                  THEN ROUND(tv.top5_views_sum::numeric * 5 / 1000, 2)
                  ELSE NULL END AS revenue_est,
                CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_high IS NOT NULL
                  THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_high / 1000, 2)
                  ELSE NULL END AS revenue_est_high,
                cc.cpm_mid
              FROM keywords k
              LEFT JOIN latest_counts lc ON lc.keyword_id = k.id
              LEFT JOIN top5_views tv ON tv.keyword_id = k.id
              LEFT JOIN unique_channels uc ON uc.keyword_id = k.id
              LEFT JOIN category_cpm cc ON cc.category = k.category AND cc.coppa_flag = k.coppa_flag AND cc.region = 'us_en'
              WHERE k.id = $1`,
              [inserted.id]
            );

            if (metrics) {
              return NextResponse.json(
                { ...metrics, collected: true, quota_used: result?.quotaUsed ?? 0 },
                { status: 201 }
              );
            }
          } catch {
            // Fall through to basic response if metrics query fails
          }
        }

        return NextResponse.json(
          { ...inserted, collected, quota_used: result?.quotaUsed ?? 0, tags: result?.tags ?? [] },
          { status: 201 }
        );
      } else {
        // Fire-and-forget for backward compat
        collectSingleKeyword(inserted.id, inserted.keyword, apiKey).catch(() => {
          // Swallowed -- cron will pick it up if this fails
        });
      }
    }

    return NextResponse.json(inserted, { status: 201 });
  } catch (err) {
    console.error("POST /api/keywords error:", err);
    return NextResponse.json(
      { error: "Failed to add keyword" },
      { status: 500 }
    );
  }
}

// ---- PATCH /api/keywords (bulk update) ----------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, is_active, is_targeted } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "ids must be a non-empty array" },
        { status: 400 }
      );
    }

    const setClauses: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (typeof is_active === "boolean") {
      setClauses.push(`is_active = $${paramIdx++}`);
      params.push(is_active);
    }
    if (typeof is_targeted === "boolean") {
      setClauses.push(`is_targeted = $${paramIdx++}`);
      params.push(is_targeted);
    }

    if (setClauses.length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    params.push(ids);
    const updated = await query<{ id: number }>(
      `UPDATE keywords SET ${setClauses.join(", ")}
       WHERE id = ANY($${paramIdx})
       RETURNING id`,
      params
    );

    return NextResponse.json({ updated: updated.length });
  } catch (err) {
    console.error("PATCH /api/keywords error:", err);
    return NextResponse.json(
      { error: "Failed to update keywords" },
      { status: 500 }
    );
  }
}
