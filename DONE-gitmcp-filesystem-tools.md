# TASK: Re-add filesystem tools to GitMCP (DO NOT REMOVE THEM)

**Repo:** `/Users/angel/1000Problems/GitMCP`

## Context — Why This Task Exists Again

Commit `7685ed3` added filesystem tools. Commit `c91caa9` removed them because `readOnlyHint: false` triggers per-call permission prompts in Claude Code.

**That removal was wrong.** The primary consumer of these tools is **Cowork**, not Code. Cowork has NO native Read/Write/Edit/Glob that can reach the host filesystem — the git MCP is its only bridge. Without these tools, Cowork cannot:
- Create TASK-*.md specs in project directories (the Cowork → Code handoff)
- Read files in non-git directories (e.g. Animation/ creative assets)
- List directory contents without a .git directory present

Code already has native file tools. Code doesn't need to use these. But **do not remove them because Code doesn't need them.**

## CRITICAL INSTRUCTION

**DO NOT remove these tools after adding them.** The permission prompt issue only affects `fs_write` (the only tool with `readOnlyHint: false`). The read-only tools (`fs_list`, `fs_read`, `fs_stat`) all have `readOnlyHint: true` and cause zero prompts.

If the `fs_write` permission prompt is annoying in Code, that's fine — Code should use its native Write tool instead. Cowork will use `fs_write` through the MCP.

## What To Do

Revert the removal in `c91caa9` and re-add the tools with these specific names and improvements over the previous implementation:

### Tool 1: `fs_write`

Write (create or overwrite) a file at an absolute path.

**Input schema:**
```typescript
export const FsWriteInput = z.object({
  file_path: z.string().describe("Absolute path to the file to write"),
  content: z.string().describe("File content to write"),
  create_dirs: z.boolean().optional().default(true).describe("Create parent directories if they don't exist"),
  encoding: z.enum(["utf-8", "base64"]).optional().default("utf-8").describe("Content encoding — use base64 to write binary data"),
}).strict();
```

**Behavior:**
- Validate `file_path` against `config.allowedPaths` using `validateRepoPath()`
- If `create_dirs` is true, call `fs.mkdirSync(path.dirname(file_path), { recursive: true })`
- Write with `fs.writeFileSync(file_path, content, encoding)`
- Refuse to write files larger than 5MB (check `Buffer.byteLength(content, encoding)`)
- Refuse to overwrite `.git/` internals — reject any path containing `/.git/`
- Return the absolute path and byte size written

**Annotations:** `readOnlyHint: false, destructiveHint: false, idempotentHint: true`

### Tool 2: `fs_list`

List the contents of a directory.

**Input schema:**
```typescript
export const FsListInput = z.object({
  path: z.string().describe("Absolute path to the directory to list"),
  recursive: z.boolean().optional().default(false).describe("List recursively"),
  max_depth: z.number().int().positive().optional().default(3).describe("Maximum recursion depth (only with recursive)"),
  include_hidden: z.boolean().optional().default(false).describe("Include dotfiles and dotdirs"),
}).strict();
```

**Behavior:**
- Validate `path` against `config.allowedPaths` using `validateRepoPath()`
- Use `fs.readdirSync(path, { withFileTypes: true })`
- For each entry, output: name, type (file/dir/symlink), size (for files)
- For recursive mode, walk subdirectories up to `max_depth`. Auto-skip `node_modules`, `.git`, `.venv`, `.cache`
- Cap output at 500 entries

**Annotations:** `readOnlyHint: true, destructiveHint: false, idempotentHint: true`

### Tool 3: `fs_read`

Read the contents of a file.

**Input schema:**
```typescript
export const FsReadInput = z.object({
  file_path: z.string().describe("Absolute path to the file to read"),
  encoding: z.enum(["utf-8", "base64"]).optional().default("utf-8").describe("File encoding — use base64 for binary files"),
  max_size: z.number().int().positive().optional().default(1048576).describe("Maximum file size in bytes to read (default 1MB)"),
}).strict();
```

**Behavior:**
- Validate `file_path` against `config.allowedPaths`
- Check file size before reading — refuse if over `max_size`
- Read with `fs.readFileSync(file_path, encoding)`

**Annotations:** `readOnlyHint: true, destructiveHint: false, idempotentHint: true`

### Tool 4: `fs_stat`

Check if a path exists and get metadata.

**Input schema:**
```typescript
export const FsStatInput = z.object({
  path: z.string().describe("Absolute path to check"),
}).strict();
```

**Behavior:**
- Validate `path` against `config.allowedPaths`
- Use `fs.statSync(path)` (catch ENOENT for non-existent paths)
- Return: exists (boolean), type (file/dir/symlink), size, created, modified, permissions

**Annotations:** `readOnlyHint: true, destructiveHint: false, idempotentHint: true`

## Implementation Steps

### 1. Add schemas to `src/schemas/index.ts`

Add `FsWriteInput`, `FsListInput`, `FsReadInput`, and `FsStatInput` at the bottom of the file. Follow the existing `.strict()` and `.describe()` pattern.

### 2. Create tool files

Following the exact pattern of `src/tools/status.ts`:

- `src/tools/fs-write.ts` → `registerFsWriteTool(server, config)`
- `src/tools/fs-list.ts` → `registerFsListTool(server, config)`
- `src/tools/fs-read.ts` → `registerFsReadTool(server, config)`
- `src/tools/fs-stat.ts` → `registerFsStatTool(server, config)`

Each tool:
1. Calls `validateRepoPath(path, config.allowedPaths)` first
2. Uses Node `fs` module directly (NOT `execGit`)
3. Returns `{ content: [{ type: "text", text: result }] }`

**Extra for `fs_write`:**
- Reject any `file_path` containing `/.git/` (protect git internals)
- Reject content over 5MB
- Create parent directories by default
- Validate real path after mkdir to prevent symlink escapes

### 3. Register in `src/server.ts`

Import and register all 4 tools. Bump version to `"0.3.0"`.

### 4. Add tests

In `tests/integration/` add `fs-tools.test.ts`:
- `fs_write` creates a new file and returns correct size
- `fs_write` creates parent directories when they don't exist
- `fs_write` on path outside allowedPaths throws
- `fs_write` rejects paths containing `/.git/`
- `fs_write` rejects content over 5MB
- `fs_list` on a known directory returns expected entries
- `fs_list` recursive mode respects max_depth
- `fs_list` on path outside allowedPaths throws
- `fs_read` returns file contents correctly
- `fs_read` on path outside allowedPaths throws
- `fs_read` on file over max_size throws
- `fs_stat` on existing file returns correct metadata
- `fs_stat` on non-existent path returns exists: false
- `fs_stat` on path outside allowedPaths throws

### 5. Build and verify

```bash
npm run build
npm test
```

## Differences From Previous Implementation (c91caa9)

| What changed | Previous (removed) | This spec |
|---|---|---|
| Tool names | `git_write_file`, `git_read_file`, `git_list_files`, `git_delete_file` | `fs_write`, `fs_list`, `fs_read`, `fs_stat` |
| Delete tool | Included | **Not included** — too dangerous |
| `fs_stat` | Not included | **Added** — existence check without reading |
| `fs_list` recursive | No depth cap | Has `max_depth` and auto-skip of heavy dirs |
| `fs_write` .git protection | None | Rejects paths containing `/.git/` |
| `fs_write` size cap | None | 5MB max |
| `fs_read` size cap | None | 1MB default, configurable |
| `fs_list` entry cap | None | 500 entries max |

## Files Modified

| File | Changes |
|------|---------|
| `src/schemas/index.ts` | Add FsWriteInput, FsListInput, FsReadInput, FsStatInput |
| `src/tools/fs-write.ts` | New — file write/create tool |
| `src/tools/fs-list.ts` | New — directory listing tool |
| `src/tools/fs-read.ts` | New — file reading tool |
| `src/tools/fs-stat.ts` | New — path stat/existence tool |
| `src/server.ts` | Register 4 new tools, bump version to 0.3.0 |
| `tests/integration/fs-tools.test.ts` | New — 14 test cases |

## Commit message

```
Add filesystem tools: fs_write, fs_list, fs_read, fs_stat

Enables Cowork MCP clients to read and write any path within
allowedPaths without requiring a .git directory. Same security
boundary (allowedPaths + validateRepoPath), no delete capability.

These tools exist for Cowork (which has no native file tools for the
host filesystem). Code has native Read/Write/Edit — Code does not
need to use these, but must not remove them.

- fs_write: create/overwrite files, auto-mkdir, .git/ protection, 5MB cap
- fs_list: directory listing with recursion, depth cap, auto-skip heavy dirs
- fs_read: file contents (utf-8 or base64) with 1MB size guard
- fs_stat: path existence and metadata check
- 14 integration tests covering happy path and security validation
```
