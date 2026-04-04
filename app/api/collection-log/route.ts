import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface LogRow {
  id: number;
  run_at: string;
  keywords_queried: number;
  quota_used: number;
  errors: string[] | null;
  duration_ms: number | null;
}

/**
 * GET /api/collection-log
 *
 * Returns recent collection runs.
 * Query params:
 *   ?limit=5  — number of results (default 5)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10), 50);

  try {
    const rows = await query<LogRow>(
      `SELECT id, run_at, keywords_queried, quota_used, errors, duration_ms
       FROM collection_log
       ORDER BY run_at DESC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({ logs: rows });
  } catch (err) {
    console.error("GET /api/collection-log error:", err);
    return NextResponse.json(
      { error: "Failed to fetch collection log" },
      { status: 500 }
    );
  }
}
