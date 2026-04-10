import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { YOUTUBE_TO_YTC_CATEGORY, DEFAULT_CATEGORY } from "@/lib/category-map";

// ---- Helpers --------------------------------------------------------

const YT_API = "https://www.googleapis.com/youtube/v3";

function parseVideoId(input: string): string | null {
  const trimmed = input.trim();

  // Raw 11-char ID
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);

    // youtube.com/watch?v=VIDEO_ID
    if (url.hostname.includes("youtube.com") && url.searchParams.has("v")) {
      const v = url.searchParams.get("v")!;
      if (/^[A-Za-z0-9_-]{11}$/.test(v)) return v;
    }

    // youtu.be/VIDEO_ID
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }

    // youtube.com/shorts/VIDEO_ID
    if (url.hostname.includes("youtube.com") && url.pathname.startsWith("/shorts/")) {
      const id = url.pathname.split("/")[2];
      if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
    }
  } catch {
    // Not a URL — already tried raw ID above
  }

  return null;
}

function parseDuration(iso8601: string): number {
  const match = iso8601.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  return hours * 3600 + minutes * 60 + seconds;
}

function computeSeoScore(video: {
  tags: string[];
  title: string;
  description: string;
  categoryId: string | null;
}): number {
  let score = 0;

  // Has tags (15 pts)
  if (video.tags.length > 0) score += 15;
  // Tag count 10+ (10 pts)
  if (video.tags.length >= 10) score += 10;
  // Title length 30-70 chars (15 pts)
  if (video.title.length >= 30 && video.title.length <= 70) score += 15;
  // Description length 200+ chars (15 pts)
  if (video.description.length >= 200) score += 15;
  // Description has links (10 pts)
  if (video.description.includes("http")) score += 10;
  // Description has timestamps (10 pts)
  if (/\d{1,2}:\d{2}/.test(video.description)) score += 10;
  // Has category (10 pts)
  if (video.categoryId) score += 10;
  // Title has separator pattern (15 pts)
  if (/[|—\-]/.test(video.title)) score += 15;

  return Math.min(score, 100);
}

// ---- POST: Analyze a video ------------------------------------------

export async function POST(req: NextRequest) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
  }

  let body: { url?: string; region?: string; coppa_flag?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const videoId = parseVideoId(body.url ?? "");
  if (!videoId) {
    return NextResponse.json({ error: "Could not parse a video ID from that URL" }, { status: 400 });
  }

  const region = body.region ?? "us_en";
  const coppaFlag = body.coppa_flag ?? "made_for_kids";

  // 1. Fetch video data from YouTube
  const videoUrl = `${YT_API}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${apiKey}`;
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) {
    return NextResponse.json({ error: "YouTube API error (video)" }, { status: 502 });
  }
  const videoData = await videoRes.json();
  if (!videoData.items || videoData.items.length === 0) {
    return NextResponse.json({ error: "Video not found on YouTube" }, { status: 404 });
  }

  const item = videoData.items[0];
  const snippet = item.snippet;
  const stats = item.statistics;
  const contentDetails = item.contentDetails;

  const channelId = snippet.channelId;

  // 2. Fetch channel data from YouTube
  const channelUrl = `${YT_API}/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`;
  const channelRes = await fetch(channelUrl);
  if (!channelRes.ok) {
    return NextResponse.json({ error: "YouTube API error (channel)" }, { status: 502 });
  }
  const channelData = await channelRes.json();
  const channel = channelData.items?.[0];

  const channelName = channel?.snippet?.title ?? snippet.channelTitle ?? "";
  const channelSubs = parseInt(channel?.statistics?.subscriberCount ?? "0", 10);
  const channelViews = parseInt(channel?.statistics?.viewCount ?? "0", 10);
  const channelVideos = parseInt(channel?.statistics?.videoCount ?? "0", 10);

  // 3. Map category
  const youtubeCategoryId = parseInt(snippet.categoryId ?? "0", 10);
  const ytcCategory = YOUTUBE_TO_YTC_CATEGORY[youtubeCategoryId] ?? DEFAULT_CATEGORY;

  // 4. Look up CPM
  const cpmRow = await queryOne<{ cpm_low: number; cpm_mid: number; cpm_high: number }>(
    `SELECT cpm_low, cpm_mid, cpm_high FROM category_cpm
     WHERE category = $1 AND coppa_flag = $2 AND region = $3`,
    [ytcCategory, coppaFlag, region]
  );

  const cpmLow = cpmRow?.cpm_low ?? 1;
  const cpmMid = cpmRow?.cpm_mid ?? 3;
  const cpmHigh = cpmRow?.cpm_high ?? 5;

  // 5. Compute metrics
  const viewCount = parseInt(stats.viewCount ?? "0", 10);
  const likeCount = parseInt(stats.likeCount ?? "0", 10);
  const commentCount = parseInt(stats.commentCount ?? "0", 10);
  const publishedAt = new Date(snippet.publishedAt);
  const durationSeconds = parseDuration(contentDetails.duration ?? "PT0S");
  const tags: string[] = snippet.tags ?? [];
  const title: string = snippet.title ?? "";
  const description: string = snippet.description ?? "";
  const thumbnailUrl: string = snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? "";

  const daysSincePublish = Math.max(1, Math.floor((Date.now() - publishedAt.getTime()) / 86400000));
  const viewsPerDay = viewCount / daysSincePublish;
  const estMonthlyViews = Math.round(viewsPerDay * 30);
  const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;
  const avgViewsPerVideo = channelVideos > 0 ? channelViews / channelVideos : 0;
  const outlierScore = avgViewsPerVideo > 0 ? viewCount / avgViewsPerVideo : 0;
  const revenueEstLow = estMonthlyViews * cpmLow / 1000;
  const revenueEstMid = estMonthlyViews * cpmMid / 1000;
  const revenueEstHigh = estMonthlyViews * cpmHigh / 1000;
  const annualEst = revenueEstMid * 12;

  const seoScore = computeSeoScore({
    tags,
    title,
    description,
    categoryId: snippet.categoryId ?? null,
  });

  // 6. Upsert into analyzed_videos
  const row = await queryOne(
    `INSERT INTO analyzed_videos (
       video_id, channel_id, channel_name, channel_subs, channel_views, channel_videos,
       video_title, video_description, video_tags, video_category, youtube_category_id,
       duration_seconds, published_at, view_count, like_count, comment_count, thumbnail_url,
       engagement_rate, views_per_day, est_monthly_views, outlier_score, seo_score,
       revenue_region, revenue_coppa, revenue_est_low, revenue_est_mid, revenue_est_high,
       annual_est, analyzed_at, updated_at
     ) VALUES (
       $1, $2, $3, $4, $5, $6,
       $7, $8, $9, $10, $11,
       $12, $13, $14, $15, $16, $17,
       $18, $19, $20, $21, $22,
       $23, $24, $25, $26, $27,
       $28, NOW(), NOW()
     )
     ON CONFLICT (video_id) DO UPDATE SET
       channel_id = EXCLUDED.channel_id,
       channel_name = EXCLUDED.channel_name,
       channel_subs = EXCLUDED.channel_subs,
       channel_views = EXCLUDED.channel_views,
       channel_videos = EXCLUDED.channel_videos,
       video_title = EXCLUDED.video_title,
       video_description = EXCLUDED.video_description,
       video_tags = EXCLUDED.video_tags,
       video_category = EXCLUDED.video_category,
       youtube_category_id = EXCLUDED.youtube_category_id,
       duration_seconds = EXCLUDED.duration_seconds,
       published_at = EXCLUDED.published_at,
       view_count = EXCLUDED.view_count,
       like_count = EXCLUDED.like_count,
       comment_count = EXCLUDED.comment_count,
       thumbnail_url = EXCLUDED.thumbnail_url,
       engagement_rate = EXCLUDED.engagement_rate,
       views_per_day = EXCLUDED.views_per_day,
       est_monthly_views = EXCLUDED.est_monthly_views,
       outlier_score = EXCLUDED.outlier_score,
       seo_score = EXCLUDED.seo_score,
       revenue_region = EXCLUDED.revenue_region,
       revenue_coppa = EXCLUDED.revenue_coppa,
       revenue_est_low = EXCLUDED.revenue_est_low,
       revenue_est_mid = EXCLUDED.revenue_est_mid,
       revenue_est_high = EXCLUDED.revenue_est_high,
       annual_est = EXCLUDED.annual_est,
       updated_at = NOW()
     RETURNING *`,
    [
      videoId, channelId, channelName, channelSubs, channelViews, channelVideos,
      title, description, tags, ytcCategory, youtubeCategoryId,
      durationSeconds, publishedAt.toISOString(), viewCount, likeCount, commentCount, thumbnailUrl,
      engagementRate.toFixed(4), viewsPerDay.toFixed(2), estMonthlyViews, outlierScore.toFixed(2), seoScore,
      region, coppaFlag, revenueEstLow.toFixed(2), revenueEstMid.toFixed(2), revenueEstHigh.toFixed(2),
      annualEst.toFixed(2),
    ]
  );

  return NextResponse.json(row);
}

// ---- GET: List analyzed videos --------------------------------------

const ALLOWED_SORT_COLUMNS = new Set([
  "revenue_est_mid",
  "view_count",
  "outlier_score",
  "seo_score",
  "engagement_rate",
  "analyzed_at",
  "video_title",
  "channel_name",
  "annual_est",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sortParam = searchParams.get("sort") ?? "revenue_est_mid";
  const dirParam = searchParams.get("dir") ?? "desc";

  const sortCol = ALLOWED_SORT_COLUMNS.has(sortParam) ? sortParam : "revenue_est_mid";
  const sortDir = dirParam === "asc" ? "ASC" : "DESC";

  const rows = await query(
    `SELECT * FROM analyzed_videos ORDER BY ${sortCol} ${sortDir} NULLS LAST`
  );

  return NextResponse.json({ videos: rows, count: rows.length });
}
