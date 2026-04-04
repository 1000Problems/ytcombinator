"use client";

import { useState, useEffect, useCallback } from "react";
import { createT, getSavedLocale, saveLocale, Locale } from "@/lib/i18n";

// ---- Types ------------------------------------------------------------------------------------------------------------------------

interface Keyword {
  id: number;
  keyword: string;
  category: string | null;
  is_targeted: boolean;
  is_active: boolean;
  added_at: string;
  last_queried: string | null;
  results_count: number | null;
  your_rank: number | null;
  rank_7d_ago: number | null;
  top5_views_sum: number | null;
  unique_channel_count: number | null;
  demand_supply: number | null;
  revenue_est: number | null;
}

interface Ranking {
  rank_position: number;
  video_id: string;
  channel_id: string;
  channel_name: string | null;
  video_title: string | null;
  view_count: number | null;
  like_count: number | null;
  published_at: string | null;
}

interface LogEntry {
  id: number;
  run_at: string;
  keywords_queried: number;
  quota_used: number;
  errors: string[] | null;
  duration_ms: number | null;
}

type FilterMode = "all" | "targeted" | "active" | "inactive" | "pending";
type SortKey = "keyword" | "category" | "your_rank" | "top5_views_sum" | "unique_channel_count" | "demand_supply" | "revenue_est" | "results_count" | "last_queried";
type SortDir = "asc" | "desc";
interface SortState { key: SortKey; dir: SortDir }

// ---- Helpers --------------------------------------------------------------------------------------------------------------------

function makeTimeAgo(t: (k: string) => string) {
  return function timeAgo(dateStr: string | null): string {
    if (!dateStr) return t("time.never");
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins}${t("time.m_ago")}`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}${t("time.h_ago")}`;
    const days = Math.floor(hours / 24);
    return `${days}${t("time.d_ago")}`;
  };
}

function staleBadge(lastQueried: string | null): "stale" | "pending" | null {
  if (!lastQueried) return "pending";
  const days = (Date.now() - new Date(lastQueried).getTime()) / 86_400_000;
  if (days > 3) return "stale";
  return null;
}

function rankDelta(current: number | null, weekAgo: number | null, t: (k: string) => string): React.ReactNode {
  if (current === null) return <span className="text-gray-500">--</span>;
  if (weekAgo === null) {
    return <span className="text-gray-400">{current} <span className="text-blue-400 text-xs">{t("rank.new")}</span></span>;
  }
  const diff = weekAgo - current;
  if (diff > 0) {
    return <span className="text-gray-300">{current} <span className="text-green-500">^{diff}</span></span>;
  }
  if (diff < 0) {
    return <span className="text-gray-300">{current} <span className="text-red-400">v{Math.abs(diff)}</span></span>;
  }
  return <span className="text-gray-300">{current} <span className="text-gray-500">--</span></span>;
}

function formatNumber(n: number | string | null): string {
  if (n === null || n === undefined) return "--";
  const v = Number(n);
  if (isNaN(v)) return "--";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function formatCurrency(n: number | string | null): string {
  if (n === null || n === undefined) return "--";
  const v = Number(n);
  if (isNaN(v)) return "--";
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

/** Color code the D/S ratio: green = good opportunity, red = saturated */
function dsColor(ds: number | string | null): string {
  if (ds === null) return "text-gray-500";
  const v = Number(ds);
  if (isNaN(v)) return "text-gray-500";
  if (v >= 50_000) return "text-green-400";
  if (v >= 10_000) return "text-yellow-400";
  return "text-red-400";
}

// ---- Components --------------------------------------------------------------------------------------------------------------

function LanguageToggle({ locale, onChange }: { locale: Locale; onChange: (l: Locale) => void }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <button
        onClick={() => onChange("es")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "es" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
        }`}
      >
        ES
      </button>
      <button
        onClick={() => onChange("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "en" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
        }`}
      >
        EN
      </button>
    </div>
  );
}

function QuotaGauge({ logs }: { logs: LogEntry[] }) {
  const todayLog = logs.find((l) => {
    const logDate = new Date(l.run_at).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return logDate === today;
  });
  const used = todayLog?.quota_used ?? 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-24 h-2 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min((used / 10_000) * 100, 100)}%`,
            backgroundColor: used > 8_000 ? "#f97316" : used > 5_000 ? "#eab308" : "#22c55e",
          }}
        />
      </div>
      <span className="text-gray-400 tabular-nums">
        {used.toLocaleString()} / 10,000
      </span>
    </div>
  );
}

function StatusBadge({ status, t }: { status: "stale" | "pending" | null; t: (k: string) => string }) {
  if (!status) return null;
  const colors = {
    stale: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    pending: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const labels = {
    stale: t("status.stale"),
    pending: t("status.pending"),
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function KeywordPreview({ keywordId, t }: { keywordId: number; t: (k: string) => string }) {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/keywords/${keywordId}/rankings?limit=5`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => setRankings(data.rankings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [keywordId]);

  if (loading) {
    return <div className="py-3 px-6 text-gray-500 text-sm">{t("preview.loading")}</div>;
  }
  if (error) {
    return <div className="py-3 px-6 text-red-400 text-sm">{t("preview.error")}</div>;
  }
  if (rankings.length === 0) {
    return <div className="py-3 px-6 text-gray-500 text-sm">{t("preview.empty")}</div>;
  }

  return (
    <div className="py-2 px-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs">
            <th className="text-left py-1 w-10">#</th>
            <th className="text-left py-1">{t("preview.video")}</th>
            <th className="text-left py-1">{t("preview.channel")}</th>
            <th className="text-right py-1">{t("preview.views")}</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r) => (
            <tr key={r.rank_position} className="text-gray-300">
              <td className="py-1 text-gray-500">{r.rank_position}</td>
              <td className="py-1 truncate max-w-xs">
                <a
                  href={`https://youtube.com/watch?v=${r.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {r.video_title || r.video_id}
                </a>
              </td>
              <td className="py-1 text-gray-400 truncate max-w-[120px]">{r.channel_name || "--"}</td>
              <td className="py-1 text-right tabular-nums">{formatNumber(r.view_count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddKeywordForm({ onAdded, t }: { onAdded: () => void; t: (k: string) => string }) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [isTargeted, setIsTargeted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;

    setSubmitting(true);
    setCollecting(false);
    setError(null);

    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          category: category.trim() || null,
          is_targeted: isTargeted,
          collect_inline: true, // signal the API to wait for collection
        }),
      });

      if (res.status === 409) {
        setError(t("form.error_exists"));
        return;
      }
      if (!res.ok) {
        setError(t("form.error_add"));
        return;
      }

      // If the server collected inline, data is already in the DB.
      // If not (no API key), the keyword was still created.
      setKeyword("");
      setCategory("");
      setIsTargeted(false);
      onAdded();
    } catch {
      setError(t("form.error_network"));
    } finally {
      setSubmitting(false);
      setCollecting(false);
    }
  }

  // Determine button label
  let buttonLabel = t("form.add");
  if (submitting) buttonLabel = t("form.collecting");

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 py-3">
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder={t("form.placeholder_keyword")}
        className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-gray-600 w-64"
      />
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder={t("form.placeholder_category")}
        className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-gray-600 w-32"
      />
      <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isTargeted}
          onChange={(e) => setIsTargeted(e.target.checked)}
          className="rounded border-gray-600"
        />
        {t("form.targeted")}
      </label>
      <button
        type="submit"
        disabled={submitting || !keyword.trim()}
        className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors min-w-[140px]"
      >
        {buttonLabel}
      </button>
      {error && <span className="text-red-400 text-sm">{error}</span>}
      {keyword.trim() && !submitting && (
        <span className="text-gray-500 text-xs">{t("form.quota_hint")}</span>
      )}
    </form>
  );
}

function CollectionLog({ logs, t }: { logs: LogEntry[]; t: (k: string) => string }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (logs.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4">
        {t("log.empty")}
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-500 text-xs border-b border-gray-800">
          <th className="text-left py-2">{t("log.timestamp")}</th>
          <th className="text-right py-2">{t("log.keywords")}</th>
          <th className="text-right py-2">{t("log.quota")}</th>
          <th className="text-right py-2">{t("log.errors")}</th>
          <th className="text-right py-2">{t("log.duration")}</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <>
            <tr
              key={log.id}
              className="border-b border-gray-800/50 hover:bg-gray-800/30 cursor-pointer"
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            >
              <td className="py-2 text-gray-300">
                {new Date(log.run_at).toLocaleString()}
              </td>
              <td className="py-2 text-right tabular-nums text-gray-300">
                {log.keywords_queried}
              </td>
              <td className="py-2 text-right tabular-nums text-gray-300">
                {log.quota_used.toLocaleString()}
              </td>
              <td className="py-2 text-right">
                {log.errors && log.errors.length > 0 ? (
                  <span className="text-red-400">{log.errors.length}</span>
                ) : (
                  <span className="text-gray-500">0</span>
                )}
              </td>
              <td className="py-2 text-right tabular-nums text-gray-400">
                {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : "--"}
              </td>
            </tr>
            {expandedId === log.id && log.errors && log.errors.length > 0 && (
              <tr key={`${log.id}-errors`}>
                <td colSpan={5} className="py-2 px-4 bg-gray-900/50">
                  <ul className="text-xs text-red-400 space-y-1">
                    {log.errors.map((err, i) => (
                      <li key={i}>* {err}</li>
                    ))}
                  </ul>
                </td>
              </tr>
            )}
          </>
        ))}
      </tbody>
    </table>
  );
}

// ---- Main Dashboard ------------------------------------------------------------------------------------------------------

export default function DashboardPage() {
  const [locale, setLocale] = useState<Locale>("es");
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortState>({ key: "demand_supply", dir: "desc" });
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Load saved locale on mount
  useEffect(() => {
    setLocale(getSavedLocale());
  }, []);

  const t = createT(locale);
  const timeAgo = makeTimeAgo(t);

  function handleLocaleChange(l: Locale) {
    setLocale(l);
    saveLocale(l);
  }

  const fetchData = useCallback(async () => {
    try {
      const filterParam = filter === "all" ? "" : `?filter=${filter}`;
      const [kwRes, logRes] = await Promise.all([
        fetch(`/api/keywords${filterParam}`),
        fetch("/api/collection-log?limit=5"),
      ]);

      if (!kwRes.ok || !logRes.ok) throw new Error("Failed to load data");

      const kwData = await kwRes.json();
      const logData = await logRes.json();

      setKeywords(kwData.keywords);
      setLogs(logData.logs);
      setError(null);
    } catch (err) {
      setError(t("error.load"));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "desc" ? "asc" : "desc" } : { key, dir: "desc" }
    );
  }

  function sortIndicator(key: SortKey): string {
    if (sort.key !== key) return "";
    return sort.dir === "desc" ? " ▼" : " ▲";
  }

  const sortedKeywords = [...keywords].sort((a, b) => {
    const dir = sort.dir === "desc" ? 1 : -1;
    const k = sort.key;

    if (k === "keyword") {
      return dir * (b.keyword.localeCompare(a.keyword));
    }
    if (k === "category") {
      return dir * ((b.category ?? "").localeCompare(a.category ?? ""));
    }
    if (k === "last_queried") {
      const aT = a.last_queried ? new Date(a.last_queried).getTime() : 0;
      const bT = b.last_queried ? new Date(b.last_queried).getTime() : 0;
      return dir * (bT - aT);
    }
    // Numeric columns
    const aVal = Number(a[k] ?? 0) || 0;
    const bVal = Number(b[k] ?? 0) || 0;
    return dir * (bVal - aVal);
  });

  const filterButtons: { labelKey: string; value: FilterMode }[] = [
    { labelKey: "filter.all", value: "all" },
    { labelKey: "filter.targeted", value: "targeted" },
    { labelKey: "filter.active", value: "active" },
    { labelKey: "filter.pending", value: "pending" },
    { labelKey: "filter.inactive", value: "inactive" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800/50">
        <div className="flex items-center gap-4">
          <a href="/" className="text-lg font-semibold tracking-tight">
            <span className="text-red-500">YT</span>Combinator
          </a>
          <LanguageToggle locale={locale} onChange={handleLocaleChange} />
        </div>
        <QuotaGauge logs={logs} />
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-gray-200">{t("dash.title")}</h1>
          <span className="text-sm text-gray-500">{keywords.length} {t("dash.keyword_count")}</span>
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                  filter === btn.value
                    ? "bg-gray-800 text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t(btn.labelKey)}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-600">{t("sort.label")} {t(`th.${sort.key === "top5_views_sum" ? "top5_views" : sort.key === "demand_supply" ? "demand_supply" : sort.key === "unique_channel_count" ? "unique_channels" : sort.key === "revenue_est" ? "revenue_est" : sort.key === "results_count" ? "results" : sort.key === "last_queried" ? "last_collected" : sort.key}`)}{sortIndicator(sort.key)}</span>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="text-red-400 text-sm underline mt-1"
            >
              {t("action.retry")}
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-800/30 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Keyword table */}
        {!loading && !error && (
          <>
            {keywords.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-2">{t("empty.title")}</p>
                <p className="text-gray-600 text-sm">
                  {t("empty.subtitle")}
                </p>
              </div>
            ) : (
              <div className="border border-gray-800/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-gray-800/50 bg-gray-900/30">
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:text-gray-300 transition-colors" title={t("tip.demand_supply")} onClick={() => toggleSort("demand_supply")}>{t("th.demand_supply")}{sortIndicator("demand_supply")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:text-gray-300 transition-colors" title={t("tip.revenue_est")} onClick={() => toggleSort("revenue_est")}>{t("th.revenue_est")}{sortIndicator("revenue_est")}</th>
                      <th className="text-left py-2.5 px-4 cursor-pointer select-none hover:text-gray-300 transition-colors" onClick={() => toggleSort("keyword")}>{t("th.keyword")}{sortIndicator("keyword")}</th>
                      <th className="text-left py-2.5 px-3 cursor-pointer select-none hover:text-gray-300 transition-colors" onClick={() => toggleSort("category")}>{t("th.category")}{sortIndicator("category")}</th>
                      <th className="text-center py-2.5 px-3">{t("th.status")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:text-gray-300 transition-colors" onClick={() => toggleSort("your_rank")}>{t("th.your_rank")}{sortIndicator("your_rank")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:text-gray-300 transition-colors" onClick={() => toggleSort("top5_views_sum")}>{t("th.top5_views")}{sortIndicator("top5_views_sum")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:text-gray-300 transition-colors" title={t("tip.unique_channels")} onClick={() => toggleSort("unique_channel_count")}>{t("th.unique_channels")}{sortIndicator("unique_channel_count")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:text-gray-300 transition-colors" onClick={() => toggleSort("results_count")}>{t("th.results")}{sortIndicator("results_count")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:text-gray-300 transition-colors" onClick={() => toggleSort("last_queried")}>{t("th.last_collected")}{sortIndicator("last_queried")}</th>
                      <th className="text-center py-2.5 px-3">{t("th.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedKeywords.map((kw) => {
                      const badge = staleBadge(kw.last_queried);
                      const isExpanded = expandedId === kw.id;
                      return (
                        <>
                          <tr
                            key={kw.id}
                            className={`border-b border-gray-800/30 hover:bg-gray-800/20 cursor-pointer transition-colors ${
                              isExpanded ? "bg-gray-800/20" : ""
                            }`}
                            onClick={() => setExpandedId(isExpanded ? null : kw.id)}
                          >
                            <td className={`py-2 px-3 text-right tabular-nums font-semibold ${dsColor(kw.demand_supply)}`}>
                              {formatNumber(kw.demand_supply)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-gray-400">
                              {formatCurrency(kw.revenue_est)}
                            </td>
                            <td className="py-2 px-4 font-medium text-gray-200">
                              {kw.keyword}
                              {kw.is_targeted && (
                                <span className="ml-2 text-xs text-red-400">*</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-500">
                              {kw.category || "--"}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <StatusBadge status={badge} t={t} />
                              {!badge && kw.is_active && (
                                <span className="text-xs text-green-500">{t("status.active")}</span>
                              )}
                              {!kw.is_active && (
                                <span className="text-xs text-gray-600">{t("status.paused")}</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {rankDelta(kw.your_rank, kw.rank_7d_ago, t)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-gray-400">
                              {formatNumber(kw.top5_views_sum)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-gray-400">
                              {kw.unique_channel_count ?? "--"}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-gray-400">
                              {kw.results_count ?? "--"}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-500">
                              {timeAgo(kw.last_queried)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActive(kw);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-0.5 rounded transition-colors"
                              >
                                {kw.is_active ? t("action.pause") : t("action.resume")}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${kw.id}-preview`}>
                              <td colSpan={11} className="bg-gray-900/30 border-b border-gray-800/30">
                                <KeywordPreview keywordId={kw.id} t={t} />
                              </td>
                            </tr>
                          )}
                        </>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add keyword form */}
            <div className="mt-4">
              <AddKeywordForm onAdded={fetchData} t={t} />
            </div>
          </>
        )}

        {/* Collection Log */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-300 mb-4">{t("log.title")}</h2>
          <div className="border border-gray-800/50 rounded-lg overflow-hidden px-4">
            <CollectionLog logs={logs} t={t} />
          </div>

          {/* ── Formula Explanations ── */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-6 mt-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              {t("formula.title")}
            </h2>
            <div className="space-y-5 text-sm text-gray-300 leading-relaxed">
              <div>
                <h3 className="text-white font-medium mb-1">{t("formula.channels_title")}</h3>
                <p>{t("formula.channels_desc")}</p>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">{t("formula.ds_title")}</h3>
                <p>{t("formula.ds_desc")}</p>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">{t("formula.rev_title")}</h3>
                <p>{t("formula.rev_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  async function handleToggleActive(kw: Keyword) {
    try {
      await fetch("/api/keywords", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [kw.id],
          is_active: !kw.is_active,
        }),
      });
      fetchData();
    } catch {
      // Silent fail -- user will see stale state
    }
  }
}
