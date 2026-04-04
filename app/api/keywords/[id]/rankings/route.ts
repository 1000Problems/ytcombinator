import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface RankingRow {
  rank_position: number;
  video_id: string;
  channel_id: string;
  channel_name: string | null;
  video_title: string | null;
  view_count: number | null;
  like_count: number | null;
  published_at: string | null;
}

/**
 * GET /api/keywords/[id]/rankings
 *
 * Returns the latest ranking snapshot for a keyword (top 5 by default).
 * Query params:
 *   ?limit=5  — number of results (default 5)
 *   ?date=YYYY-MM-DD — specific snapshot date (default: latest available)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const keywordId = parseInt(id, 10);
  if (isNaN(keywordId)) {
    return NextResponse.json({ error: "Invalid keyword ID" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10), 25);
  const date = searchParams.get("date");

  try {
    const dateClause = date
      ? "AND kr.snapshot_date = $2"
      : "AND kr.snapshot_date = (SELECT MAX(snapshot_date) FROM keyword_rankings WHERE keyword_id = $1)";

    const queryParams = date ? [keywordId, date, limit] : [keywordId, limit];
    const limitParam = date ? "$3" : "$2";

    const rows = await query<RankingRow>(
      `SELECT
        kr.rank_position, kr.video_id, kr.channel_id,
        kr.channel_name, kr.video_title, kr.view_count,
        kr.like_count, kr.published_at
      FROM keyword_rankings kr
      WHERE kr.keyword_id = $1
        ${dateClause}
      ORDER BY kr.rank_position ASC
      LIMIT ${limitParam}`,
      queryParams
    );

    return NextResponse.json({ rankings: rows, keyword_id: keywordId });
  } catch (err) {
    console.error(`GET /api/keywords/${id}/rankings error:`, err);
    return NextResponse.json(
      { error: "Failed to fetch rankings" },
      { status: 500 }
    );
  }
}
