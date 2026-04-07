/**
 * YouTube Data API v3 quota tracking.
 *
 * Costs per call (with part=snippet,statistics):
 *   search.list  = 100 units
 *   videos.list  = 1 (base) + 2 (snippet) + 2 (statistics) = 5 units
 *
 * Daily budget: 10,000 units total.
 * Default allocation: ~5,250 for the collector, rest for ad-hoc.
 */

export const QUOTA = {
  DAILY_LIMIT: 10_000,
  SEARCH_COST: 100,
  VIDEOS_LIST_COST: 5, // base(1) + snippet(2) + statistics(2)
  COLLECTOR_BUDGET: 5_250,
  MAX_KEYWORDS_PER_RUN: 50,
  SEARCH_MAX_RESULTS: 25,
  ANALYZE_COST: 12, // videos.list(snippet+stats+contentDetails) + channels.list(snippet+stats)
} as const;

/**
 * Calculate the quota cost for processing N keywords.
 * Each keyword = 1 search.list + 1 videos.list (25 IDs batched).
 */
export function calculateQuotaCost(keywordCount: number): number {
  const searchCost = keywordCount * QUOTA.SEARCH_COST;
  const videosCost = keywordCount * QUOTA.VIDEOS_LIST_COST;
  return searchCost + videosCost;
}

/**
 * How many keywords can we process within a given budget?
 */
export function maxKeywordsForBudget(budget: number = QUOTA.COLLECTOR_BUDGET): number {
  const costPerKeyword = QUOTA.SEARCH_COST + QUOTA.VIDEOS_LIST_COST;
  return Math.floor(budget / costPerKeyword);
}

/**
 * Detect if an API error is a quota exhaustion error.
 * YouTube returns 403 with reason "quotaExceeded" or
 * "dailyLimitExceeded", or 429 for rate limiting.
 */
export function isQuotaError(status: number, body?: string): boolean {
  if (status === 429) return true;
  if (status === 403 && body) {
    const lower = body.toLowerCase();
    return lower.includes("quotaexceeded") || lower.includes("dailylimitexceeded");
  }
  return false;
}

/**
 * Detect if an error is transient (retry-safe).
 */
export function isTransientError(status: number): boolean {
  return status >= 500 || status === 408 || status === 0;
}
