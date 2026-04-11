# YTCombinator

YouTube channel automation suite — scheduling, analytics, content optimization, and thumbnail management in one dashboard.

## Before Implementing Any TASK

1. **Read the full TASK spec** — understand scope, acceptance criteria, and the Do Not Change section.
2. **Read BUILD.md** in this directory — it has schema DDL, API endpoints, auth model, and state machines.
3. **Query LightRAG** for cross-project context before touching shared patterns.
4. **Stay in scope.** Only modify files listed in the TASK spec. If something outside scope looks broken, create a VybePM task — do NOT fix it inline.
5. **Verify before committing.** Run `npm run build`, confirm zero type errors, check `git diff`.

## Architecture

- **Stack:** Next.js 16 (App Router, TypeScript), Tailwind CSS, Neon Serverless PostgreSQL, Vercel
- **Auth:** API key per channel (stored hashed in DB, passed via `Authorization: Bearer <key>` header)
- **External API:** YouTube Data API v3

### Protected Areas (global — TASK specs may add more)

- `lib/collector.ts` — YouTube API collection logic and quota management
- `lib/quota-budget.ts` — budget constants (DAILY_LIMIT, SEARCH_COST, COLLECTOR_BUDGET, MAX_KEYWORDS_PER_RUN)
- `lib/db.ts` — Neon connection pool
- `app/api/keywords/route.ts` — POST handler with collect_inline flow (complex, easy to break)
- `scripts/collect.ts` — cron collection script
- `.github/workflows/collect.yml` — daily collection cron
- Database schema in `scripts/migrate.sql` — additive changes only, never drop or rename existing

## Critical Notes

1. **YouTube API quotas**: Data API v3 has 10,000 unit daily quota. Analytics pulls must be batched and cached. Never poll in real-time — use the snapshots table.
2. **Neon cold starts**: First query after idle may take 1-2s. Use connection pooling via `@neondatabase/serverless` pool mode.
3. **Scheduled uploads**: Schedule table tracks intent. Actual uploading requires YouTube upload API + OAuth (not just a Data API key). Phase 1 tracks schedules; phase 2 adds upload integration.
4. **Content suggestions are local**: Title/tag optimization runs server-side logic (keyword analysis, character counts, SEO scoring). No external AI API calls in v1.
5. **Timezone handling**: All timestamps stored as UTC (`TIMESTAMPTZ`). Client converts to local for display.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `YOUTUBE_API_KEY` | YouTube Data API v3 key |
| `API_KEY_SALT` | Salt for API key hashing |

## What NOT to Do

- After completing work, review changes against these guidelines, then commit and push. Report any push failures.

For implementation details (schema, API endpoints, auth model, state machines), see BUILD.md.
