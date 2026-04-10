---
name: codeTasks
description: "Generate structured TASK spec files for Claude Code to execute. Use this skill whenever Cowork needs to hand off implementation work to Code — writing a feature spec, bug fix spec, refactor spec, or any TASK-*.md file. Also trigger when the user says 'write a task for code', 'spec this for code', 'hand this off to code', 'create a TASK file', or when a conversation reaches the point where implementation should be delegated to Code rather than done in Cowork."
---

# codeTasks — TASK Spec Generator for Claude Code

Cowork designs. Code implements. This skill ensures every handoff is airtight — Code (running Sonnet) gets exactly what it needs to execute without guessing, drifting, or breaking things it shouldn't touch.

## When to Use

- After discussing a feature/fix/refactor with Angel and agreeing on what to build
- When Angel says "write this up for code" or "spec this out"
- When the natural next step is implementation that belongs in Claude Code
- When creating VybePM tasks that will be picked up by the executor

## Step 1: Gather Context

Before writing the TASK file, collect this information (some may already be in the conversation):

1. **Project** — which repo? (ytcombinator, VybePM-v2, AnimationStudio, GitMCP, etc.)
2. **What** — what needs to be built/fixed/changed?
3. **Why** — what problem does this solve or what value does it add?
4. **Scope** — which files/components are in play?
5. **Protected areas** — what must NOT be touched? (Check the project's CLAUDE.md for global protected areas, then add task-specific ones)

If any of these are unclear from the conversation, ask Angel before writing.

## Step 2: Query LightRAG

Before writing the spec, query LightRAG for relevant cross-project context:

```bash
curl -X POST http://localhost:9621/query \
  -H "Content-Type: application/json" \
  -d '{"query": "architectural context for [feature] in [project]", "mode": "hybrid"}'
```

Use the results to:
- Identify patterns Code should follow (e.g., "VybePM uses sql tagged templates, not an ORM")
- Spot potential conflicts with other projects
- Reference related implementations Code can use as examples

## Step 3: Write the TASK File

Create the file at: `~/1000Problems/{project}/TASK-{slug}.md`

Use this exact structure:

```markdown
# TASK: {Title}

> {One-line summary of what this task accomplishes}

## Context

{2-3 sentences explaining WHY this task exists. What problem does it solve?
What conversation or decision led to this? Link to the motivation, not just
the mechanics.}

## Requirements

{Numbered list of concrete, testable requirements. Each item should be
something Code can verify with a build, a test, or a visual check.}

1. ...
2. ...
3. ...

## Implementation Notes

{Technical guidance to prevent wrong turns. Include:
- Which files to create or modify (be specific with paths)
- Patterns to follow (reference existing code as examples)
- API contracts, data shapes, or type signatures
- Edge cases to handle
- LightRAG context if relevant (e.g., "VybePM executor API uses X-API-Key + X-Executor headers")}

## Do Not Change

{Explicit list of files, components, and patterns that are OFF LIMITS.
Start with the project's global protected areas from CLAUDE.md, then add
task-specific ones. This is the most important section for Sonnet — without
it, Code will "helpfully" refactor adjacent code.}

- `path/to/file.ts` — {reason it's protected}
- `path/to/other.ts` — {reason}
- {pattern or convention} — {reason}

## Acceptance Criteria

{How does Angel (or the reviewer) verify this is done correctly?}

- [ ] `npm run build` passes with zero errors
- [ ] {Visual or functional check}
- [ ] {Specific behavior that must work}
- [ ] `git diff` shows changes ONLY in files listed under Implementation Notes

## Verification

{What Code should do before considering the task complete:}

1. Run the build/compile step for the project
2. Check `git diff` — no files outside scope should be modified
3. Test the specific behavior described in acceptance criteria
4. If the project has tests, run them and confirm they pass
```

## Step 4: Review with Angel

Before committing, present the TASK spec to Angel for review. Key things to confirm:
- Is the scope right? (not too broad, not too narrow)
- Is the Do Not Change list complete?
- Are the acceptance criteria specific enough?

## Step 5: Commit and Push

After Angel approves (or says to proceed):

```
git add TASK-{slug}.md
git commit -m "add TASK spec: {short description}"
git push
```

## Style Rules for TASK Specs

- **Be specific, not vague.** "Add a NavBar component" is bad. "Extract a shared NavBar component from the duplicate nav code in dashboard/page.tsx (lines 644-672) and analyze/page.tsx (lines 389-414)" is good.
- **Include file paths.** Code running Sonnet doesn't have Opus-level inference. Tell it exactly where to look.
- **Show, don't describe.** If there's a data shape, type signature, or API contract, include the actual code/JSON — don't describe it in prose.
- **Reference existing patterns.** "Follow the same pattern as the ResearchBar component in dashboard/page.tsx" gives Code a concrete example to match.
- **Keep Do Not Change aggressive.** When in doubt, protect it. It's much easier to widen scope later than to undo damage from an over-eager refactor.
- **No ambiguity in acceptance criteria.** Every criterion should be binary — it either passes or it doesn't. No "should look good" or "should work well."

## Anti-Patterns to Avoid

- **Mega-TASKs** — If a spec has more than 5 requirements, split it into multiple TASK files. Code handles focused tasks well; sprawling ones cause drift.
- **Missing context** — Don't assume Code remembers previous conversations. Every TASK must be self-contained.
- **Implicit Do Not Change** — "Just the button" is not enough. List every file and component that should remain untouched.
- **No verification step** — Every TASK must include how to verify. If you can't define how to check it, the task isn't ready.
