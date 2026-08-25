# CI/CD Transformation Guide

A complete, to-the-point playbook to transform a multi-service CopilotKit test harness into an automated **parallel CI/CD demo recording and validation pipeline**.

---

## 1. Architecture Overview (3-Worker Matrix)

```
                       ┌─────────────────────────────────┐
                       │   GitHub Actions Workflow       │
                       └────────────────┬────────────────┘
                                        │
                ┌───────────────────────┼───────────────────────┐
                ▼                       ▼                       ▼
      ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
      │ Worker 1/3       │    │ Worker 2/3       │    │ Worker 3/3       │
      │ Pages 1 - 7      │    │ Pages 8 - 14     │    │ Pages 15 - 20    │
      │ Time: ~5.5 mins  │    │ Time: ~5.5 mins  │    │ Time: ~5.5 mins  │
      └─────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
                │                       │                       │
                └───────────────────────┼───────────────────────┘
                                        ▼
                       ┌─────────────────────────────────┐
                       │ Merge & Consolidate (1 Zip)     │
                       │ 20 Videos + Unified RUN_REPORT  │
                       └─────────────────────────────────┘
```

* **Total Runtime:** Reduced from **~20 minutes down to ~5–6 minutes**.
* **Runner Specs:** Each worker gets dedicated 2 vCPUs, 7 GB RAM, and a virtual X11 display buffer (`xvfb-run`).
* **Unified Output:** All shard outputs are consolidated into a single downloadable artifact ZIP: `demo-recordings-all-<sha>`.

---

## 2. Files Required

To port this setup to any new framework repository, create or adapt these core files:

| File | Purpose |
|---|---|
| **`autorecorder/cli.ts`** | Added `--shard=INDEX/TOTAL` support to partition target routes across parallel runners. |
| **`scripts/automate.mjs`** | Single-process orchestrator: runs doc drift, syncs packages, starts servers (`:8000` & `:3000`), polls health, records demos, and generates `RUN_REPORT.md`/`json`. |
| **`scripts/check-doc-drift.mjs`** | Fetches live `.md` doc endpoints, strips BOM, normalizes CRLF/LF, and diffs SHA256 hashes against `doc-snapshot/manifest.json`. |
| **`.github/workflows/daily-recorder.yml`** | GitHub Actions workflow with 3 parallel matrix workers, interactive checkboxes for all 20 pages, and an artifact merge job. |

---

## 3. Implementation Details

### Step 1: Matrix Sharding in CLI (`autorecorder/cli.ts`)
Add `--shard=K/N` argument handling to divide active pages evenly across worker shards:

```typescript
// autorecorder/cli.ts
const shardMatch = rawArgs.find((a) => a.startsWith('--shard='));
if (shardMatch) {
  const [currStr, totalStr] = shardMatch.split('=')[1].split('/');
  const curr = parseInt(currStr, 10);
  const total = parseInt(totalStr, 10);
  if (!isNaN(curr) && !isNaN(total) && total > 0 && curr > 0 && curr <= total) {
    const chunkSize = Math.ceil(targetPages.length / total);
    const start = (curr - 1) * chunkSize;
    const end = Math.min(start + chunkSize, targetPages.length);
    targetPages = targetPages.slice(start, end);
  }
}
```

### Step 2: Automation & Report Generator (`scripts/automate.mjs`)
Manages background processes safely in a single Node.js process and outputs execution metrics:
- **Dependency upgrade with peer check:** `npx npm-check-updates -u --peer` & `uv sync --upgrade`.
- **Process groups on Linux:** Uses `detached: true` and `process.kill(-proc.pid)` for clean teardown.
- **Reporting:** Writes `autorecorder/videos/RUN_REPORT.md` and `RUN_REPORT.json` containing doc drift status, package versions, health check latencies, and generated video file sizes.

### Step 3: GitHub Actions Workflow (`.github/workflows/daily-recorder.yml`)

```yaml
name: Daily Auto-Update and Demo Recording

on:
  schedule:
    - cron: '0 6 * * *' # Daily at 06:00 UTC
  workflow_dispatch:
    inputs:
      run_all_pages:
        description: 'Record ALL 20 pages (default / uncheck to choose specific pages below)'
        type: boolean
        default: true
      upgrade_packages:
        description: 'Upgrade packages (ncu -u --peer & uv sync --upgrade)'
        type: boolean
        default: false
      fail_on_doc_drift:
        description: 'Fail immediately if doc drift is detected'
        type: boolean
        default: false
      custom_args:
        description: 'Or custom CLI args (e.g. --limit=5)'
        type: string
        default: ''

      # 20 Individual Page Selection Checkboxes
      page_quickstart: { description: 'Page 01: Quickstart', type: boolean, default: false }
      page_prebuilt_components: { description: 'Page 02: Prebuilt Components', type: boolean, default: false }
      page_slots: { description: 'Page 03: Custom Slots', type: boolean, default: false }
      page_headless_ui: { description: 'Page 04: Headless UI', type: boolean, default: false }
      page_programmatic_control: { description: 'Page 05: Programmatic Control', type: boolean, default: false }
      # ... Add checkboxes for remaining pages ...

jobs:
  record-workers:
    name: Worker ${{ matrix.shard }}/3
    runs-on: ubuntu-latest
    timeout-minutes: 35
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3]

    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      OPENAI_CHAT_MODEL_ID: ${{ vars.OPENAI_CHAT_MODEL_ID || 'gpt-4o-mini' }}

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup uv & Python
        uses: astral-sh/setup-uv@v5
        with:
          enable-cache: true
      - run: uv python install 3.12

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'

      - name: Install Playwright & Chromium
        run: |
          cd autorecorder
          npm install
          npx playwright install --with-deps chromium

      - name: Run Automation Pipeline (Shard ${{ matrix.shard }}/3)
        run: |
          # Parse selection checkboxes or default to matrix sharding
          RECORD_ARGS="--shard=${{ matrix.shard }}/3"
          EXTRA_FLAGS=""
          [ "${{ inputs.upgrade_packages }}" = "true" ] && EXTRA_FLAGS="$EXTRA_FLAGS --upgrade"
          [ "${{ inputs.fail_on_doc_drift }}" != "true" ] && EXTRA_FLAGS="$EXTRA_FLAGS --ignore-doc-drift"

          xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" node scripts/automate.mjs $EXTRA_FLAGS $RECORD_ARGS

      - name: Publish Shard Summary to GitHub Actions
        if: always()
        run: |
          [ -f "autorecorder/videos/RUN_REPORT.md" ] && cat autorecorder/videos/RUN_REPORT.md >> $GITHUB_STEP_SUMMARY

      - name: Upload Shard Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: demo-recordings-shard-${{ matrix.shard }}
          path: |
            autorecorder/videos/*.webm
            autorecorder/videos/RUN_REPORT.md
            autorecorder/videos/RUN_REPORT.json
          retention-days: 14

  consolidate-recordings:
    name: Consolidate & Merge All Video Artifacts
    needs: record-workers
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Download all shard artifacts
        uses: actions/download-artifact@v4
        with:
          path: all-recordings
          pattern: demo-recordings-shard-*
          merge-multiple: true

      - name: Upload Consolidated Demo Recordings Package
        uses: actions/upload-artifact@v4
        with:
          name: demo-recordings-all-${{ github.sha }}
          path: all-recordings/
          retention-days: 14
```

---

## 4. Critical Gotchas & Rules

| Gotcha | Problem | Solution |
|---|---|---|
| **Headless Linux Display** | Playwright headed mode crashes on Ubuntu runner with `Missing X server or $DISPLAY`. | Wrap execution with `xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24"`. |
| **Process Reaper** | Background servers started in separate YAML steps die immediately when subshell exits. | Run all services and tests within `node scripts/automate.mjs`. |
| **Auth Tokens** | Setting `AUTH_BEARER_TOKEN` without matching frontend token causes all chats to fail with 401. | Leave `AUTH_BEARER_TOKEN` unset by default unless explicitly testing auth. |
| **DOM CSS Selectors** | Non-standard selectors (e.g. `button:has-text(...)`) fail native `document.querySelector`. | Use standard CSS in `selectors.config.ts` (e.g. `[data-testid="..."], button[type="submit"]`). |
| **Persistent Inputs** | Forms that retain text upon submission (e.g. Programmatic Control) timeout in `sendPrompt`. | Use `expectInputToEmpty: false` option in `sendPrompt`. |
| **Hash Drift Normalization** | CRLF (`\r\n`) vs LF (`\n`) creates false positive doc drift on Windows vs Linux. | Strip BOM and normalize line endings before computing SHA256 hashes. |
