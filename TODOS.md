# TODOS

## Design Debt

### Create DESIGN.md (design system)
- **What:** Run `/design-consultation` to create a formal DESIGN.md with typography scale, spacing system, color palette, and component patterns.
- **Why:** The dashboard currently uses tokens extracted from the landing page, but there's no single source of truth. Without it, every new page risks visual drift.
- **Depends on:** Nothing. Can be done anytime before Phase 1.
- **Effort:** ~15 min with /design-consultation

### Set up gstack designer (OpenAI API key)
- **What:** Run `~/.claude/skills/gstack/design/dist/design setup` and provide an OpenAI API key.
- **Why:** Enables visual mockup generation for design reviews, design exploration (/design-shotgun), and HTML generation (/design-html). Currently blocked.
- **Depends on:** OpenAI API key (https://platform.openai.com/api-keys)
- **Effort:** ~2 min setup

## Engineering Debt

### Data retention policy for keyword_rankings
- **What:** Add a retention policy to prevent keyword_rankings from growing unbounded. Options: keep daily snapshots for 90 days, aggregate to weekly summaries after that, or partition by month.
- **Why:** keyword_rankings grows ~1,250 rows/day (456K/year). Without retention, dashboard CTE queries will degrade on Neon cold starts over time.
- **Pros:** Keeps query performance stable. Reduces Neon storage costs.
- **Cons:** Aggregation loses granularity. Need to decide what "old" data looks like (weekly avg? just latest snapshot?).
- **Depends on:** Nothing. Implement before keyword_rankings exceeds ~200K rows.
- **Effort:** ~30 min with CC (migration + cron job to prune/aggregate)

### Daily rank change notifications
- **What:** After the cron collector finishes, compute rank changes vs yesterday and send a summary notification (email via Resend/Postmark, or webhook to Slack/Discord).
- **Why:** Without proactive notifications, the dashboard becomes a table you forget to check. The value is in trend detection, and trends only matter if you see them.
- **Pros:** Turns a passive database into an active intelligence tool. Low effort.
- **Cons:** Adds an email service dependency (Resend is free for 100 emails/day, more than enough).
- **Depends on:** Collector must be running and accumulating data for 2+ days.
- **Effort:** ~30 min with CC (compute diff query + Resend integration)
