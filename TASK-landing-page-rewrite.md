# TASK: Landing Page — Complete Rewrite from Scratch

> Throw away the current `app/page.tsx` and write a new one: dark, asymmetric, data-forward editorial design with a real keyword data mockup in the hero and typographic stat callouts below.

## Context

The current landing page is generic AI-template SaaS slop: centered icon, giant gradient headline, three identical feature cards, tech badge parade. It could be a landing page for anything. The rewrite establishes a specific visual identity — a data intelligence tool for YouTube creators — by leading with the actual data the product produces rather than explaining features nobody asked to read about.

Design direction: **dark fixed aesthetic, left-aligned asymmetric hero, keyword table mockup as the right-side hero element, big typographic numbers as the "features" section, minimal 3-step "how it works" below.**

The landing page is English-only. No locale toggle. No theme toggle. Fixed dark background regardless of the user's theme cookie. The theme system (light/dark toggle) belongs to the app pages (dashboard, analyze), not the marketing page.

## Requirements

1. Complete rewrite of `app/page.tsx`. The file content should be entirely new — do not preserve any existing structure, components, or copy.
2. Fixed dark theme: page always renders dark. Do NOT use CSS theme variables that flip on light mode. Use hardcoded hex values for the background, text, borders, and card colors (values specified below under Colors).
3. Hero section: two-column layout. Left column: headline, subheading, CTA button. Right column: keyword data mockup table. No centered layout.
4. Headline must be left-aligned, Syne font, NOT centered.
5. Keyword data mockup: a styled div that looks exactly like 4–5 rows of the real dashboard table. Hardcoded static data. NOT fetched from API. NOT authenticated.
6. Stats section: three large typographic number callouts with small labels — NOT cards, NOT icons, NOT borders. Just big numbers + labels separated by thin vertical lines.
7. "How it works" section: three numbered steps (01 / 02 / 03) in a horizontal row connected by a gradient line. Brief text for each step. No icons.
8. Footer: minimal — "A 1000Problems project" + Dashboard link + GitHub link.
9. No i18n system (`createT`, `getSavedLocale`, etc.) — drop it entirely for this file. All copy is hardcoded English.
10. No theme toggle, no locale toggle in the nav.
11. `npm run build` must pass with zero errors.

## Implementation Notes

### File to modify (complete rewrite):
- `app/page.tsx`

### Colors — hardcode these hex values directly (do not use CSS vars):

```ts
const COLORS = {
  bg: "#110f0e",
  bgAlt: "#1a1614",
  surface: "#252018",
  card: "rgba(30, 25, 20, 0.85)",
  border: "rgba(55, 46, 37, 0.7)",
  borderSubtle: "rgba(40, 33, 26, 0.5)",
  textPrimary: "#f2ede8",
  textSecondary: "#d9d0c8",
  textMuted: "#9c8f84",
  textDim: "#6b5f56",
  red: "#ef4444",
  orange: "#f97316",
  amber: "#eab308",
};
```

### Fonts — use the CSS variables already set by layout.tsx:
- Display: `var(--font-display)` (Syne)
- Body: `var(--font-body)` (DM Sans)

### Nav:
```tsx
<nav style={{ background: COLORS.bg, borderBottom: `1px solid ${COLORS.border}` }}
     className="flex items-center justify-between px-10 py-4 sticky top-0 z-10">
  {/* Left: logo */}
  <a href="/" className="flex items-center gap-2.5 font-display text-lg font-bold tracking-tight"
     style={{ color: COLORS.textPrimary }}>
    {/* Play-button SVG icon — same 36x36 as other pages */}
    <span style={{ color: "#FF0000" }}>YT</span>Combinator
  </a>
  {/* Right: links */}
  <div className="flex items-center gap-6 text-sm" style={{ color: COLORS.textMuted }}>
    <a href="/dashboard" style={{ color: COLORS.textSecondary }}>Dashboard</a>
    <a href="https://github.com/1000Problems/ytcombinator" target="_blank" rel="noopener noreferrer">GitHub</a>
  </div>
</nav>
```

### Hero section layout:

```tsx
<section className="flex items-center min-h-[calc(100vh-57px)] max-w-7xl mx-auto px-10 gap-12">
  {/* LEFT: headline + CTA — 55% width */}
  <div className="flex-[0_0_55%]">
    {/* Vertical accent bar + headline */}
    <div className="flex gap-5 items-start mb-6">
      <div className="w-1 self-stretch rounded-full mt-1"
           style={{ background: "linear-gradient(to bottom, #ef4444, #f97316, #eab308)", minHeight: "80px" }} />
      <h1 className="font-display font-extrabold leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 4vw, 3.75rem)", color: COLORS.textPrimary }}>
        Find the keyword<br />
        before anyone<br />
        else ranks for it.
      </h1>
    </div>
    <p className="text-lg mb-8 max-w-md leading-relaxed" style={{ color: COLORS.textMuted }}>
      Daily keyword intelligence for YouTube creators. Volume scores, revenue estimates,
      competition analysis — automated and ranked by opportunity.
    </p>
    <a href="/dashboard"
       className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
       style={{ background: COLORS.red, color: "#fff" }}>
      Open Dashboard
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </a>
  </div>

  {/* RIGHT: keyword table mockup — 45% width */}
  {/* See "Keyword mockup table" section below */}
</section>
```

### Keyword mockup table (right side of hero):

The table must look like the real dashboard table. Hardcode exactly this data. The container has `overflow: hidden` with a bottom gradient fade.

```tsx
{/* Wrapper */}
<div className="flex-1 relative" style={{ maxHeight: "70vh" }}>
  {/* Gradient fade at bottom — creates "more below" illusion */}
  <div className="absolute bottom-0 left-0 right-0 h-32 z-10 pointer-events-none"
       style={{ background: `linear-gradient(to bottom, transparent, ${COLORS.bg})` }} />

  {/* Table card */}
  <div className="rounded-xl overflow-hidden" style={{ background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
    {/* Table header */}
    <div className="grid px-4 py-2.5 text-xs font-semibold uppercase tracking-widest"
         style={{ gridTemplateColumns: "1fr 100px 120px 70px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textDim }}>
      <span>KEYWORD</span>
      <span className="text-right">OPPORTUNITY</span>
      <span className="text-right">REVENUE / MO</span>
      <span className="text-center">RANK</span>
    </div>

    {/* Rows — 5 hardcoded rows */}
    {[
      { kw: "baby shark song",               tags: ["baby","shark"],         opp: "444.7M", rev: "$17.8K–55.6K", rank: "—",  star: true  },
      { kw: "baby song",                     tags: ["songs","nursery"],      opp: "356.4M", rev: "$151K",        rank: "—",  star: true  },
      { kw: "wheels on the bus",             tags: ["nursery","classic"],    opp: "175.4M", rev: "$9.1K–28.5K",  rank: "12", star: false },
      { kw: "nursery rhymes for toddlers",   tags: ["nursery","toddlers"],   opp: "142.3M", rev: "$7.8K–24.4K",  rank: "—",  star: false },
      { kw: "baby songs playlist",           tags: ["baby","songs"],         opp: "118.6M", rev: "$6.2K–19.4K",  rank: "—",  star: false },
    ].map((row, i) => (
      <div key={i} className="grid px-4 py-3 text-sm items-center transition-colors hover:opacity-80"
           style={{ gridTemplateColumns: "1fr 100px 120px 70px", borderBottom: `1px solid ${COLORS.borderSubtle}` }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            {row.star && <span style={{ color: COLORS.amber }}>★</span>}
            <span style={{ color: COLORS.textPrimary }}>{row.kw}</span>
          </div>
          <div className="flex gap-1.5">
            {row.tags.map(t => (
              <span key={t} className="text-xs px-1.5 py-0.5 rounded"
                    style={{ background: COLORS.surface, color: COLORS.textDim }}>{t}</span>
            ))}
          </div>
        </div>
        <div className="text-right font-mono text-sm font-bold" style={{ color: "#4ade80" }}>{row.opp}</div>
        <div className="text-right text-xs" style={{ color: COLORS.textSecondary }}>{row.rev}</div>
        <div className="text-center text-sm" style={{ color: row.rank === "—" ? COLORS.textDim : COLORS.textPrimary }}>{row.rank}</div>
      </div>
    ))}
  </div>
</div>
```

### Stats section:

Three large numbers, no cards, no icons. Separated by 1px vertical lines. On a slightly lighter background strip.

```tsx
<section style={{ background: COLORS.bgAlt, borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}>
  <div className="max-w-4xl mx-auto px-10 py-16 flex items-center">
    {[
      { number: "95",    suffix: "",  label: "keywords analyzed daily"          },
      { number: "$400M", suffix: "",  label: "annual channel value tracked"     },
      { number: "10K",   suffix: "",  label: "YouTube API quota, auto-managed"  },
    ].map((stat, i) => (
      <div key={i} className="flex-1 flex flex-col items-center text-center">
        {i > 0 && /* render vertical divider before items 1 and 2 */}
        <div className="font-display font-extrabold mb-2"
             style={{
               fontSize: "clamp(2.5rem, 5vw, 4rem)",
               color: i === 0 ? COLORS.red : i === 1 ? COLORS.orange : COLORS.amber,
             }}>
          {stat.number}
        </div>
        <div className="text-sm" style={{ color: COLORS.textMuted }}>{stat.label}</div>
      </div>
    ))}
  </div>
</section>
```

For the vertical dividers between stat items, use a wrapper approach: render the three stat divs inside a flex container, and between each pair insert a `<div style={{ width: "1px", height: "80px", background: COLORS.border }} />`.

### How it works section:

Three numbered steps in a horizontal flex row, connected by a gradient dotted line.

```tsx
<section className="max-w-5xl mx-auto px-10 py-24">
  <h2 className="font-display font-bold mb-16 text-center"
      style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", color: COLORS.textSecondary }}>
    How it works
  </h2>
  <div className="flex items-start gap-0 relative">
    {/* Connecting gradient line — absolute, runs between step numbers */}
    <div className="absolute top-[1.75rem] left-[16.67%] right-[16.67%] h-px z-0"
         style={{ background: "linear-gradient(to right, #ef4444, #f97316, #eab308)" }} />

    {[
      { num: "01", title: "Seed keywords",     body: "Add topics you want to rank for. The system auto-expands via YouTube autocomplete and tag mining."    },
      { num: "02", title: "Daily collection",  body: "Automated scraper runs at 3AM UTC. Hits YouTube API, enriches video and channel data, scores everything." },
      { num: "03", title: "Find opportunity",  body: "Keywords ranked by D/S ratio and revenue estimate. Starred ones surface first. Collect any time manually."  },
    ].map((step, i) => (
      <div key={i} className="flex-1 flex flex-col items-center text-center px-8 relative z-10">
        <div className="font-display font-extrabold mb-5 w-14 h-14 rounded-full flex items-center justify-center text-sm"
             style={{
               color: i === 0 ? COLORS.red : i === 1 ? COLORS.orange : COLORS.amber,
               background: COLORS.bg,
               border: `2px solid ${i === 0 ? COLORS.red : i === 1 ? COLORS.orange : COLORS.amber}`,
             }}>
          {step.num}
        </div>
        <div className="font-display font-bold text-base mb-2" style={{ color: COLORS.textPrimary }}>{step.title}</div>
        <div className="text-sm leading-relaxed" style={{ color: COLORS.textMuted }}>{step.body}</div>
      </div>
    ))}
  </div>
</section>
```

### Footer:

```tsx
<footer className="text-center py-10 text-sm"
        style={{ color: COLORS.textDim, borderTop: `1px solid ${COLORS.borderSubtle}` }}>
  A{" "}
  <a href="https://www.1000problems.com" style={{ color: COLORS.textMuted }}>1000Problems</a>
  {" "}project ·{" "}
  <a href="/dashboard" style={{ color: COLORS.textMuted }}>Dashboard</a>
  {" "}·{" "}
  <a href="https://github.com/1000Problems/ytcombinator" target="_blank" rel="noopener noreferrer" style={{ color: COLORS.textMuted }}>GitHub</a>
</footer>
```

### Root wrapper:

```tsx
<div className="min-h-screen font-sans" style={{ background: COLORS.bg, color: COLORS.textPrimary }}>
  {/* noise texture overlay — reuse the same SVG as globals.css body::after */}
  <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]"
       style={{ backgroundImage: "url(\"data:image/svg+xml,...\")", backgroundSize: "200px 200px" }} />
  <div className="relative z-10">
    {/* nav, hero, stats, how-it-works, footer */}
  </div>
</div>
```

### Imports — only what's needed:

```tsx
"use client";
// No i18n imports — page is English-only
// No theme imports — page is fixed dark
// No useState/useEffect needed (static page)
```

If there's a build error because the page is "use client" but has no client-side hooks, either remove the directive or add a trivial `useState` — but try without it first since React Server Components should handle this as a static page fine.

### Logo SVG — copy from login/page.tsx lines 98–108:

```tsx
<svg width="32" height="32" viewBox="0 0 36 36" fill="none">
  <rect width="36" height="36" rx="8" fill="url(#landing-grad)" />
  <path d="M12 13l6 5-6 5V13z" fill="#fff" />
  <path d="M18 13l6 5-6 5V13z" fill="#fff" opacity="0.6" />
  <defs>
    <linearGradient id="landing-grad" x1="0" y1="0" x2="36" y2="36">
      <stop stopColor="#ef4444" />
      <stop offset="1" stopColor="#f97316" />
    </linearGradient>
  </defs>
</svg>
```

## Do Not Change

- `app/globals.css` — only modify if there's a specific build-breaking CSS conflict; do not add new classes or change tokens
- `app/layout.tsx` — already correct, do not modify
- `app/dashboard/page.tsx` — Protected Area, do not touch
- `app/analyze/page.tsx` — Protected Area, do not touch
- `app/login/page.tsx` — Protected Area, do not touch
- `lib/theme.ts` — do not import or use on this page
- `lib/i18n.ts` — do not import or use on this page
- `lib/db.ts` — database connection (Protected Area)
- `lib/collector.ts` — YouTube API collection (Protected Area)
- `lib/quota-budget.ts` — budget constants (Protected Area)
- `app/api/` — all API routes (Protected Areas)
- `scripts/` — all scripts (Protected Area)
- `middleware.ts` — auth middleware

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] Page renders with a dark background regardless of any previously set theme cookie
- [ ] Nav is minimal: logo (left) + Dashboard link + GitHub link (right). No locale toggle. No theme toggle.
- [ ] Hero is a two-column layout — headline on the left, keyword table mockup on the right. NOT centered.
- [ ] Headline is left-aligned with a vertical accent bar on its left edge
- [ ] Keyword mockup table shows exactly 5 hardcoded rows with KEYWORD / OPPORTUNITY / REVENUE / RANK columns
- [ ] Stats section shows three large numbers (95 / $400M / 10K) in red / orange / amber with labels below, separated by vertical lines
- [ ] How it works section shows three numbered steps (01 / 02 / 03) connected by a gradient horizontal line
- [ ] No feature-card grid (the three identical rounded rectangles are gone)
- [ ] No tech badge parade
- [ ] No i18n system used in this file
- [ ] `git diff --name-only` shows changes ONLY in `app/page.tsx`

## Verification

1. `npm run build` — paste last 10 lines
2. `git diff --name-only` — confirm ONLY `app/page.tsx` changed
3. Open `https://ytcombinator.vercel.app` — confirm dark background, two-column hero, no centered layout
4. Confirm keyword mockup table is visible with real-looking data rows
5. Scroll down — confirm stats section (big numbers) and how-it-works (numbered steps) render correctly
6. Confirm footer has the two expected links
7. Confirm no locale toggle or theme toggle appears anywhere on the page

## Completion Evidence (REQUIRED)

~~~
## Completion Evidence

### Scope Check
Files modified: (paste git diff --name-only output)
Files outside TASK scope: NONE | (list with justification)

### Build
(paste last 10 lines of npm run build)

### Acceptance Criteria
1. [x] criterion — EVIDENCE: ...

### Self-Review
- Did I modify files not listed? No | Yes: ...
- Did I refactor adjacent code? No | Yes: ...
- Did I add features not in spec? No | Yes: ...
~~~
