# TASK: Shared Nav Tabs + Analyze Buttons on Ranking Videos

**Priority:** high
**Assignee:** claude-code

## Summary

The keyword dashboard (`/dashboard`) and video analyzer (`/analyze`) feel like separate apps. They already cross-link via subtle text links in `text-tertiary`, but the user has to know they exist. Make the navigation obvious and add one-click analyze buttons on ranking videos.

## Part 1: Shared Tab Navigation

Replace the current subtle text links with a proper tab-style nav that makes both pages feel like one app.

### Current state

Both pages have nearly identical `<nav>` elements (dashboard line ~644, analyze line ~389). Each has a small text link to the other page in `text-tertiary` color — easy to miss.

### Target

A single nav pattern used on both pages with two tabs: **Keywords** and **Analyzer**. The active tab should be visually distinct (bold, underline, or filled pill — match the existing red-500 brand color). The inactive tab should still be clearly clickable, not hidden.

### Implementation

1. **Extract a shared `NavBar` component** into `app/components/NavBar.tsx` (or inline in both pages — your call on bundle size). Props:
   - `activePage: "dashboard" | "analyze"`
   - `locale`, `onLocaleChange`
   - `theme`, `onThemeChange`
   - `t` (i18n function)
   - Optional: `quotaSlot` (ReactNode) — the dashboard passes `<QuotaGauge>`, analyze passes nothing

2. **Tab design:**
   ```
   [Keywords]  [Analyzer]
   ```
   - Active tab: `text-red-500 font-semibold` with a 2px bottom border in red-500
   - Inactive tab: `text-secondary` with hover → `text-primary`
   - Tabs sit next to the YTCombinator logo, after the brand name, before the language/theme toggles
   - Use `<a>` tags (not buttons) so they work as real navigation

3. **i18n strings** — add to `lib/i18n.ts`:
   ```
   "nav.keywords": { en: "Keywords", es: "Keywords" }
   "nav.analyzer": { en: "Analyzer", es: "Analizador" }
   ```
   Remove the old `nav.analyze` and `nav.dashboard` strings if no longer used.

4. **Update both pages** to use the shared nav. Remove the duplicated `<nav>` blocks.

### Layout reference

```
┌─────────────────────────────────────────────────────┐
│ YTCombinator   [Keywords] [Analyzer]   ES|EN 🌙  ⏻  │
│─────────────────────────────────────────────────────│
│                    page content                      │
```

## Part 2: "Analyze" Button on Ranking Videos

When a user expands a keyword to see its top-25 ranking videos, each video row should have a quick-analyze icon that sends the video to `/analyze`.

### Current state

The `RankingsPanel` component (dashboard, line ~245) renders a table of ranking videos. Each row shows: rank, video title (linked to YouTube), channel name, views, and revenue estimate. The video title links to `https://youtube.com/watch?v=${r.video_id}`.

### Target

Add a small analyze icon/button at the end of each ranking row. Clicking it navigates to `/analyze?url=https://youtube.com/watch?v=${r.video_id}`, which pre-fills the analyzer input and auto-triggers analysis.

### Implementation

1. **Add an analyze icon column** to the rankings table. Use a simple magnifying glass or chart-bar icon (SVG inline, no external deps). Keep it small (14-16px) in `text-muted`, hover → `text-red-500`.

2. **The link format:** `/analyze?url=https://youtube.com/watch?v=${r.video_id}`

3. **On the `/analyze` page**, read `searchParams.url` on mount:
   ```tsx
   const searchParams = new URLSearchParams(window.location.search);
   const prefillUrl = searchParams.get("url");
   if (prefillUrl) {
     setInput(prefillUrl);
     // Auto-trigger analysis
     handleAnalyze(prefillUrl);
   }
   ```
   This means clicking the icon from the dashboard immediately starts analyzing — no extra click needed.

4. **i18n string:**
   ```
   "action.analyze_video": { en: "Analyze this video", es: "Analizar este video" }
   ```
   Use as the `title` attribute on the icon for accessibility.

5. **Keep the existing YouTube link** on the video title. The analyze icon is a separate action, not a replacement.

## Files to modify

| File | Changes |
|------|---------|
| `app/components/NavBar.tsx` | New file — shared nav component |
| `app/dashboard/page.tsx` | Replace inline `<nav>` with `<NavBar>`, add analyze icon to rankings table |
| `app/analyze/page.tsx` | Replace inline `<nav>` with `<NavBar>`, add URL prefill from query params |
| `lib/i18n.ts` | Add `nav.keywords`, `nav.analyzer`, `action.analyze_video` strings |

## Done when

- Both pages show the same tab navigation with the active page highlighted
- Clicking a tab navigates to the other page
- Each ranking video row has a small analyze icon
- Clicking the icon opens `/analyze` with the video pre-analyzed (no extra clicks)
- Both light and dark themes look correct
- ES and EN strings all work
