# Superpowers Patterns — Adopted for 1000Problems

Source: https://github.com/obra/superpowers (v5.0.7)
Evaluated: 2026-04-09
Status: Patterns extracted, not installed. Ideas integrated into codeTasks, vybeforever, and vybepm-reviewer.

## What Superpowers Is

A composable skill framework for AI coding agents that enforces disciplined engineering: design before code, evidence before claims, spec compliance before code quality. It transforms ad-hoc AI coding into a structured pipeline with mandatory checkpoints.

## Patterns We Adopted

### 1. Verification Before Completion (the "Iron Law")

No task is marked complete without fresh evidence pasted into the task notes. Not "should pass now" — actual terminal output.

For buildable projects (Next.js): `npm run build` output + `git diff --name-only`.
For unbuildable projects (iOS/Swift): `git diff --name-only` + file:line references per acceptance criterion.

Evidence goes into VybePM task notes in a structured format so the reviewer can parse it programmatically.

### 2. Rationalization Prevention

Common excuses Code uses to drift, with reality checks:

| Rationalization | Reality |
|----------------|---------|
| "This file needs fixing too" | That's scope creep. Create a VybePM task, don't fix it inline. |
| "I'll refactor this while I'm here" | Unauthorized cleanup. The TASK spec didn't ask for it. |
| "The tests pass so it's done" | Tests passing is necessary but not sufficient. Show the evidence. |
| "This is a trivial change, no plan needed" | Trivial changes break things. Follow the TASK spec. |
| "I'll add error handling to be safe" | Only add what the spec asks for. YAGNI. |
| "The adjacent component should match" | Stay in scope. If it should match, that's a new TASK. |

### 3. Two-Stage Review

Before a task moves from `review` to `checked_in`:

Stage 1 — Spec Compliance: Does every acceptance criterion have evidence? Does git diff match the expected file list? Any out-of-scope files?

Stage 2 — Sanity Check: Only if Stage 1 passes. Look at actual code changes. Hardcoded secrets? `any` types? Deleted code that shouldn't be? TODO comments? Obvious logic errors?

Reject back to `in_progress` with specific reasons if either stage fails.

### 4. Structured Completion Notes

Every completed task must include this format in VybePM notes:

```
## Completion Evidence

### Scope Check
Files modified: (git diff --name-only output)
Files outside TASK scope: NONE | (list + justification)

### Build (if applicable)
(last 10 lines of build output, or "N/A — iOS project, not buildable from CLI")

### Acceptance Criteria
1. [x] criterion — EVIDENCE: file:line or terminal output
2. [x] criterion — EVIDENCE: file:line or terminal output
3. [ ] criterion — BLOCKED: reason

### Self-Review
- Modified files not in TASK? No
- Refactored adjacent code? No
- Added features not in spec? No
```

## Patterns We Skipped

### TDD Red-Green-Refactor
Overkill for our portfolio — most tasks are UI, API routes, and Swift views. The build itself is our primary test. Would reconsider for library-level code.

### Git Worktree Isolation
Unnecessary. Angel handles git manually. Code doesn't push.

### Subagent Dispatching
vybeforever already orchestrates per-project. Adding subagent coordination would increase complexity without clear benefit at our scale.

### Full Brainstorming Skill
We already do this better — Cowork (Opus) + Angel designs together, saves to LightRAG, writes TASK spec. Superpowers' brainstorming is for single-agent workflows where the agent designs alone.

## Where These Patterns Live

- **codeTasks skill** — TASK template includes completion evidence section, rationalization table, and tiered verification (build vs. reference)
- **vybeforever skill** — Code must fill in completion evidence before setting task to `review`
- **vybepm-reviewer scheduled task** — Two-stage review parsing structured notes
- **Root CLAUDE.md** — "Plan Before You Code" section references these patterns

## Key Principle

"Claiming work is complete without verification is dishonesty, not efficiency."
