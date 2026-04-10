# TASK: Design Foundation — Typography, Color System, Background Atmosphere

> Replace the generic Geist/Arial fonts and slate color palette with a distinctive, bold design system that gives YTCombinator a real identity.

## Context

YTCombinator is a YouTube keyword research and analytics dashboard. It currently uses default Next.js fonts (Geist) with a fallback to Arial, and a generic Tailwind slate palette. The result looks like every other AI-generated dashboard. We're applying the frontend-design skill to give it a distinctive, memorable aesthetic — something that feels like a serious data tool with personality, not a template.

**Read the frontend-design skill at `~/1000Problems/Skills/shared-frontend-design-SKILL.md` before starting. Use the Plan agent before implementing.**

## Requirements

1. Replace Geist/Arial with a distinctive Google Fonts pairing — one display font for headings (bold, characterful) and one refined body font for data and text. Do NOT use Inter, Roboto, Space Grotesk, or any overused AI-default fonts. Think: a font pairing that says "data intelligence tool" not "generic SaaS dashboard."
2. Redesign the full color token system in `globals.css` (both light and dark themes). The current slate palette (`#f8fafc`, `#0f172a`, etc.) must be replaced with something that has character. The red/orange/yellow gradient brand identity should remain as an accent, but the base palette needs a real point of view.
3. Add background atmosphere to the body — subtle texture, noise, gradient mesh, or pattern that adds depth instead of flat solid colors. Both themes need this.
4. Restyle scrollbars and text selection to match the new palette.
5. Update the `<body>` font-family in `globals.css` to use the new body font.
6. Update `layout.tsx` to import the new Google Fonts (replacing Geist/Geist_Mono) and wire the CSS variables.
7. Update the site `<title>` and `<meta description>` in `layout.tsx` — currently says "Create Next App".

## Implementation Notes

**Files to modify:**
- `app/globals.css` — all CSS custom properties (both `:root` and `[data-theme="dark"]` blocks), body styles, add scrollbar/selection styles, add background atmosphere
- `app/layout.tsx` — replace Geist font imports with new Google Fonts, update metadata

**Font loading pattern (follow existing):**
```tsx
import { SomeDisplay, SomeBody } from "next/font/google";

const displayFont = SomeDisplay({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],  // bold weights for headings
});

const bodyFont = SomeBody({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
```

**CSS variable structure to preserve** (these variable names are used across all pages):
- `--page-bg`, `--page-bg-alt`, `--surface`, `--surface-hover`
- `--card-bg`, `--card-bg-subtle`, `--input-bg`
- `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-muted`, `--text-dim`
- `--border`, `--border-subtle`, `--nav-border`
- `--table-header-bg`, `--table-row-hover`, `--table-border`
- All other existing variable names

The variable names must stay the same — only the values change. Every page references these variables via inline styles.

**Things to consider:**
- The dashboard has dense data tables with `tabular-nums` — the body font must have clear, readable numerals
- Both light and dark themes are actively used (cookie-persisted toggle)
- The red/orange brand gradient (`#ef4444` → `#f97316` → `#eab308`) appears in the logo SVG and hero section — keep this as the accent identity
- Background atmosphere should be subtle enough to not interfere with dense data readability

## Do Not Change

- `app/dashboard/page.tsx` — 1047-line file, complex state management, do not touch
- `app/analyze/page.tsx` — 659-line file, video analysis logic, do not touch
- `app/login/page.tsx` — login form, do not touch
- `app/page.tsx` — landing page, do not touch (Phase 2 will handle component updates)
- `lib/theme.ts` — theme toggle logic
- `lib/i18n.ts` — translation system
- `lib/db.ts` — database connection (Protected Area)
- `lib/collector.ts` — YouTube API collection (Protected Area)
- `lib/quota-budget.ts` — budget constants (Protected Area)
- `app/api/` — all API routes (Protected Areas)
- `scripts/` — all scripts (Protected Area)
- `middleware.ts` — auth middleware
- Any CSS variable names — only change values, not names

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] New Google Fonts load correctly (no FOUT/FOIT, proper variable assignment)
- [ ] Both light and dark themes have cohesive, distinctive palettes (not slate)
- [ ] Background has visible atmosphere/texture (not flat solid color)
- [ ] Scrollbars and text selection styled to match palette
- [ ] Site title and meta description updated from "Create Next App"
- [ ] All existing CSS variable names preserved (pages don't break)
- [ ] `git diff --name-only` shows changes ONLY in `app/globals.css` and `app/layout.tsx`

## Verification

1. Run `npm run build` — capture last 10 lines of output
2. Run `git diff --name-only` — verify only `app/globals.css` and `app/layout.tsx` changed
3. Open the app in browser — verify both light and dark themes render correctly
4. Check that dashboard tables remain readable with the new fonts

## Completion Evidence (REQUIRED)

**Code must paste the following into VybePM task notes before setting status to `review`.**

~~~
## Completion Evidence

### Scope Check
Files modified: (paste git diff --name-only output)
Files outside TASK scope: NONE | (list each with justification)

### Build
(paste last 10 lines of npm run build output)

### Acceptance Criteria
1. [x] criterion text — EVIDENCE: (file:line, terminal output, or screenshot description)
2. [x] criterion text — EVIDENCE: (file:line, terminal output, or screenshot description)

### Self-Review
- Did I modify files not listed in the TASK? No | Yes: (list + justification)
- Did I refactor or clean up adjacent code? No | Yes: (what and why)
- Did I add features not in the spec? No | Yes: (what and why)
~~~

## Rationalization Prevention

| If you're thinking... | Stop. The reality is: |
|-----------------------|-----------------------|
| "This file needs fixing too" | That's scope creep. Create a VybePM task, don't fix it inline. |
| "I'll refactor this while I'm here" | Unauthorized cleanup. The TASK spec didn't ask for it. |
| "The tests pass so it's done" | Tests passing ≠ task complete. Fill in the Completion Evidence. |
| "This is a trivial change" | Trivial changes break things. Follow the full verification flow. |
| "I'll add error handling to be safe" | Only add what the spec asks for. YAGNI. |
| "The adjacent component should match" | Stay in scope. If it should match, that's a new TASK. |
