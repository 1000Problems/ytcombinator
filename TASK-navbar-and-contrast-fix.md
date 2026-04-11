# TASK: Shared NavBar + Light Mode Contrast Fix

> Extract the duplicated nav code from dashboard, analyze, and login into a single shared NavBar component, and tighten the light mode border contrast in globals.css.

## Context

The dashboard, analyze, and login pages each contain their own copy of the nav bar. The component-redesign phase specified extracting a shared NavBar but it wasn't implemented. The landing page (`app/page.tsx`) is being completely rewritten separately — do NOT touch it.

Additionally, the light mode `--border` token (`#ddd9d2`) is too close to the background (`#faf9f7`) to be visible. Borders on inputs, table cells, and cards effectively disappear. A single CSS token change fixes this globally.

## Requirements

1. Create `app/components/NavBar.tsx` — a shared nav component used by dashboard, analyze, and login pages.
2. Extract `ThemeToggle` and `LanguageToggle` component definitions out of `dashboard/page.tsx` (lines 125–178) and into `NavBar.tsx`. Remove the now-duplicate local definitions from `dashboard/page.tsx` and `analyze/page.tsx`.
3. Replace the nav block in `dashboard/page.tsx` (lines 643–672) with `<NavBar ... />`.
4. Replace the nav block in `analyze/page.tsx` (lines 390–418) with `<NavBar ... />`.
5. Replace the nav block in `login/page.tsx` (lines 95–136) with `<NavBar variant="minimal" ... />`.
6. In `app/globals.css`, increase light mode border contrast: change `--border: #ddd9d2` → `--border: #b0a89e` and `--nav-border: #ddd9d2` → `--nav-border: #c0b8ae`. Dark mode values are unchanged.

## Implementation Notes

**Files to create:**
- `app/components/NavBar.tsx`

**Files to modify:**
- `app/dashboard/page.tsx` — replace nav block + remove local ThemeToggle/LanguageToggle definitions
- `app/analyze/page.tsx` — replace nav block + remove local ThemeToggle/LanguageToggle definitions
- `app/login/page.tsx` — replace nav block
- `app/globals.css` — two light mode CSS token values only

**NavBar component interface:**

```tsx
import { Locale } from "@/lib/i18n";
import { Theme } from "@/lib/theme";

interface NavBarProps {
  locale: Locale;
  theme: Theme;
  onLocaleChange: (l: Locale) => void;
  onThemeChange: (t: Theme) => void;
  variant?: "full" | "minimal"; // "full" = dashboard/analyze links + logout; "minimal" = login (no links, no logout)
  activeRoute?: "dashboard" | "analyze"; // controls which link is highlighted / omitted
  rightContent?: React.ReactNode; // slot for QuotaGauge on dashboard, empty elsewhere
  onLogout?: () => void; // required when variant="full"
}
```

**Usage in dashboard/page.tsx** (replace lines 643–672):
```tsx
<NavBar
  locale={locale}
  theme={theme}
  onLocaleChange={handleLocaleChange}
  onThemeChange={handleThemeChange}
  variant="full"
  activeRoute="dashboard"
  rightContent={<QuotaGauge logs={logs} />}
  onLogout={async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }}
/>
```

**Usage in analyze/page.tsx** (replace lines 390–418):
```tsx
<NavBar
  locale={locale}
  theme={theme}
  onLocaleChange={handleLocaleChange}
  onThemeChange={handleThemeChange}
  variant="full"
  activeRoute="analyze"
  onLogout={async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }}
/>
```

**Usage in login/page.tsx** (replace lines 95–136):
```tsx
<NavBar
  locale={locale}
  theme={theme}
  onLocaleChange={handleLocaleChange}
  onThemeChange={handleThemeChange}
  variant="minimal"
/>
```

**NavBar visual spec:**
- Logo: `<a href="/">` containing the play-button SVG icon (copy from login/page.tsx lines 98–108) + `<span><span style={{ color: '#FF0000' }}>YT</span>Combinator</span>`
- Left side: logo + LanguageToggle + ThemeToggle
- Right side (variant="full"): active route omitted, inactive route as link, `rightContent` slot, logout button
- Right side (variant="minimal"): nothing (login page nav is clean)
- Nav styles: `px-8 py-4`, `borderBottom: "1px solid var(--nav-border)"`, `boxShadow: "var(--nav-shadow)"`
- Login variant uses `py-6 max-w-6xl mx-auto` to match current login nav padding

**QuotaGauge stays where it is** — it is defined in `dashboard/page.tsx` and uses `LogEntry[]`. Do not move it. Pass it as `rightContent`.

**Globals.css change — light mode block only:**
```css
/* change these two lines in :root / [data-theme="light"] */
--border: #b0a89e;      /* was #ddd9d2 */
--nav-border: #c0b8ae;  /* was #ddd9d2 */
```
Dark mode equivalents are fine — do not touch them.

## Do Not Change

- `app/page.tsx` — landing page is being completely rewritten in a separate task; do not touch it
- `lib/theme.ts` — theme toggle logic, used by NavBar but not modified
- `lib/i18n.ts` — translation system, used by NavBar but not modified
- `lib/db.ts` — database connection (Protected Area)
- `lib/collector.ts` — YouTube API collection (Protected Area)
- `lib/quota-budget.ts` — budget constants (Protected Area)
- `app/api/` — all API routes (Protected Areas)
- `scripts/` — all scripts (Protected Area)
- `middleware.ts` — auth middleware
- `app/globals.css` — only the two specified `--border` and `--nav-border` values in the light mode block; no other changes
- Dashboard `page.tsx`: all state hooks, useEffect, fetch calls, event handlers, sort/filter logic, TypeScript interfaces, table column structure, QuotaGauge definition — only the nav block and local ThemeToggle/LanguageToggle definitions change
- Analyze `page.tsx`: all state hooks, useEffect, fetch calls, event handlers, sort/filter logic, TypeScript interfaces — only the nav block and local ThemeToggle/LanguageToggle definitions change
- Login `page.tsx`: all form logic, state, submit handler — only the nav block changes

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors and zero TypeScript errors
- [ ] `app/components/NavBar.tsx` exists and exports a default `NavBar` component
- [ ] Dashboard page renders correctly with NavBar — logo, language toggle, theme toggle, Analyze link, QuotaGauge, Logout visible
- [ ] Analyze page renders correctly with NavBar — logo, language toggle, theme toggle, Dashboard link, Logout visible
- [ ] Login page renders correctly with NavBar variant="minimal" — logo, language toggle, theme toggle only (no nav links, no logout)
- [ ] Theme and locale toggles work on all three pages after extraction
- [ ] Logout works on dashboard and analyze
- [ ] Light mode borders are noticeably visible (input borders, table cell dividers, nav bottom border)
- [ ] Dark mode is visually unchanged
- [ ] `git diff --name-only` shows changes ONLY in: `app/components/NavBar.tsx`, `app/dashboard/page.tsx`, `app/analyze/page.tsx`, `app/login/page.tsx`, `app/globals.css`

## Verification

1. `npm run build` — paste last 10 lines of output
2. `git diff --name-only` — verify exactly the 5 files above
3. Open dashboard in browser — confirm NavBar renders, locale toggle switches language, theme toggle switches theme, QuotaGauge shows, Logout works
4. Open analyze in browser — confirm NavBar renders correctly
5. Open login in browser — confirm minimal NavBar renders, no logout or nav links visible
6. Toggle light/dark on all three pages — verify no visual regressions
7. In light mode, inspect any input or table border — confirm it is visibly distinct from the background

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
