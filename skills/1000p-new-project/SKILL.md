---
name: 1000p-new-project
description: "Scaffold a new 1000Problems project from an idea: create directory, GitHub repo, CLAUDE.md, VybePM registration, and git init — everything needed so Code can start building immediately. Use this skill whenever the user says 'new project', 'I have an idea for a project', 'spin up a new project', 'create a new app', or mentions wanting to start something new under the 1000Problems umbrella. Also trigger when the user wants to add a project to the ecosystem, bootstrap a repo, or get a new idea production-ready for Code."
---

# New 1000Problems Project

This skill takes a project idea from zero to build-ready — a real directory on disk, a GitHub repo, a CLAUDE.md that Code can execute against, and VybePM registration so tasks flow through the pipeline. After this skill completes, Code can open the project and start building with zero setup.

This is NOT the deployment skill. Deployment (Vercel, landing page, homepage card) happens later via `1000p-deploy-v2`. This skill handles the birth of a project — everything before the first line of app code gets written.

## Before you start

Gather these details from the user. Most can be inferred from a short conversation, but confirm before proceeding:

1. **Project name** — PascalCase for the directory (e.g., `YTCombinator`), lowercase-hyphenated for the GitHub repo (e.g., `ytcombinator`)
2. **One-liner** — What does this project do, in one sentence?
3. **Tech stack** — Framework, language, database, hosting target. Default to Next.js + Vercel + Neon unless the user specifies otherwise. For iOS apps, SwiftUI + SwiftData. For macOS, SwiftUI + AVFoundation.
4. **Project type** — Web app, iOS app, macOS app, API, CLI tool, creative assets directory
5. **Key features** — 3-5 bullet points describing what the project will do

If the user gives a rough idea like "a YouTube channel manager," that's enough — fill in reasonable defaults and confirm.

## Phase 1: Create the directory

All 1000Problems projects live at `/Users/angel/1000Problems/`. Create the project directory and a minimal README using `fs_write`:

```
/Users/angel/1000Problems/{ProjectName}/
├── CLAUDE.md          (Phase 2)
├── README.md          (this phase)
└── .gitignore         (this phase)
```

**README.md** — Keep it short:
```markdown
# {ProjectName}

{one-liner description}

## Status

Scaffolding — no app code yet. See CLAUDE.md for the build spec.

## Part of [1000Problems](https://www.1000problems.com)
```

**.gitignore** — Use the right template for the stack:

For Next.js/Node:
```
node_modules/
.next/
.env
.env.local
.vercel
```

For Swift (iOS/macOS):
```
.build/
DerivedData/
*.xcuserdata
.swiftpm/
```

For Python:
```
__pycache__/
.venv/
*.pyc
.env
```

## Phase 2: Write the CLAUDE.md

This is the most important file. It's Code's instruction manual — detailed enough that Code can build the entire project without asking questions.

Structure it exactly like this:

```markdown
# {ProjectName}

{one-liner description}

## Tech Stack

- **Framework**: {framework}
- **Language**: {language}
- **Database**: {database or "None"}
- **Hosting**: {Vercel / Azure / App Store / etc.}
- **Auth**: {auth approach}

## Project Structure

{directory tree showing where everything goes — app/, lib/, api/, etc.}

## Database Schema

{CREATE TABLE statements if applicable, or "No database" for client-only apps}

## API Endpoints

{table of Method | Path | Description | Auth for each endpoint, or "No API" for non-web projects}

## Key Features

{numbered list of what the app does}

## Environment Variables

| Variable | Description |
|----------|-------------|
{each env var needed}

## VybePM Integration

- **Project slug**: `{ProjectName}`
- **Task types**: {comma-separated types like: feature, bug, design, content}
- **Assignees**: angel, cowork

## Critical Notes

{gotchas, design decisions, constraints — things Code needs to know}
```

For iOS/macOS apps, replace API Endpoints with **Views** and **Models** sections. For creative/asset directories, simplify to just the folder structure and conventions.

The CLAUDE.md should pass the "cold start test": if Code opens this project for the first time with no other context, can it start building immediately? If not, add more detail.

## Phase 3: Create the GitHub repo

Create a repo under the **1000Problems** GitHub organization.

The repo name should be lowercase with hyphens: `{project-name}`.

Steps:
1. Create the repo via GitHub API:
   ```
   POST https://api.github.com/orgs/1000Problems/repos
   Authorization: token {GITHUB_PAT from references/infrastructure.md in 1000p-deploy-v2 skill}
   {"name": "{project-name}", "private": false, "description": "{one-liner}"}
   ```

2. Initialize git locally using git MCP tools (`git_init`, `git_add`, `git_commit`, `git_remote`, `git_push`) if available, otherwise tell the user to have Code run:
   ```bash
   cd /Users/angel/1000Problems/{ProjectName}
   git init
   git config user.email "angelsbadillos@gmail.com"
   git config user.name "1000Problems"
   git add -A
   git commit -m "Initial scaffold: CLAUDE.md + .gitignore"
   git remote add origin https://github.com/1000Problems/{project-name}.git
   git branch -M main
   git push -u origin main
   ```

**Important:** The git author email MUST be `angelsbadillos@gmail.com` for Vercel compatibility later. Get this right from the first commit.

## Phase 4: Register in VybePM

The project needs to exist in VybePM so tasks can be created against it (from Vybe voice, from the dashboard, or from Cowork).

**Option A — API call (preferred if Executor API is live):**
```
POST https://vybepm-v2.vercel.app/api/projects
{
  "name": "{ProjectName}",
  "slug": "{ProjectName}",
  "description": "{one-liner}",
  "tech_stack": "{framework, language}",
  "github_repo": "1000Problems/{project-name}",
  "is_active": true
}
```

**Option B — Update the seed script:**
Add an entry to `/Users/angel/1000Problems/VybePM-v2/scripts/seed.ts` in the `projects` array:
```typescript
{
  name: '{ProjectName}',
  slug: '{ProjectName}',
  description: '{one-liner}',
  is_active: true,
  deploy_url: null,  // filled in after deployment
  color: '{pick an unused hex color}',
  tech_stack: '{framework, language}',
  github_repo: '1000Problems/{project-name}',
},
```

Use `fs_write` to update the seed file, then tell the user to run `npx tsx scripts/seed.ts` in the VybePM-v2 directory.

## Phase 5: Verify everything

Run through this checklist before telling the user the project is ready:

1. **Directory exists** — `fs_stat /Users/angel/1000Problems/{ProjectName}` returns `exists: true`
2. **CLAUDE.md is complete** — `fs_read` it back and confirm it passes the cold start test
3. **GitHub repo exists** — Verify via API or tell user to check `github.com/1000Problems/{project-name}`
4. **Git is initialized** — `.git/` directory exists in the project folder
5. **VybePM entry** — Confirm the project slug is registered

## After this skill completes

Tell the user:

> **{ProjectName} is scaffolded and ready.**
> - Directory: `/Users/angel/1000Problems/{ProjectName}`
> - GitHub: `github.com/1000Problems/{project-name}`
> - VybePM slug: `{ProjectName}`
>
> **Next steps:**
> 1. Open the project in Code and start building (Code reads CLAUDE.md)
> 2. When ready to deploy, use the `1000p-deploy-v2` skill
> 3. Create tasks via VybePM dashboard or Vybe voice using the project slug

## What this skill does NOT do

- **No app code** — This creates the scaffold, not the application. Code writes the app.
- **No deployment** — Use `1000p-deploy-v2` for Vercel, landing page, and homepage card.
- **No database setup** — Happens during deployment or when Code starts building.
- **No domain configuration** — Part of deployment.

## Color palette for VybePM

Pick a color that hasn't been used yet. Current assignments (check seed.ts for the latest):

| Project | Color |
|---------|-------|
| AnimationStudio | `#FF6B6B` |
| VybePM-v2 | `#4ECDC4` |
| Vybe | `#45B7D1` |
| GitMCP | `#96CEB4` |
| ytcombinator | `#FFEAA7` |
| RubberJoints-iOS | `#DDA0DD` |
| 1000Problems | `#FF9FF3` |
| prompts | `#A0A0A0` |
| VoiceQ | `#74B9FF` |
| Animation | `#FD79A8` |

Pick from unused warm/cool tones to keep the dashboard visually distinct.
