/**
 * POST /api/collect
 *
 * Triggers a collection run for pending/stale keywords.
 * This is the same logic the cron job uses, exposed as an on-demand endpoint
 * so the dashboard can offer a "Collect" button.
 *
 * Returns { keywordsQueried, quotaUsed, errors, abortReason? }
 */

import { NextResponse } from "next/server";
import { runCollection, logCollection } from "@/lib/collector";

export const maxDuration = 60; // allow up to 60s for collection

export async function POST() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const startTime = Date.now();

  try {
    const result = await runCollection(apiKey);
    const durationMs = Date.now() - startTime;

    // Best-effort log to DB (non-blocking)
    logCollection(result, durationMs).catch(() => {});

    return NextResponse.json({
      keywordsQueried: result.keywordsQueried,
      quotaUsed: result.quotaUsed,
      errors: result.errors,
      abortReason: result.abortReason ?? null,
      durationMs,
    });
  } catch (err) {
    console.error("POST /api/collect error:", err);
    return NextResponse.json(
      { error: "Collection failed", detail: String(err) },
      { status: 500 }
    );
  }
}
