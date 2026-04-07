# TASK: Activate Region Multipliers + Portfolio Valuation Column

## Summary

Two changes in one task:

1. **Region multipliers** — seed CPM rows for `us_es` and `latam_es`, add a region picker to the dashboard, and parameterize the SQL JOIN so revenue estimates reflect the selected audience region.
2. **Portfolio valuation** — add an "Annual Value" column per keyword and a portfolio valuation summary card at the top of the dashboard.

---

## Part 1: Region Multipliers

### 1A. Seed new CPM rows

**File:** `scripts/seed-cpm-benchmarks.ts`

Add two new region tiers to the `BENCHMARKS` array. Apply these multipliers to the existing `us_en` mid values:

- `us_es` (US Spanish audience): **0.70x** of `us_en`
- `latam_es` (Latin America Spanish): **0.25x** of `us_en`

For each of the 8 categories × 2 COPPA flags, add two new rows. Example for `educational / family_general` where `us_en` is `$10.00 / $17.50 / $25.00`:

```
["educational", "family_general", 7.00, 12.25, 17.50, "us_es"]
["educational", "family_general", 2.50, 4.38,  6.25, "latam_es"]
```

Apply the same ratio to low/mid/high. Round to 2 decimal places. This adds 32 rows (8 categories × 2 COPPA × 2 regions) for a total of 48.

After modifying the seed file, run it against the database:
```bash
DATABASE_URL=$DATABASE_URL npx tsx scripts/seed-cpm-benchmarks.ts
```

### 1B. Add `region` query param to GET /api/keywords

**File:** `app/api/keywords/route.ts`

1. Read a `region` query param from the URL (default: `us_en`). Validate it against `["us_en", "us_es", "latam_es"]`. Reject invalid values with 400.
2. Replace the hardcoded `cc.region = 'us_en'` in the LEFT JOIN with a parameterized value using the region param.
3. Do the same for the POST endpoint's inline metrics query (around line 230+) — it also has `cc.region = 'us_en'` hardcoded.

The param numbering is already dynamic (for coppa_flag and category), so follow the existing pattern of conditional `$N` placeholders.

### 1C. Add region picker to dashboard

**File:** `app/dashboard/page.tsx`

Add a region toggle in the dashboard header, right next to the existing COPPA toggle. Follow the exact same component pattern (pill-style toggle group). Three options:

- **US/EN** (value: `us_en`) — default
- **US/ES** (value: `us_es`)
- **LATAM** (value: `latam_es`)

Wire it up:
1. Add state: `const [region, setRegion] = useState<"us_en" | "us_es" | "latam_es">("us_en")`
2. Pass `region` as a query param in the fetch URL alongside `coppa_flag`
3. Add `region` to the `useEffect` dependency array that triggers refetch (same array as `coppaMode`)
4. Persist in URL via the existing `replaceState` pattern (like filter is persisted)

### 1D. Add i18n strings

**File:** `lib/i18n.ts`

```typescript
"region.us_en":    { en: "US/EN",  es: "US/EN" },
"region.us_es":    { en: "US/ES",  es: "US/ES" },
"region.latam_es": { en: "LATAM",  es: "LATAM" },
"region.tooltip":  { en: "Audience region — affects CPM estimates", es: "Región de audiencia — afecta estimados de CPM" },
```

### 1E. Update revenue tooltip

The current tooltip in i18n says "Top-5 views × $5 CPM ÷ 1000" which is stale (it references the old flat $5). Update:

```typescript
"tip.revenue_est": {
  en: "Top-5 views × category CPM ÷ 1000 (region-adjusted)",
  es: "Vistas top-5 × CPM por categoría ÷ 1000 (ajustado por región)",
},
```

---

## Part 2: Portfolio Valuation

### 2A. Add `annual_value` computed field to API response

**File:** `app/api/keywords/route.ts`

In the SELECT clause, add after `revenue_est_high`:

```sql
CASE WHEN tv.top5_views_sum IS NOT NULL AND cc.cpm_mid IS NOT NULL
  THEN ROUND(tv.top5_views_sum::numeric * cc.cpm_mid / 1000 * 12, 2)
  WHEN tv.top5_views_sum IS NOT NULL
  THEN ROUND(tv.top5_views_sum::numeric * 5 / 1000 * 12, 2)
  ELSE NULL END AS annual_value
```

This is just `revenue_est × 12`. Compute it server-side so sorting works.

### 2B. Add `annual_value` to the Keyword interface

**File:** `app/dashboard/page.tsx`

```typescript
interface Keyword {
  // ... existing fields ...
  annual_value: number | null;
}
```

### 2C. Add the "Annual Value" column to the table

Insert a new column header after "Revenue ($)" in the `<thead>`:

```tsx
<th className="text-right py-2.5 px-3 cursor-pointer select-none hover:opacity-70 transition-opacity"
    title={t("tip.annual_value")}
    onClick={() => toggleSort("annual_value")}>
  {t("th.annual_value")}{sortIndicator("annual_value")}
</th>
```

Render in the `<tbody>` row after the revenue cell:

```tsx
<td className="text-right py-2 px-3 tabular-nums font-medium"
    style={{ color: "var(--text-primary)" }}>
  {formatCurrency(kw.annual_value)}
</td>
```

### 2D. Portfolio valuation summary card

Add a summary card **above the table** (below the filter tabs, above the loading skeleton). Only show it when `filter === "starred"` (the starred/targeted view).

**Logic:**
```typescript
const portfolioAnnual = keywords
  .filter(kw => kw.is_targeted)
  .reduce((sum, kw) => sum + (Number(kw.annual_value) || 0), 0);
const portfolioValuation = portfolioAnnual * 2.5;
```

**UI:** A single card with clean typography:

```
Portfolio Valuation: $XXX,XXX
Based on $XX,XXX/yr annual revenue × 2.5x multiplier
```

Use the existing `formatCurrency` helper. Style it like a subtle info banner — not a giant hero. Match the existing card patterns (rounded-lg, var(--card-bg), border).

The 2.5x multiplier is the standard YouTube channel valuation multiple from industry data. Hardcode it for now.

### 2E. Add i18n strings

**File:** `lib/i18n.ts`

```typescript
"th.annual_value":        { en: "Annual ($)",     es: "Anual ($)" },
"tip.annual_value":       { en: "Monthly revenue estimate × 12",  es: "Estimado mensual × 12" },
"valuation.title":        { en: "Portfolio Valuation", es: "Valuación del Portafolio" },
"valuation.subtitle":     { en: "annual revenue × 2.5x multiplier", es: "ingresos anuales × multiplicador 2.5x" },
```

---

## Files Modified (summary)

| File | Changes |
|------|---------|
| `scripts/seed-cpm-benchmarks.ts` | Add 32 rows for `us_es` and `latam_es` regions |
| `app/api/keywords/route.ts` | Parameterize region in JOIN (GET + POST), add `annual_value` SELECT |
| `app/dashboard/page.tsx` | Region toggle, `annual_value` column, portfolio valuation card |
| `lib/i18n.ts` | Region strings, annual value strings, valuation strings, fix revenue tooltip |

## Validation

After deploying, verify:
1. Dashboard defaults to US/EN — revenue numbers unchanged from before
2. Switching to US/ES shows ~70% of US/EN revenue
3. Switching to LATAM shows ~25% of US/EN revenue
4. Annual Value column shows 12× the Revenue Est (mid)
5. On the Starred filter, the portfolio valuation card appears with a reasonable number
6. Toggling region updates the valuation card in real time
7. COPPA toggle still works independently of region toggle

## Commit message

```
Add region multipliers and portfolio valuation column

- Seed CPM rows for us_es (0.70x) and latam_es (0.25x) regions
- Region picker in dashboard header (US/EN, US/ES, LATAM)
- Parameterize cc.region in keywords API JOIN (GET + POST)
- Annual Value column (revenue × 12) with sort
- Portfolio valuation card on Starred view (annual × 2.5x)
- i18n strings for all new UI elements (en/es)
```
