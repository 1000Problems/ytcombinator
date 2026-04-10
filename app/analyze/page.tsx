"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createT, getSavedLocale, saveLocale, Locale } from "@/lib/i18n";
import { getSavedTheme, saveTheme, applyTheme, Theme } from "@/lib/theme";
import { formatCurrency, formatNumber } from "@/lib/format";

// ---- Types --------------------------------------------------------

interface AnalyzedVideo {
  id: number;
  video_id: string;
  channel_id: string;
  channel_name: string | null;
  channel_subs: number | null;
  channel_views: number | null;
  channel_videos: number | null;
  video_title: string | null;
  video_description: string | null;
  video_tags: string[] | null;
  video_category: string | null;
  youtube_category_id: number | null;
  duration_seconds: number | null;
  published_at: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  thumbnail_url: string | null;
  engagement_rate: number | null;
  views_per_day: number | null;
  est_monthly_views: number | null;
  outlier_score: number | null;
  seo_score: number | null;
  revenue_region: string | null;
  revenue_coppa: string | null;
  revenue_est_low: number | null;
  revenue_est_mid: number | null;
  revenue_est_high: number | null;
  annual_est: number | null;
  analyzed_at: string | null;
  updated_at: string | null;
}

type SortKey = "revenue_est_mid" | "view_count" | "outlier_score" | "seo_score" | "engagement_rate" | "analyzed_at" | "video_title" | "channel_name" | "annual_est";
type SortDir = "asc" | "desc";

// ---- Helpers --------------------------------------------------------

function formatDuration(seconds: number | null): string {
  if (!seconds) return "--";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString();
}

function outlierColor(score: number | null): string {
  if (score === null) return "var(--text-muted)";
  if (score >= 2) return "#22c55e";
  if (score >= 0.5) return "#eab308";
  return "#ef4444";
}

function seoBarColor(score: number | null): string {
  if (score === null) return "var(--text-muted)";
  if (score >= 70) return "#22c55e";
  if (score >= 40) return "#eab308";
  return "#ef4444";
}

// ---- Components ----------------------------------------------------

function LanguageToggle({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => onChange("es")}
        className="px-1.5 py-0.5 rounded transition-colors"
        style={{
          backgroundColor: locale === "es" ? "var(--active-toggle-bg)" : "transparent",
          color: locale === "es" ? "var(--active-toggle-text)" : "var(--text-muted)",
        }}
      >
        ES
      </button>
      <button
        onClick={() => onChange("en")}
        className="px-1.5 py-0.5 rounded transition-colors"
        style={{
          backgroundColor: locale === "en" ? "var(--active-toggle-bg)" : "transparent",
          color: locale === "en" ? "var(--active-toggle-text)" : "var(--text-muted)",
        }}
      >
        EN
      </button>
    </div>
  );
}

function ThemeToggle({ theme, onChange }: { theme: Theme; onChange: (t: Theme) => void }) {
  return (
    <button
      onClick={() => onChange(theme === "light" ? "dark" : "light")}
      className="p-1.5 rounded transition-colors"
      style={{ color: "var(--text-tertiary)" }}
      title={theme === "light" ? "Dark mode" : "Light mode"}
    >
      {theme === "light" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}

function VideoCard({ video, t }: { video: AnalyzedVideo; t: (k: string) => string }) {
  const tags = video.video_tags ?? [];

  return (
    <div
      className="rounded-lg p-6 mb-6 card-elevated-lg animate-slide-up"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
    >
      <div className="flex gap-6 flex-col md:flex-row">
        {/* Left: Video Info */}
        <div className="flex-shrink-0 w-full md:w-80">
          {video.thumbnail_url && (
            <a
              href={`https://youtube.com/watch?v=${video.video_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src={video.thumbnail_url}
                alt={video.video_title ?? ""}
                className="w-full rounded-lg mb-3"
              />
            </a>
          )}
          <h3
            className="font-bold text-base mb-1 line-clamp-2 font-display"
            style={{ color: "var(--text-primary)" }}
          >
            {video.video_title ?? video.video_id}
          </h3>
          <div className="text-sm mb-1" style={{ color: "var(--text-tertiary)" }}>
            {video.channel_name ?? "--"} &middot; {formatNumber(video.channel_subs)} subscribers
          </div>
          <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {formatDate(video.published_at)} &middot; {formatDuration(video.duration_seconds)}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
              {tags.slice(0, 10).map((tag, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--tech-badge-bg)",
                    border: "1px solid var(--tech-badge-border)",
                    color: "var(--tech-badge-text)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: Metrics Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Est. Monthly Revenue */}
          <MetricCell
            label={t("metric.est_monthly")}
            value={formatCurrency(video.revenue_est_mid)}
            sub={`${formatCurrency(video.revenue_est_low)} - ${formatCurrency(video.revenue_est_high)}`}
          />
          {/* Annual Projection */}
          <MetricCell
            label={t("metric.annual")}
            value={formatCurrency(video.annual_est)}
          />
          {/* Views Per Day */}
          <MetricCell
            label={t("metric.views_per_day")}
            value={formatNumber(video.views_per_day)}
          />
          {/* Outlier Score */}
          <MetricCell
            label={t("metric.outlier")}
            value={video.outlier_score != null ? Number(video.outlier_score).toFixed(2) + "x" : "--"}
            valueColor={outlierColor(video.outlier_score != null ? Number(video.outlier_score) : null)}
          />
          {/* Engagement Rate */}
          <MetricCell
            label={t("metric.engagement")}
            value={video.engagement_rate != null ? Number(video.engagement_rate).toFixed(2) + "%" : "--"}
          />
          {/* SEO Score */}
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{t("metric.seo_score")}</div>
            <div className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {video.seo_score ?? "--"}/100
            </div>
            <div className="w-full h-1.5 rounded-full mt-1" style={{ background: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${video.seo_score ?? 0}%`,
                  backgroundColor: seoBarColor(video.seo_score),
                }}
              />
            </div>
          </div>
          {/* Total Views */}
          <MetricCell
            label={t("metric.total_views")}
            value={formatNumber(video.view_count)}
          />
          {/* Likes / Comments */}
          <MetricCell
            label={t("metric.likes_comments")}
            value={`${formatNumber(video.like_count)} / ${formatNumber(video.comment_count)}`}
          />
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  label,
  value,
  sub,
  valueColor,
}: {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div>
      <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className="font-semibold tabular-nums" style={{ color: valueColor ?? "var(--text-primary)" }}>
        {value}
      </div>
      {sub && (
        <div className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{sub}</div>
      )}
    </div>
  );
}

// ---- Main Page ------------------------------------------------------

export default function AnalyzePage() {
  const [locale, setLocale] = useState<Locale>("es");
  const [theme, setTheme] = useState<Theme>("light");
  const [url, setUrl] = useState("");
  const [coppaMode, setCoppaMode] = useState<"made_for_kids" | "family_general">("made_for_kids");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<AnalyzedVideo | null>(null);
  const [history, setHistory] = useState<AnalyzedVideo[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "revenue_est_mid", dir: "desc" });
  const [searchQuery, setSearchQuery] = useState("");
  const scrollBeforeSelectRef = useRef<number>(0);

  useEffect(() => {
    setLocale(getSavedLocale());
    const saved = getSavedTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  const t = createT(locale);

  function handleLocaleChange(l: Locale) {
    setLocale(l);
    saveLocale(l);
  }

  function handleThemeChange(th: Theme) {
    setTheme(th);
    saveTheme(th);
    applyTheme(th);
  }

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/analyze?sort=${sort.key}&dir=${sort.dir}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setHistory(data.videos);
    } catch {
      // silent — history will just be empty
    } finally {
      setHistoryLoading(false);
    }
  }, [sort.key, sort.dir]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || analyzing) return;

    setAnalyzing(true);
    setError(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed, region: "us_en", coppa_flag: coppaMode }),
      });

      if (res.status === 400) {
        const data = await res.json();
        setError(data.error ?? t("analyze.error_invalid"));
        return;
      }
      if (res.status === 404) {
        setError(t("analyze.error_not_found"));
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Analysis failed");
        return;
      }

      const video: AnalyzedVideo = await res.json();
      setSelectedVideo(video);
      setUrl("");
      // Refresh history
      fetchHistory();
    } catch {
      setError("Network error");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm(t("analyze.delete_confirm"))) return;
    await fetch(`/api/analyze/${id}`, { method: "DELETE" });
    setHistory((prev) => prev.filter((v) => v.id !== id));
    if (selectedVideo?.id === id) setSelectedVideo(null);
  }

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }
    );
  }

  function sortIndicator(key: SortKey): string {
    if (sort.key !== key) return "";
    return sort.dir === "desc" ? " \u25BC" : " \u25B2";
  }

  return (
    <div className="min-h-screen transition-colors" style={{ background: "var(--page-bg)", color: "var(--text-primary)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4" style={{ borderBottom: "1px solid var(--nav-border)", boxShadow: "var(--nav-shadow)" }}>
        <div className="flex items-center gap-4">
          <a href="/" className="text-lg font-semibold tracking-tight font-display">
            <span className="text-red-500">YT</span>Combinator
          </a>
          <LanguageToggle locale={locale} onChange={handleLocaleChange} />
          <ThemeToggle theme={theme} onChange={handleThemeChange} />
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="text-sm transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("nav.dashboard")}
          </a>
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/";
            }}
            className="text-sm transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            {t("nav.logout")}
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-6 animate-page-enter">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl font-semibold font-display" style={{ color: "var(--text-primary)" }}>{t("analyze.title")}</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>{t("analyze.subtitle")}</p>
        </div>

        {/* URL Input Section */}
        <form onSubmit={handleAnalyze} className="mb-6">
          <div className="flex gap-3 items-start flex-wrap">
            <div className="relative flex-1 min-w-[300px]">
              <input
                type="text"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null); }}
                placeholder={t("analyze.input_placeholder")}
                className={`w-full rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-red-500/50 transition-colors ${analyzing ? "animate-pulse" : ""}`}
                style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </div>
            <button
              type="submit"
              disabled={analyzing || !url.trim()}
              className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm px-5 py-2 rounded-lg btn-primary min-w-[120px]"
            >
              {analyzing ? t("analyze.analyzing") : t("analyze.button")}
            </button>
          </div>

          {/* COPPA toggle */}
          <div className="flex items-center gap-2 mt-3">
            {/* COPPA toggle */}
            <div className="flex items-center gap-1 text-xs rounded-lg px-1 py-0.5" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
              <button
                type="button"
                onClick={() => setCoppaMode("made_for_kids")}
                className="px-2 py-1 rounded transition-colors"
                style={{
                  background: coppaMode === "made_for_kids" ? "var(--filter-active-bg)" : "transparent",
                  color: coppaMode === "made_for_kids" ? "var(--text-primary)" : "var(--text-muted)",
                }}
                title={t("coppa.tooltip_kids")}
              >
                {t("coppa.kids")}
              </button>
              <button
                type="button"
                onClick={() => setCoppaMode("family_general")}
                className="px-2 py-1 rounded transition-colors"
                style={{
                  background: coppaMode === "family_general" ? "var(--filter-active-bg)" : "transparent",
                  color: coppaMode === "family_general" ? "var(--text-primary)" : "var(--text-muted)",
                }}
                title={t("coppa.tooltip_family")}
              >
                {t("coppa.family")}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </form>

        {/* Video Detail Card */}
        {selectedVideo && (
          <>
            <VideoCard video={selectedVideo} t={t} />
            <div className="flex justify-center mb-4 -mt-2">
              <button
                onClick={() => {
                  window.scrollTo({ top: scrollBeforeSelectRef.current, behavior: "smooth" });
                }}
                className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full btn-secondary"
                style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
                title="Back to list"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Back to list
              </button>
            </div>
          </>
        )}

        {/* History Table */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <h2 className="text-lg font-semibold font-display" style={{ color: "var(--text-primary)" }}>
              {t("analyze.history_title")}
            </h2>
            <div className="relative">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title…"
                className="rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
                style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)", width: 220 }}
              />
            </div>
          </div>

          {historyLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg skeleton-shimmer" />
              ))}
            </div>
          )}

          {!historyLoading && history.length === 0 && (
            <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
              {t("analyze.no_history")}
            </p>
          )}

          {!historyLoading && history.length > 0 && (() => {
            const filteredHistory = searchQuery.trim()
              ? history.filter((v) =>
                  (v.video_title ?? "").toLowerCase().includes(searchQuery.toLowerCase())
                )
              : history;
            return (
            <div className="rounded-lg overflow-x-auto card-elevated" style={{ border: "1px solid var(--border)" }}>
              {filteredHistory.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                  No videos match &ldquo;{searchQuery}&rdquo;
                </p>
              ) : (
              <table className="w-full text-sm" style={{ minWidth: 900 }}>
                <thead>
                  <tr className="text-xs" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)", background: "var(--table-header-bg)" }}>
                    <th className="py-2.5 px-2 w-16">{t("th.thumbnail")}</th>
                    <th className="text-left py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("video_title")}>{t("th.title")}{sortIndicator("video_title")}</th>
                    <th className="text-left py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("channel_name")}>{t("th.channel")}{sortIndicator("channel_name")}</th>
                    <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("view_count")}>{t("th.views")}{sortIndicator("view_count")}</th>
                    <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("revenue_est_mid")}>{t("th.est_monthly")}{sortIndicator("revenue_est_mid")}</th>
                    <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("annual_est")}>{t("th.annual_est")}{sortIndicator("annual_est")}</th>
                    <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("outlier_score")}>{t("th.outlier")}{sortIndicator("outlier_score")}</th>
                    <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("seo_score")}>{t("th.seo")}{sortIndicator("seo_score")}</th>
                    <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("engagement_rate")}>{t("th.engagement")}{sortIndicator("engagement_rate")}</th>
                    <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("analyzed_at")}>{t("th.analyzed")}{sortIndicator("analyzed_at")}</th>
                    <th className="w-10 py-2.5 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((v) => (
                    <tr
                      key={v.id}
                      className="cursor-pointer transition-colors"
                      style={{
                        borderBottom: "1px solid var(--table-border)",
                        background: selectedVideo?.id === v.id ? "var(--table-row-hover)" : "transparent",
                      }}
                      onClick={() => {
                        scrollBeforeSelectRef.current = window.scrollY;
                        setSelectedVideo(v);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <td className="py-2 px-2">
                        {v.thumbnail_url ? (
                          <img src={v.thumbnail_url} alt="" className="w-14 h-10 object-cover rounded" />
                        ) : (
                          <div className="w-14 h-10 rounded" style={{ background: "var(--skeleton)" }} />
                        )}
                      </td>
                      <td className="py-2 px-3 max-w-[200px]">
                        <div className="truncate font-medium" style={{ color: "var(--text-primary)" }}>
                          {v.video_title ?? v.video_id}
                        </div>
                      </td>
                      <td className="py-2 px-3 truncate max-w-[120px]" style={{ color: "var(--text-tertiary)" }}>
                        {v.channel_name ?? "--"}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {formatNumber(v.view_count)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {formatCurrency(v.revenue_est_mid)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                        {formatCurrency(v.annual_est)}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums" style={{ color: outlierColor(v.outlier_score != null ? Number(v.outlier_score) : null) }}>
                        {v.outlier_score != null ? Number(v.outlier_score).toFixed(1) + "x" : "--"}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {v.seo_score ?? "--"}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {v.engagement_rate != null ? Number(v.engagement_rate).toFixed(2) + "%" : "--"}
                      </td>
                      <td className="py-2 px-3 text-right text-xs" style={{ color: "var(--text-muted)" }}>
                        {formatDate(v.analyzed_at)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}
                          className="text-red-500 hover:text-red-400 transition-colors text-sm"
                          title={t("analyze.delete_confirm")}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
            );
          })()}
        </div>
      </main>
    </div>
  );
}
