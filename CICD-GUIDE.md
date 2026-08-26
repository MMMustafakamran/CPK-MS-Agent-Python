# Agent CI/CD Transformation & Troubleshooting Guide

> **Audience:** agents and engineers porting this recording pipeline into another
> CopilotKit / Agent Framework repository.
> **Goal:** dense, high-signal blueprint plus the pitfalls that have actually
> cost runs here.

For how to *operate* the pipeline in this repo, see [`ci/README.md`](ci/README.md).
This file is about porting it somewhere else.

---

## 1. Target architecture

```
                        GitHub Actions Matrix (3 Parallel Workers)
 ┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
 │ Worker 1/3                      │ Worker 2/3                      │ Worker 3/3                      │
 │ [xvfb-run 1920x1080 display]    │ [xvfb-run 1920x1080 display]    │ [xvfb-run 1920x1080 display]    │
 │  ├── Backend  (:8000)           │  ├── Backend  (:8000)           │  ├── Backend  (:8000)           │
 │  ├── Frontend (:3000)           │  ├── Frontend (:3000)           │  ├── Frontend (:3000)           │
 │  └── Playwright Recorder        │  └── Playwright Recorder        │  └── Playwright Recorder        │
 └────────────────┬────────────────┴────────────────┬────────────────┴────────────────┬────────────────┘
                  │                                 │                                 │
                  └─────────────────────────────────┼─────────────────────────────────┘
                                                    ▼
                             Downstream job: `consolidate-recordings`
                             Merges every *.webm + RUN_REPORT into one artifact
```

Shard assignment comes from `--shard=K/N`. Each worker records its slice and
uploads it; consolidate only downloads and re-uploads.

---

## 2. Porting checklist

Everything CI/CD-related belongs in **one `ci/` folder**, with the workflow the
sole exception (GitHub requires `.github/workflows/`). Keeping it packaged is
what makes it portable: copy `ci/`, copy the workflow, adjust config.

```
ci/
├── automate.mjs          orchestrator (single process)
├── check-doc-drift.mjs   live-doc hash verifier
├── list-pages.mjs        prints valid page ids
├── validate-pages.mjs    rejects typos before a run
└── lib/
    ├── config.mjs        paths, ports, warmup routes  ← main thing to edit
    ├── env.mjs           .env loading, matching the backend's precedence
    ├── pages.mjs         reads page ids from recorder config
    ├── preflight.mjs     port / credential / warmup guards
    ├── mux.mjs           voiceover muxing
    └── report.mjs        RUN_REPORT.md + .json
```

Plus, in the target repo:

1. `autorecorder/cli.ts` — must support `--shard=K/N`, `--pages=…`, `--limit=…`,
   `--force`.
2. `.github/workflows/daily-recorder.yml` — matrix + consolidate.
3. Root `package.json` — thin `npm run` aliases pointing into `ci/`.

**Do not** duplicate the page list, the mux command, or the dependency-update
logic anywhere else. Each duplicate drifts.

---

## 3. Blueprints

### A. Single-process orchestrator

**Why:** every YAML `run:` step is its own subshell. `backend &` in step 1 is
reaped before step 2 starts. Spawn both servers inside one Node process instead.

```javascript
const proc = spawn('uv run --prerelease=allow main.py', {
  cwd: BACKEND_DIR,
  stdio: ['ignore', fd, fd],   // fd = an open log file, NOT 'pipe', NOT 'ignore'
  shell: true,
  detached: process.platform !== 'win32',
});

function killTree(proc) {
  if (!proc?.pid) return;
  try {
    process.platform === 'win32'
      ? execSync(`taskkill /pid ${proc.pid} /T /F 2>nul || exit 0`, { stdio: 'ignore' })
      : process.kill(-proc.pid, 'SIGTERM');
  } catch {
    proc.kill('SIGTERM');
  }
}
```

`stdio` deserves care. `'pipe'` deadlocks when the 64KB OS buffer fills;
`'ignore'` discards the traceback you need when a server dies mid-run. Write to
a file descriptor and upload the logs as artifacts.

### B. CLI matrix sharding

```typescript
const shardMatch = rawArgs.find((a) => a.startsWith('--shard='));
if (shardMatch) {
  const [curr, total] = shardMatch.split('=')[1].split('/').map(Number);
  if (total > 0 && curr > 0 && curr <= total) {
    const chunkSize = Math.ceil(targetPages.length / total);
    const start = (curr - 1) * chunkSize;
    targetPages = targetPages.slice(start, Math.min(start + chunkSize, targetPages.length));
  }
}

// Exit 0 when a shard gets no pages (1 page selected across 3 workers).
if (targetPages.length === 0) {
  if (shardMatch) {
    console.log('ℹ️ No pages assigned to this shard. Exiting cleanly.');
    process.exit(0);
  }
  process.exit(1);
}
```

### C. Workflow inputs — mind the cap

`workflow_dispatch` accepts **at most 10 inputs**. Exceeding it makes the
workflow invalid and manual dispatch fails before any job starts. One checkbox
per page does not scale past ~6 pages.

Use a single comma-separated field and validate it against the recorder's own
config:

```yaml
inputs:
  pages:
    description: 'Comma-separated page ids (blank = all)'
    type: string
    default: ''
```

```yaml
- name: Validate page selection
  if: inputs.pages != '' && inputs.custom_args == ''
  run: node ci/validate-pages.mjs "${{ inputs.pages }}"
```

Pass dispatch inputs through `env:` rather than interpolating `${{ }}` directly
into a shell line — interpolation splices raw text into the script.

### D. Mux once, where the video is made

Muxing in both the worker and the consolidate job double-encodes: the worker
produces an audio track, then consolidate muxes the same track onto the already
muxed file. Pick one. This repo muxes in the worker and installs ffmpeg there.

WebM cannot carry AAC — re-encode to `libopus`:

```bash
ffmpeg -y -i video.webm -i track.m4a -c:v copy -c:a libopus -map 0:v:0 -map 1:a:0 -shortest out.webm
```

---

## 4. Pitfalls (verify each when porting)

| # | Pitfall | Root cause | Rule |
|---|---|---|---|
| **1** | Headless Linux display crash | `headless: false` needs an X server | Wrap CI runs in `xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24"` |
| **2** | Child process pipe freeze | `stdio: 'pipe'` blocks when the 64KB buffer fills | Spawn servers with an open **file descriptor**; never `'pipe'`, and avoid `'ignore'` (see #12) |
| **3** | Playwright vs DOM selectors | `button:has-text(…)` is invalid inside `document.querySelector` | Standard CSS in browser contexts; wrap `querySelector` in try/catch |
| **4** | Universal 401 chat rejection | `AUTH_BEARER_TOKEN` set without `NEXT_PUBLIC_AUTH_BEARER_TOKEN` | Leave `AUTH_BEARER_TOKEN` unset so the agent runs open |
| **5** | CRLF vs LF hash drift | Windows checkout rewrites line endings | Strip BOM and normalize `\r\n` → `\n` before hashing |
| **6** | Persistent inputs vs chat composers | Custom forms keep their text after submit | `expectInputToEmpty: false` + explicit button locators |
| **7** | Empty shard failure | Fewer pages than workers | `if (targetPages.length === 0 && isShard) process.exit(0)` |
| **8** | React SSR hydration mismatch | Client-only ids differ between SSR and mount | `useSyncExternalStore(() => () => {}, () => true, () => false)` |
| **9** | Doctor range drift | Edits shift highlighted line numbers | Run `npm run record:doctor` after touching demo files |
| **10** | Voiceover muxing | WebM rejects AAC; ffmpeg absent on runners | Install ffmpeg, encode `libopus`, and mux in exactly one job (see Blueprint D) |
| **11** | **Dispatch inputs over the cap** | `workflow_dispatch` allows 10 inputs; 24 were declared, so manual runs failed before any job started | One `pages` string input, validated against the recorder config |
| **12** | **Two servers on one port** | Windows lets a second process bind a port another is listening on. A stale server holding an old API key answered requests beside the new one, so config fixes appeared to do nothing | Fail on a busy port before starting anything; `--allow-port-reuse` to opt out |
| **13** | **Silent credential failure** | A placeholder `OPENAI_API_KEY` let all 20 pages record and fail on 401, discovered only at the end | Verify the credential in preflight — one request saves a 25-minute run |
| **14** | **Env file shadowing** | `backend/.env` is loaded before the root `.env` with `override=False`; an uncommented placeholder there beats a real key at the root | Keep exactly one file defining a given key, and load with the same precedence in CI tooling (`ci/lib/env.mjs`) |
| **15** | **Cold-compile mistaken for a dead frontend** | Turbopack builds routes on demand; the first hit took 21s and blew the recorder's preflight timeout | Warm the heavy routes after the health check, before recording |
| **16** | **Orphaned recorder processes** | Stopping the npm wrapper left `tsx` and a Chromium tree running | Kill the process tree, not the wrapper |
| **17** | **Scripts referencing files that do not exist** | `package.json` pointed at `scripts/qa-refresh.mjs`, which was never committed | Every `npm run` target must resolve to a real file |
| **18** | **Backslashes in package.json scripts** | `"dev-terminals\run…"` — `\r` is a carriage return in JSON, silently corrupting the command | Avoid Windows paths in `scripts`; if unavoidable, escape as `\\` |

---

## 5. Porting steps

1. Copy `ci/` and `.github/workflows/daily-recorder.yml`.
2. Edit `ci/lib/config.mjs` — ports, directory names, warmup routes.
3. Check `ci/lib/env.mjs` matches how the target backend loads its env.
4. Point `ci/lib/pages.mjs` at the target's recorder config if the shape differs.
5. Update `ci/lib/mux.mjs`'s `AUDIO_TRACKS` (or empty it if there is no voiceover).
6. Add the `npm run` aliases to the root `package.json`.
7. Configure repository secrets and variables (table in `ci/README.md`).
8. Verify: `npm run ci:pages`, `npm run drift`, then
   `node ci/automate.mjs --limit=1 --ignore-doc-drift`.
