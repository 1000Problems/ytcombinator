"use client";

import { useState, useEffect, useCallback } from "react";
import { createT, getSavedLocale, saveLocale, Locale } from "@/lib/i18n";
import { getSavedTheme, saveTheme, applyTheme, Theme } from "@/lib/theme";
import { formatCurrency, formatNumber as formatNum } from "@/lib/format";

// ---- Types ------------------------------------------------------------------------------------------------------------------------

interface Keyword {
  id: number;
  keyword: string;
  category: string | null;
  tags: string[];
  is_targeted: boolean;
  is_active: boolean;
  coppa_flag: string;
  added_at: string;
  last_queried: string | null;
  results_count: number | null;
  your_rank: number | null;
  rank_7d_ago: number | null;
  top5_views_sum: number | null;
  unique_channel_count: number | null;
  demand_supply: number | null;
  revenue_est: number | null;
  revenue_est_low: number | null;
  revenue_est_high: number | null;
  cpm_mid: number | null;
  annual_value: number | null;
}

/** Result from the research preview (before adding to portfolio). */
interface ResearchPreview {
  id: number;
  keyword: string;
  tags: string[];
  demand_supply: number | null;
  revenue_est: number | null;
  revenue_est_low: number | null;
  revenue_est_high: number | null;
  unique_channel_count: number | null;
  top5_views_sum: number | null;
  results_count: number | null;
  cpm_mid: number | null;
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

type FilterMode = "all" | "starred" | "pending" | "today";
type SortKey = "keyword" | "category" | "your_rank" | "top5_views_sum" | "unique_channel_count" | "demand_supply" | "revenue_est" | "annual_value" | "results_count" | "last_queried";
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
  if (current === null) return <span style={{ color: "var(--text-muted)" }}>--</span>;
  if (weekAgo === null) {
    return <span style={{ color: "var(--text-tertiary)" }}>{current} <span className="text-blue-500 text-xs">{t("rank.new")}</span></span>;
  }
  const diff = weekAgo - current;
  if (diff > 0) {
    return <span style={{ color: "var(--text-secondary)" }}>{current} <span className="text-green-500">^{diff}</span></span>;
  }
  if (diff < 0) {
    return <span style={{ color: "var(--text-secondary)" }}>{current} <span className="text-red-500">v{Math.abs(diff)}</span></span>;
  }
  return <span style={{ color: "var(--text-secondary)" }}>{current} <span style={{ color: "var(--text-muted)" }}>--</span></span>;
}

// formatCurrency and formatNumber imported from @/lib/format
const formatNumber = formatNum;

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

function QuotaGauge({ logs }: { logs: LogEntry[] }) {
  const todayLog = logs.find((l) => {
    const logDate = new Date(l.run_at).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    return logDate === today;
  });
  const used = todayLog?.quota_used ?? 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "var(--quota-track)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min((used / 10_000) * 100, 100)}%`,
            backgroundColor: used > 8_000 ? "#f97316" : used > 5_000 ? "#eab308" : "#22c55e",
          }}
        />
      </div>
      <span className="tabular-nums" style={{ color: "var(--text-tertiary)" }}>
        {used.toLocaleString()} / 10,000
      </span>
    </div>
  );
}

function StatusBadge({ status, t }: { status: "stale" | "pending" | null; t: (k: string) => string }) {
  if (!status) return null;
  const colors = {
    stale: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
    pending: "bg-red-500/20 text-red-500 border-red-500/30",
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
    return <div className="py-3 px-6 text-sm" style={{ color: "var(--text-muted)" }}>{t("preview.loading")}</div>;
  }
  if (error) {
    return <div className="py-3 px-6 text-red-500 text-sm">{t("preview.error")}</div>;
  }
  if (rankings.length === 0) {
    return <div className="py-3 px-6 text-sm" style={{ color: "var(--text-muted)" }}>{t("preview.empty")}</div>;
  }

  return (
    <div className="py-2 px-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs" style={{ color: "var(--text-muted)" }}>
            <th className="text-left py-1 w-10">#</th>
            <th className="text-left py-1">{t("preview.video")}</th>
            <th className="text-left py-1">{t("preview.channel")}</th>
            <th className="text-right py-1">{t("preview.views")}</th>
            <th className="text-right py-1">{t("th.revenue_est")}</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((r) => (
            <tr key={r.rank_position} style={{ color: "var(--text-secondary)" }}>
              <td className="py-1" style={{ color: "var(--text-muted)" }}>{r.rank_position}</td>
              <td className="py-1 truncate max-w-xs">
                <a
                  href={`https://youtube.com/watch?v=${r.video_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  {r.video_title || r.video_id}
                </a>
              </td>
              <td className="py-1 truncate max-w-[120px]" style={{ color: "var(--text-tertiary)" }}>{r.channel_name || "--"}</td>
              <td className="py-1 text-right tabular-nums">{formatNumber(r.view_count)}</td>
              <td className="py-1 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>{formatCurrency(r.view_count !== null ? (r.view_count * 5) / 1000 : null)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Research Bar (replaces old AddKeywordForm) ----------------------------------------------------------------------------------

function ResearchBar({
  onAdded,
  t,
}: {
  onAdded: () => void;
  t: (k: string) => string;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ResearchPreview | null>(null);
  const [added, setAdded] = useState(false);

  async function handleResearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setPreview(null);
    setAdded(false);

    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: trimmed,
          collect_inline: true,
        }),
      });

      if (res.status === 409) {
        setError(t("research.error_exists"));
        return;
      }
      if (!res.ok) {
        setError(t("research.error"));
        return;
      }

      // POST now returns enriched metrics directly after inline collection
      const created = await res.json();
      setPreview({
        id: created.id,
        keyword: created.keyword,
        tags: created.tags ?? [],
        demand_supply: created.demand_supply ?? null,
        revenue_est: created.revenue_est ?? null,
        revenue_est_low: created.revenue_est_low ?? null,
        revenue_est_high: created.revenue_est_high ?? null,
        unique_channel_count: created.unique_channel_count ?? null,
        top5_views_sum: created.top5_views_sum ?? null,
        results_count: created.results_count ?? null,
        cpm_mid: created.cpm_mid ?? null,
      });
      setAdded(true);
      onAdded();
      setInput("");
    } catch {
      setError(t("research.error_network"));
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    setPreview(null);
    setAdded(false);
    setError(null);
  }

  return (
    <div>
      <form onSubmit={handleResearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-muted)" }}>+</span>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            placeholder={t("research.placeholder")}
            className="w-full rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-red-500/50 transition-colors"
            style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors min-w-[120px]"
        >
          {loading ? t("research.collecting") : t("research.button")}
        </button>
        {input.trim() && !loading && (
          <span className="text-xs" style={{ color: "var(--text-dim)" }}>{t("research.quota_hint")}</span>
        )}
        {error && <span className="text-red-500 text-sm">{error}</span>}
      </form>

      {/* Preview card */}
      {preview && (
        <div className="mt-3 rounded-lg px-4 py-3 flex items-center gap-4 text-sm animate-in fade-in" style={{ background: "var(--card-bg-subtle)", border: "1px solid var(--border-subtle)" }}>
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>{preview.keyword}</span>
          <span className={`tabular-nums font-semibold ${dsColor(preview.demand_supply)}`}>
            {t("th.demand_supply")} {formatNumber(preview.demand_supply)}
          </span>
          <span className="tabular-nums" style={{ color: "var(--text-tertiary)" }}>
            {t("th.revenue_est")}{" "}
            {preview.revenue_est_low != null && preview.revenue_est_high != null
              ? `${formatCurrency(preview.revenue_est_low)} - ${formatCurrency(preview.revenue_est_high)}`
              : formatCurrency(preview.revenue_est)}
          </span>
          {preview.unique_channel_count != null && (
            <span className="tabular-nums" style={{ color: "var(--text-muted)" }}>
              {t("th.unique_channels")} {preview.unique_channel_count}
            </span>
          )}
          {preview.tags.length > 0 && (
            <span className="flex gap-1">
              {preview.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--badge-bg)", color: "var(--text-tertiary)" }}>{tag}</span>
              ))}
            </span>
          )}
          <span className="ml-auto flex gap-2 items-center">
            {added && <span className="text-green-500 text-xs">{t("research.added")}</span>}
            <button
              onClick={handleDismiss}
              className="text-xs transition-colors"
              style={{ color: "var(--text-muted)" }}
            >
              {t("research.dismiss")}
            </button>
          </span>
        </div>
      )}
    </div>
  );
}

function CollectionLog({ logs, t }: { logs: LogEntry[]; t: (k: string) => string }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (logs.length === 0) {
    return (
      <p className="text-sm py-4" style={{ color: "var(--text-muted)" }}>
        {t("log.empty")}
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-xs" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>
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
              className="cursor-pointer transition-colors"
              style={{ borderBottom: "1px solid var(--table-border)" }}
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            >
              <td className="py-2" style={{ color: "var(--text-secondary)" }}>
                {new Date(log.run_at).toLocaleString()}
              </td>
              <td className="py-2 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {log.keywords_queried}
              </td>
              <td className="py-2 text-right tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {log.quota_used.toLocaleString()}
              </td>
              <td className="py-2 text-right">
                {log.errors && log.errors.length > 0 ? (
                  <span className="text-red-500">{log.errors.length}</span>
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>0</span>
                )}
              </td>
              <td className="py-2 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : "--"}
              </td>
            </tr>
            {expandedId === log.id && log.errors && log.errors.length > 0 && (
              <tr key={`${log.id}-errors`}>
                <td colSpan={5} className="py-2 px-4" style={{ background: "var(--table-header-bg)" }}>
                  <ul className="text-xs text-red-500 space-y-1">
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
  const [filter, setFilterState] = useState<FilterMode>("all");
  const [sort, setSort] = useState<SortState>({ key: "demand_supply", dir: "desc" });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collecting, setCollecting] = useState(false);
  const [collectResult, setCollectResult] = useState<string | null>(null);
  const [coppaMode, setCoppaMode] = useState<"made_for_kids" | "family_general">("made_for_kids");
  const [region, setRegionState] = useState<"us_en" | "us_es" | "latam_es">("us_en");
  const [theme, setTheme] = useState<Theme>("light");

  // Load saved locale + theme + filter from URL on mount
  useEffect(() => {
    setLocale(getSavedLocale());
    const saved = getSavedTheme();
    setTheme(saved);
    applyTheme(saved);
    // Restore filter from URL
    const params = new URLSearchParams(window.location.search);
    const urlFilter = params.get("filter") as FilterMode | null;
    if (urlFilter && ["all", "starred", "pending", "today"].includes(urlFilter)) {
      setFilterState(urlFilter);
    }
    const urlRegion = params.get("region") as "us_en" | "us_es" | "latam_es" | null;
    if (urlRegion && ["us_en", "us_es", "latam_es"].includes(urlRegion)) {
      setRegionState(urlRegion);
    }
  }, []);

  const t = createT(locale);
  const timeAgo = makeTimeAgo(t);

  function setFilter(f: FilterMode) {
    setFilterState(f);
    const params = new URLSearchParams(window.location.search);
    if (f === "all") {
      params.delete("filter");
    } else {
      params.set("filter", f);
    }
    const qs = params.toString();
    window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
  }

  function setRegion(r: "us_en" | "us_es" | "latam_es") {
    setRegionState(r);
    const params = new URLSearchParams(window.location.search);
    if (r === "us_en") {
      params.delete("region");
    } else {
      params.set("region", r);
    }
    const qs = params.toString();
    window.history.replaceState({}, "", qs ? `?${qs}` : window.location.pathname);
  }

  function handleLocaleChange(l: Locale) {
    setLocale(l);
    saveLocale(l);
  }

  function handleThemeChange(th: Theme) {
    setTheme(th);
    saveTheme(th);
    applyTheme(th);
  }

  const fetchData = useCallback(async () => {
    try {
      // Map UI filter names to API filter names
      const apiFilter = filter === "starred" ? "targeted" : filter === "today" ? "today" : filter;
      const params = new URLSearchParams();
      if (filter !== "all") params.set("filter", apiFilter);
      params.set("coppa_flag", coppaMode);
      params.set("region", region);
      const qs = params.toString();
      const [kwRes, logRes] = await Promise.all([
        fetch(`/api/keywords?${qs}`),
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
  }, [filter, coppaMode, region]);

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

  // Client-side search: match against keyword text, category, and auto-tags
  const searchLower = searchQuery.toLowerCase().trim();
  const filteredKeywords = searchLower
    ? keywords.filter((kw) => {
        if (kw.keyword.toLowerCase().includes(searchLower)) return true;
        if (kw.category && kw.category.toLowerCase().includes(searchLower)) return true;
        if (kw.tags && kw.tags.some((tag) => tag.includes(searchLower))) return true;
        return false;
      })
    : keywords;

  const sortedKeywords = [...filteredKeywords].sort((a, b) => {
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
    { labelKey: "filter.starred", value: "starred" },
    { labelKey: "filter.pending", value: "pending" },
    { labelKey: "filter.today", value: "today" },
  ];

  return (
    <div className="min-h-screen transition-colors" style={{ background: "var(--page-bg)", color: "var(--text-primary)" }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4" style={{ borderBottom: "1px solid var(--nav-border)" }}>
        <div className="flex items-center gap-4">
          <a href="/" className="text-lg font-semibold tracking-tight">
            <span className="text-red-500">YT</span>Combinator
          </a>
          <LanguageToggle locale={locale} onChange={handleLocaleChange} />
          <ThemeToggle theme={theme} onChange={handleThemeChange} />
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/analyze"
            className="text-sm transition-colors"
            style={{ color: "var(--text-tertiary)" }}
          >
            {t("nav.analyze")}
          </a>
          <QuotaGauge logs={logs} />
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

      <main className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-medium" style={{ color: "var(--text-secondary)" }}>{t("dash.title")}</h1>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>{keywords.length} {t("dash.keyword_count")}</span>
        </div>

        {/* Search + Research bars */}
        <div className="flex gap-3 mb-4">
          {/* Search (filter existing) */}
          <div className="relative flex-1 max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full rounded-lg pl-9 pr-8 py-2 text-sm focus:outline-none transition-colors"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Search result count */}
        {searchQuery && (
          <div className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            {t("search.results")} {sortedKeywords.length} / {keywords.length}
          </div>
        )}

        {/* Research new keyword */}
        <div className="mb-5">
          <ResearchBar onAdded={fetchData} t={t} />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className="px-3 py-1 text-sm rounded-lg transition-colors"
                style={{
                  background: filter === btn.value ? "var(--filter-active-bg)" : "transparent",
                  color: filter === btn.value ? "var(--text-primary)" : "var(--text-muted)",
                }}
              >
                {t(btn.labelKey)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Region toggle */}
            <div className="flex items-center gap-1 text-xs rounded-lg px-1 py-0.5" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }} title={t("region.tooltip")}>
              {([["us_en", "region.us_en"], ["us_es", "region.us_es"], ["latam_es", "region.latam_es"]] as const).map(([val, labelKey]) => (
                <button
                  key={val}
                  onClick={() => setRegion(val)}
                  className="px-2 py-1 rounded transition-colors"
                  style={{
                    background: region === val ? "var(--filter-active-bg)" : "transparent",
                    color: region === val ? "var(--text-primary)" : "var(--text-muted)",
                  }}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
            {/* COPPA toggle */}
            <div className="flex items-center gap-1 text-xs rounded-lg px-1 py-0.5" style={{ background: "var(--input-bg)", border: "1px solid var(--border)" }}>
              <button
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
            {collectResult && (
              <span className="text-xs text-green-500">{collectResult}</span>
            )}
            <button
              onClick={handleCollectAll}
              disabled={collecting}
              className="px-3 py-1 text-sm rounded-lg disabled:opacity-50 transition-colors"
              style={{ background: "var(--input-bg)", border: "1px solid var(--border)", color: "var(--text-tertiary)" }}
            >
              {collecting ? t("collect.running") : t("collect.button")}
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg p-4 mb-4" style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)" }}>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="text-red-500 text-sm underline mt-1"
            >
              {t("action.retry")}
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "var(--skeleton)" }} />
            ))}
          </div>
        )}

        {/* Portfolio Valuation Card — visible only in Starred view */}
        {!loading && !error && filter === "starred" && keywords.length > 0 && (() => {
          const portfolioAnnual = keywords
            .filter((kw) => kw.is_targeted && kw.annual_value != null)
            .reduce((sum, kw) => sum + Number(kw.annual_value), 0);
          const portfolioValuation = portfolioAnnual * 2.5;
          return (
            <div className="rounded-lg px-5 py-4 mb-4 flex items-center gap-6 text-sm" style={{ background: "var(--card-bg-subtle)", border: "1px solid var(--border-subtle)" }}>
              <div>
                <span style={{ color: "var(--text-muted)" }}>{t("valuation.annual_revenue")}</span>
                <span className="ml-2 font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCurrency(portfolioAnnual)}</span>
              </div>
              <div style={{ width: 1, height: 24, background: "var(--border)" }} />
              <div>
                <span style={{ color: "var(--text-muted)" }}>{t("valuation.portfolio_value")}</span>
                <span className="ml-2 font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>{formatCurrency(portfolioValuation)}</span>
              </div>
              <span className="text-xs ml-auto" style={{ color: "var(--text-dim)" }}>{t("valuation.methodology")}</span>
            </div>
          );
        })()}

        {/* Keyword table */}
        {!loading && !error && (
          <>
            {keywords.length === 0 ? (
              <div className="text-center py-16">
                <p className="mb-2" style={{ color: "var(--text-muted)" }}>{t("empty.title")}</p>
                <p className="text-sm" style={{ color: "var(--text-dim)" }}>
                  {t("empty.subtitle")}
                </p>
              </div>
            ) : (
              <div className="rounded-lg overflow-x-auto" style={{ border: "1px solid var(--border)" }}>
                <table className="w-full text-sm" style={{ minWidth: 1100 }}>
                  <thead>
                    <tr className="text-xs" style={{ color: "var(--text-muted)", borderBottom: "1px solid var(--border)", background: "var(--table-header-bg)" }}>
                      <th className="w-8 py-2.5 px-2"></th>
                      <th className="text-center py-2.5 px-2 w-8">★</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" title={t("tip.demand_supply")} onClick={() => toggleSort("demand_supply")}>{t("th.demand_supply")}{sortIndicator("demand_supply")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" title={t("tip.revenue_est")} onClick={() => toggleSort("revenue_est")}>{t("th.revenue_est")}{sortIndicator("revenue_est")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" title={t("tip.annual_value")} onClick={() => toggleSort("annual_value")}>{t("th.annual_value")}{sortIndicator("annual_value")}</th>
                      <th className="text-left py-2.5 px-4 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("keyword")}>{t("th.keyword")}{sortIndicator("keyword")}</th>
                      <th className="text-left py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("category")}>{t("th.category")}{sortIndicator("category")}</th>
                      <th className="text-center py-2.5 px-3">{t("th.status")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("your_rank")}>{t("th.your_rank")}{sortIndicator("your_rank")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("top5_views_sum")}>{t("th.top5_views")}{sortIndicator("top5_views_sum")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" title={t("tip.unique_channels")} onClick={() => toggleSort("unique_channel_count")}>{t("th.unique_channels")}{sortIndicator("unique_channel_count")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("results_count")}>{t("th.results")}{sortIndicator("results_count")}</th>
                      <th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity" onClick={() => toggleSort("last_queried")}>{t("th.last_collected")}{sortIndicator("last_queried")}</th>
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
                            className="cursor-pointer transition-colors"
                            style={{
                              borderBottom: "1px solid var(--table-border)",
                              background: isExpanded ? "var(--table-row-hover)" : "transparent",
                            }}
                            onClick={() => setExpandedId(isExpanded ? null : kw.id)}
                          >
                            <td className="py-2 px-2 text-center">
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-transform duration-150 inline-block"
                                style={{
                                  color: "var(--text-muted)",
                                  transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                                }}
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleStar(kw); }}
                                className="text-sm transition-colors"
                                style={{ color: kw.is_targeted ? "#eab308" : "var(--text-dim)" }}
                                title={kw.is_targeted ? t("action.unstar") : t("action.star")}
                              >
                                ★
                              </button>
                            </td>
                            <td className={`py-2 px-3 text-right tabular-nums font-semibold ${dsColor(kw.demand_supply)}`}>
                              {formatNumber(kw.demand_supply)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                              {kw.revenue_est_low != null && kw.revenue_est_high != null
                                ? `${formatCurrency(kw.revenue_est_low)} - ${formatCurrency(kw.revenue_est_high)}`
                                : formatCurrency(kw.revenue_est)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                              {formatCurrency(kw.annual_value)}
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
                                  {kw.keyword}
                                </span>
                                {kw.tags && kw.tags.length > 0 && (
                                  <span className="flex gap-1">
                                    {kw.tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        onClick={(e) => { e.stopPropagation(); setSearchQuery(tag); }}
                                        className="px-1.5 py-0.5 rounded text-[10px] cursor-pointer transition-colors"
                                        style={{ background: "var(--badge-bg)", color: "var(--text-muted)" }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 px-3" style={{ color: "var(--text-muted)" }}>
                              {kw.category || "--"}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <StatusBadge status={badge} t={t} />
                            </td>
                            <td className="py-2 px-3 text-right">
                              {rankDelta(kw.your_rank, kw.rank_7d_ago, t)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                              {formatNumber(kw.top5_views_sum)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                              {kw.unique_channel_count ?? "--"}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                              {kw.results_count ?? "--"}
                            </td>
                            <td className="py-2 px-3 text-right" style={{ color: "var(--text-muted)" }}>
                              {timeAgo(kw.last_queried)}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${kw.id}-preview`}>
                              <td colSpan={13} style={{ background: "var(--table-header-bg)", borderBottom: "1px solid var(--table-border)" }}>
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

            {/* (Research bar is above the table now) */}
          </>
        )}

        {/* Collection Log */}
        <div className="mt-12">
          <h2 className="text-lg font-medium mb-4" style={{ color: "var(--text-secondary)" }}>{t("log.title")}</h2>
          <div className="rounded-lg overflow-hidden px-4" style={{ border: "1px solid var(--border)" }}>
            <CollectionLog logs={logs} t={t} />
          </div>

          {/* ── Formula Explanations ── */}
          <div className="rounded-xl p-6 mt-6" style={{ background: "var(--formula-bg)", border: "1px solid var(--formula-border)" }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              {t("formula.title")}
            </h2>
            <div className="space-y-5 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              <div>
                <h3 className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{t("formula.channels_title")}</h3>
                <p>{t("formula.channels_desc")}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{t("formula.ds_title")}</h3>
                <p>{t("formula.ds_desc")}</p>
              </div>
              <div>
                <h3 className="font-medium mb-1" style={{ color: "var(--text-primary)" }}>{t("formula.rev_title")}</h3>
                <p>{t("formula.rev_desc")}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  async function handleCollectAll() {
    if (collecting) return;
    setCollecting(true);
    setCollectResult(null);
    try {
      const res = await fetch("/api/collect", { method: "POST" });
      if (!res.ok) throw new Error("collect failed");
      const data = await res.json();
      setCollectResult(
        `${data.keywordsQueried} keywords, ${data.quotaUsed} quota`
      );
      fetchData(); // refresh table
      // Clear result message after a few seconds
      setTimeout(() => setCollectResult(null), 5000);
    } catch {
      setCollectResult("Error");
      setTimeout(() => setCollectResult(null), 5000);
    } finally {
      setCollecting(false);
    }
  }

  async function handleToggleStar(kw: Keyword) {
    // Optimistic update: toggle locally first for instant feedback
    setKeywords((prev) =>
      prev.map((k) => (k.id === kw.id ? { ...k, is_targeted: !k.is_targeted } : k))
    );
    try {
      await fetch("/api/keywords", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [kw.id],
          is_targeted: !kw.is_targeted,
        }),
      });
    } catch {
      // Revert on failure
      setKeywords((prev) =>
        prev.map((k) => (k.id === kw.id ? { ...k, is_targeted: kw.is_targeted } : k))
      );
    }
  }
}
