# TASK: Motion & Polish — Animations, Micro-interactions, Final Refinements

> Add purposeful motion design and micro-interactions that make YTCombinator feel alive and responsive, then polish every visual detail.

## Context

Phase 1 (design foundation) established the new typography, colors, and atmosphere. Phase 2 (component redesign) applied that foundation to every page and extracted a shared NavBar. This final phase adds the motion layer — page transitions, hover states, loading feedback, and scroll-triggered reveals — that turns a good-looking app into one that feels premium.

**Read the frontend-design skill at `~/1000Problems/Skills/shared-frontend-design-SKILL.md` before starting. Use the Plan agent before implementing.**

**Depends on: TASK-design-foundation.md and TASK-component-redesign.md must be completed first.**

## Requirements

1. **Staggered page load reveals** — when a page loads, content should animate in with staggered delays (not all at once). Landing page: hero text → hero CTA → feature cards cascade. Dashboard: stats bar → table → sidebar sections. Analyze: header → video input → history table. Use CSS `@keyframes` + `animation-delay`, not JS animation libraries.
2. **Hover depth on cards and interactive elements** — feature cards on landing, keyword rows in dashboard table, video cards in analyze. Subtle scale, shadow lift, or border glow on hover. Must feel physical, not just a color swap.
3. **Table row interactions** — dashboard keyword table and analyze video table should have smooth hover highlights and a subtle enter/exit transition, not just an instant background swap.
4. **Button press feedback** — all buttons (CTA, CollectButton, ResearchBar submit, login submit) should have a micro-interaction on click: brief scale-down (active state) that feels tactile.
5. **Loading states** — the CollectButton spinner, ResearchBar loading, and analyze video loading should use smooth CSS animations (not just `...` text). A pulsing dot, spinning ring, or skeleton shimmer.
6. **Status badge polish** — keyword status indicators (D/S ratio colors, rank delta arrows) should have subtle entrance animations when data loads.
7. **Scroll-triggered reveals** — on the landing page, feature cards and tech badges should animate in when scrolled into view. Use `IntersectionObserver` with CSS classes, not a library.
8. **Respect `prefers-reduced-motion`** — wrap all animations in a media query that disables them for users who prefer reduced motion.

## Implementation Notes

**Files to modify:**
- `app/globals.css` — add all `@keyframes` definitions, animation utility classes, `prefers-reduced-motion` media query, hover/active state styles
- `app/page.tsx` — add animation classes to hero elements and feature cards, add IntersectionObserver for scroll reveals
- `app/dashboard/page.tsx` — add animation classes to stats bar, table rows, buttons, loading states
- `app/analyze/page.tsx` — add animation classes to video cards, table rows, loading states
- `app/login/page.tsx` — add entrance animation to the form container
- `app/components/NavBar.tsx` — subtle entrance animation on the nav bar

**Animation approach — CSS-first:**
All animations should be defined as `@keyframes` in `globals.css` with corresponding utility classes. Pages apply them via `className`. This keeps animations centralized, consistent, and easy to disable for reduced motion.

```css
/* Example pattern */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
  opacity: 0;
}

.delay-100 { animation-delay: 100ms; }
.delay-200 { animation-delay: 200ms; }
.delay-300 { animation-delay: 300ms; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Critical constraint for dashboard/analyze:** Same as Phase 2 — only add `className` attributes or thin wrapper `<div>`s for animation. Do NOT touch state hooks, useEffect, fetch calls, event handlers, data processing, sort/filter logic, or TypeScript types.

**IntersectionObserver for landing page scroll reveals:**
Add a small `useEffect` in `app/page.tsx` that observes elements with a `data-reveal` attribute and toggles a visible class when they enter the viewport. Keep it under 20 lines.

## Do Not Change

- `app/layout.tsx` — already finalized in Phase 1
- `lib/theme.ts` — theme toggle logic
- `lib/i18n.ts` — translation system
- `lib/format.ts` — number/currency formatting
- `lib/db.ts` — database connection (Protected Area)
- `lib/collector.ts` — YouTube API collection (Protected Area)
- `lib/quota-budget.ts` — budget constants (Protected Area)
- `app/api/` — all API routes (Protected Areas)
- `scripts/` — all scripts (Protected Area)
- `middleware.ts` — auth middleware
- Dashboard: state hooks, useEffect (except adding animation observer), fetch calls, event handlers, sort/filter logic, TypeScript types, table column structure
- Analyze: state hooks, useEffect, fetch calls, event handlers, sort/filter logic, TypeScript types

## Acceptance Criteria

- [ ] `npm run build` passes with zero errors
- [ ] Landing page hero content animates in with staggered delays on page load
- [ ] Landing page feature cards animate in on scroll (IntersectionObserver)
- [ ] Cards and table rows have hover depth (scale, shadow, or glow)
- [ ] Buttons have tactile press feedback (active state micro-interaction)
- [ ] Loading states use smooth CSS animations (not text-based)
- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] Dashboard table sorting, filtering, and all data interactions still work
- [ ] Analyze video submission and history table still work
- [ ] Login form still works (submit, error, loading states)
- [ ] `git diff --name-only` shows changes ONLY in the files listed above

## Verification

1. Run `npm run build` — capture last 10 lines
2. Run `git diff --name-only` — verify only expected files changed
3. Test landing page: page load animation, scroll to features (should animate in)
4. Test dashboard: hover table rows, click CollectButton, use ResearchBar, sort columns
5. Test analyze: submit video URL, hover video cards, sort history table
6. Test login: form entrance animation, submit button press feedback
7. Test reduced motion: set `prefers-reduced-motion: reduce` in browser dev tools, verify animations are disabled
8. Toggle light/dark theme — verify animations work in both

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
