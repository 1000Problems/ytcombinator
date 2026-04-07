/**
 * Shared formatting helpers used by dashboard + analyze pages.
 */

export function formatCurrency(n: number | string | null): string {
  if (n === null || n === undefined) return "--";
  const v = Number(n);
  if (isNaN(v)) return "--";
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

export function formatNumber(n: number | string | null): string {
  if (n === null || n === undefined) return "--";
  const v = Number(n);
  if (isNaN(v)) return "--";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}
