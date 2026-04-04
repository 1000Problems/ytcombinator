"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function staleBadge(lastQueried: string | null): "stale" | "pending" | null {
  if (!lastQueried) return "pending";
  const days = (Date.now() - new Date(lastQueried).getTime()) / 86_400_000;
  if (days > 3) return "stale";
  return null;
}

function rankDelta(current: number | null, weekAgo: number | null): React.ReactNode {
  if (current === null) return <span className="text-gray-500">—</span>;
  if (weekAgo === null) {
    return <span className="text-gray-400">{current} <span className="text-blue-400 text-xs">(new)</span></span>;
  }
  const diff = weekAgo - current; // positive = improved
  if (diff > 0) {
    return <span className="text-gray-300">{current} <span className="text-green-500">↑{diff}</span></span>;
  }
  if (diff < 0) {
    return <span className="text-gray-300">{current} <span className="text-red-400">↓{Math.abs(diff)}</span></span>;
  }
  return <span className="text-gray-300">{current} <span className="text-gray-500">—</span></span>;
}

function formatNumber(n: number | null): string {
  if (n === null || n === undefined) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
    }

// ── Components ───────────────────────────────────────────────────────

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

function StatusBadge({ status }: { status: "stale" | "pending" | null }) {
  if (!status) return null;
  const colors = {
    stale: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    pending: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border ${colors[status]}`}>
      {status}
    </span>
  );
}

function KeywordPreview({ keywordId }: { keywordId: number }) {
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
    return <div className="py-3 px-6 text-gray-500 text-sm">Loading top 5...</div>;
  }
  if (error) {
    return <div className="py-3 px-6 text-red-400 text-sm">Failed to load results.</div>;
  }
  if (rankings.length === 0) {
    return <div className="py-3 px-6 text-gray-500 text-sm">No results yet. This keyword hasn&apos;t been collected.</div>;
  }

  return (
    <div className="py-2 px-6">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs">
            <th className="text-left py-1 w-10">#</th>
            <th className="text-left py-1">Video</th>
            <th className="text-left py-1">Channel</th>
            <th className="text-right py-1">Views</th>
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
              <td className="py-1 text-gray-400 truncate max-w-[120px]">{r.channel_name || "—"}</td>
              <td className="py-1 text-right tabular-nums">{formatNumber(r.view_count)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AddKeywordForm({ onAdded }: { onAdded: () => void }) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [isTargeted, setIsTargeted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyword.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          category: category.trim() || null,
          is_targeted: isTargeted,
        }),
      });

      if (res.status === 409) {
        setError("Keyword already exists");
        return;
      }
      if (!res.ok) {
        setError("Failed to add keyword");
        return;
      }

      setKeyword("");
      setCategory("");
      setIsTargeted(false);
      onAdded();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 py-3">
      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="Add keyword..."
        className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-gray-600 w-64"
      />
      <input
        type="text"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category"
        className="bg-gray-800 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-gray-600 w-32"
      />
      <label className="flex items-center gap-1.5 text-sm text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isTargeted}
          onChange={(e) => setIsTargeted(e.target.checked)}
          className="rounded border-gray-600"
        />
        Targeted
      </label>
      <button
        type="submit"
        disabled={submitting || !keyword.trim()}
        className="bg-red-600 hover:bg-red-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
      >
        {submitting ? "Adding..." : "Add"}
      </button>
      {error && <span className="text-red-400 text-sm">{error}</span>}
      {keyword.trim() && (
        <span className="text-gray-500 text-xs">+105 units/day</span>
      )}
    </form>
  );
}

function CollectionLog({ logs }: { logs: LogEntry[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (logs.length === 0) {
    return (
      <p className="text-gray-500 text-sm py-4">
        No collection runs yet. Collector starts at 02:00 UTC.
      </p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-500 text-xs border-b border-gray-800">
          <th className="text-left py-2">Timestamp</th>
          <th className="text-right py-2">Keywords</th>
          <th className="text-right py-2">Quota</th>
          <th className="text-right py-2">Errors</th>
          <th className="text-right py-2">Duration</th>
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
                {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : "—"}
              </td>
            </tr>
            {expandedId === log.id && log.errors && log.errors.length > 0 && (
              <tr key={`${log.id}-errors`}>
                <td colSpan={5} className="py-2 px-4 bg-gray-900/50">
                  <ul className="text-xs text-red-400 space-y-1">
                    {log.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
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

// ── Main Dashboard ───────────────────────────────────────────────────

export default function DashboardPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

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
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterButtons: { label: string; value: FilterMode }[] = [
    { label: "All", value: "all" },
    { label: "Targeted", value: "targeted" },
    { label: "Active", value: "active" },
    { label: "Pending", value: "pending" },
    { label: "Inactive", value: "inactive" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-800/50">
        <a href="/" className="text-lg font-semibold tracking-tight">
          <span className="text-red-500">YT</span>Combinator
        </a>
        <QuotaGauge logs={logs} />
      </nav>

      <main className="max-w-6xl mx-auto px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-medium text-gray-200">Keyword Portfolio</h1>
          <span className="text-sm text-gray-500">{keywords.length} keywords</span>
        </div>

        {/* Filters */}
        <div className="flex gap-1 mb-4">
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
              {btn.label}
            </button>
          ))}
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="text-red-400 text-sm underline mt-1"
            >
              Retry
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
                <p className="text-gray-500 mb-2">No keywords yet.</p>
                <p className="text-gray-600 text-sm">
                  Seed your keyword list below, or run a bulk import via SQL.
                </p>
              </div>
            ) : (
              <div className="border border-gray-800/50 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs border-b border-gray-800/50 bg-gray-900/30">
                      <th className="text-left py-2.5 px-4">Keyword</th>
                      <th className="text-left py-2.5 px-3">Category</th>
                      <th className="text-center py-2.5 px-3">Status</th>
                      <th className="text-right py-2.5 px-3">Your Rank</th>
                      <th className="text-right py-2.5 px-3">Results</th>
                      <th className="text-right py-2.5 px-3">Last Collected</th>
                      <th className="text-center py-2.5 px-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.map((kw) => {
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
                            <td className="py-2 px-4 font-medium text-gray-200">
                              {kw.keyword}
                              {kw.is_targeted && (
                                <span className="ml-2 text-xs text-red-400">●</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-500">
                              {kw.category || "—"}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <StatusBadge status={badge} />
                              {!badge && kw.is_active && (
                                <span className="text-xs text-green-500">active</span>
                              )}
                              {!kw.is_active && (
                                <span className="text-xs text-gray-600">paused</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {rankDelta(kw.your_rank, kw.rank_7d_ago)}
                            </td>
                            <td className="py-2 px-3 text-right tabular-nums text-gray-400">
                              {kw.results_count ?? "—"}
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
                                {kw.is_active ? "Pause" : "Resume"}
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr key={`${kw.id}-preview`}>
                              <td colSpan={7} className="bg-gray-900/30 border-b border-gray-800/30">
                                <KeywordPreview keywordId={kw.id} />
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
              <AddKeywordForm onAdded={fetchData} />
            </div>
          </>
        )}

        {/* Collection Log */}
        <div className="mt-12">
          <h2 className="text-lg font-medium text-gray-300 mb-4">Collection Log</h2>
          <div className="border border-gray-800/50 rounded-lg overflow-hidden px-4">
            <CollectionLog logs={logs} />
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
      // Silent fail — user will see stale state
    }
  }
                              }
