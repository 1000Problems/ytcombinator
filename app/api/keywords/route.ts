import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { collectSingleKeyword } from "@/lib/collector";

// ---- Types ------------------------------------------------------------------------------------------------------------------------

interface KeywordRow {
  id: number;
  keyword: string;
  category: string | null;
  is_targeted: boolean;
  is_active: boolean;
  added_at: string;
  last_queried: string | null;
  results_count: number | null;
}

interface KeywordWithRank extends KeywordRow {
  your_rank: number | null;
  rank_7d_ago: number | null;
  top5_views_sum: number | null;
}

// ---- GET /api/keywords ------------------------------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter"); // "targeted" | "active" | "inactive" | "pending"
  const category = searchParams.get("category");
  const channelId = searchParams.get("channel_id") || process.env.MY_CHANNEL_ID;

  try {
    // Single CTE query: keywords + latest ranking count + your rank + 7d ago rank
    const rows = await query<KeywordWithRank>(
      `WITH latest_counts AS (
        SELECT keyword_id, COUNT(*) AS results_count
        FROM keyword_rankings
        WHERE snapshot_date = CURRENT_DATE
        GROUP BY keyword_id
      ),
      your_rank AS (
        SELECT DISTINCT ON (keyword_id)
          keyword_id, rank_position
        FROM keyword_rankings
        WHERE channel_id = $1
          AND snapshot_date = CURRENT_DATE
        ORDER BY keyword_id, rank_position ASC
      ),
      your_rank_7d AS (
        SELECT DISTINCT ON (keyword_id)
          keyword_id, rank_position
        FROM keyword_rankings
        WHERE channel_id = $1
          AND snapshot_date = CURRENT_DATE - INTERVAL '7 days'
        ORDER BY keyword_id, rank_position ASC
      ),
      top5_views AS (
        SELECT keyword_id, SUM(view_count)::bigint AS top5_views_sum
        FROM (
          SELECT keyword_id, view_count,
            ROW_NUMBER() OVER (PARTITION BY keyword_id ORDER BY rank_position ASC) AS rn
          FROM keyword_rankings
          WHERE snapshot_date = CURRENT_DATE
            AND view_count IS NOT NULL
        ) ranked
        WHERE rn <= 5
        GROUP BY keyword_id
      )
      SELECT
        k.id, k.keyword, k.category, k.is_targeted, k.is_active,
        k.added_at, k.last_queried,
        lc.results_count,
        yr.rank_position AS your_rank,
        yr7.rank_position AS rank_7d_ago,
        tv.top5_views_sum
      FROM keywords k
      LEFT JOIN latest_counts lc ON lc.keyword_id = k.id
      LEFT JOIN your_rank yr ON yr.keyword_id = k.id
      LEFT JOIN your_rank_7d yr7 ON yr7.keyword_id = k.id
      LEFT JOIN top5_views tv ON tv.keyword_id = k.id
      WHERE 1=1
        ${filter === "targeted" ? "AND k.is_targeted = TRUE" : ""}
        ${filter === "active" ? "AND k.is_active = TRUE" : ""}
        ${filter === "inactive" ? "AND k.is_active = FALSE" : ""}
        ${filter === "pending" ? "AND k.last_queried IS NULL" : ""}
        ${category ? "AND k.category = $2" : ""}
      ORDER BY
        k.is_targeted DESC,
        k.last_queried ASC NULLS FIRST,
        k.added_at DESC`,
      category ? [channelId || "", category] : [channelId || ""]
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

    // Fire-and-forget: collect rankings for this keyword immediately.
    // The response doesn't wait -- the dashboard will show data on next refresh.
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      collectSingleKeyword(inserted.id, inserted.keyword, apiKey).catch(() => {
        // Swallowed -- cron will pick it up if this fails
      });
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

