# TASK: Component Redesign — Landing, Dashboard, Analyze, Login

> Redesign all page-level components to use the new design foundation, add a shared nav component, and give each page a distinctive visual identity.

## Context

Phase 1 (TASK-design-foundation) established the new typography, color system, and background atmosphere in `globals.css` and `layout.tsx`. Now we apply that foundation to the actual pages. The current pages have duplicated nav bars, generic card designs, and no visual personality. This task redesigns the component layer — the chrome around the data, not the data logic itself.

**Read the frontend-design skill at `~/1000Problems/Skills/shared-frontend-design-SKILL.md` before starting. Use the Plan agent before implementing.**

**Depends on: TASK-design-foundation.md must be completed first.**

## Requirements

1. **Extract a shared NavBar component** — all four pages (landing, dashboard, analyze, login) duplicate the nav with logo, language toggle, and theme toggle. Extract into a single `app/components/NavBar.tsx` component. Include the YTCombinator logo SVG, language switcher, theme toggle, and nav links (Dashboard, Analyze, GitHub). Login page gets a minimal variant (logo + toggles only, no nav links).
2. **Redesign the landing page** (`app/page.tsx`) — the hero section, feature cards, and tech badges. Apply the new fonts (display font for headings, body font for text). Make the feature cards visually distinctive — not three identical rounded rectangles. Add spatial interest: asymmetry, overlap, or grid-breaking layout. Keep the red/orange brand gradient for the hero accent.
3. **Redesign the dashboard chrome** (`app/dashboard/page.tsx`) — restyle the page header/stats area, the KeywordTable wrapper (header row, borders, hover states), the ResearchBar, the CollectButton, the CollectionLog section, and the FormulaExplainer modal. Do NOT touch the data logic, state management, fetch calls, or table column structure. Only restyle the visual containers.
4. **Redesign the analyze page chrome** (`app/analyze/page.tsx`) — restyle the VideoCard component (thumbnail + metadata layout), the VideoTable (sortable history table), and the page header. Same rule: visual containers only, don't touch analysis logic.
5. **Redesign the login page** (`app/login/page.tsx`) — make it memorable. A simple password input page can still have atmosphere. Use the display font for the title, add visual interest around the form.

## Implementation Notes

**Files to create:**
- `app/components/NavBar.tsx` — shared nav component

**Files to modify:**
- `app/page.tsx` — landing page (replace inline nav with NavBar, redesign hero + cards + badges)
- `app/dashboard/page.tsx` — dashboard (replace inline nav with NavBar, restyle component chrome ONLY)
- `app/analyze/page.tsx` — analyze (replace inline nav with NavBar, restyle component chrome ONLY)
- `app/login/page.tsx` — login (replace inline nav with NavBar, restyle form area)

**Critical constraint for dashboard/analyze:** These are the two largest files (1047 and 659 lines). They contain complex state management, API calls, sorting logic, and inline component definitions. You MUST only modify:
- JSX className attributes and inline `style` props
- The nav section (replacing with `<NavBar />` import)
- Visual wrapper divs around data components

You MUST NOT modify:
- State hooks, useEffect, fetch calls, event handlers
- Data processing functions (sorting, filtering, formatting)
- Table column definitions or cell render logic
- Any TypeScript interfaces or type definitions
- The ThemeToggle/LanguageToggle components (they move to NavBar)

**NavBar component signature:**
```tsx
interface NavBarProps {
  locale: Locale;
  theme: Theme;
  onLocaleChange: (l: Locale) => void;
  onThemeChange: (t: Theme) => void;
  variant?: "full" | "minimal";  // minimal = login (no nav links)
  activeRoute?: "dashboard" | "analyze";
}
```

**Design direction:** YTCombinator is a YouTube keyword intelligence tool. Think: Bloomberg terminal meets YouTube energy. Dense, data-forward, but with the warmth and dynamism of creator culture. The red/orange/yellow gradient is the brand signature — use it boldly but not everywhere.

## Do Not Change

- `app/globals.css` — already done in Phase 1
- `app/layout.tsx` — already done in Phase 1
- `lib/theme.ts` — theme toggle logic (NavBar uses it, doesn't modify it)
- `lib/i18n.ts` — translation system (NavBar uses it, doesn't modify it)
- `lib/format.ts` — number/currency formatting
- `lib/db.ts` — database connection (Protected Area)
- `lib/collector.ts` — YouTube API collection (Protected Area)
- `lib/quota-budget.ts` — budget constants (Protected Area)
- `app/api/` — all API routes (Protected Areas)
- `scripts/` — all scripts (Protected Area)
- `middleware.ts` — auth middleware
- Dashboard: state hooks, useEffect, fetch calls, event handlers, sort/filter logic, TypeScript types
- Analyze: state hooks, useEffect, fetch calls, event handlers, sort/filter logic, TypeScript types
- Any data processing or API interaction code

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] Shared NavBar component exists at `app/components/NavBar.tsx`
- [ ] All four pages use NavBar (no more duplicated nav code)
- [ ] Landing page has distinctive hero layout (not three identical cards in a row)
- [ ] Dashboard tables remain fully functional (sort, filter, expand, collect)
- [ ] Analyze page video cards and table remain fully functional
- [ ] Login form works correctly (submit, error state, loading state)
- [ ] Both light and dark themes render correctly on all pages
- [ ] Display font used for all headings, body font for data and text
- [ ] `git diff --name-only` shows changes ONLY in the files listed above

## Verification

1. Run `npm run build` — capture last 10 lines
2. Run `git diff --name-only` — verify only expected files changed
3. Navigate all four pages — verify no broken layouts or missing functionality
4. Test dashboard: add keyword, sort table, toggle collection log, open formula explainer
5. Test analyze: submit a video URL, verify card renders, check history table
6. Test login: submit password, verify redirect on success, error message on failure
7. Toggle light/dark theme on every page — verify consistency

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
