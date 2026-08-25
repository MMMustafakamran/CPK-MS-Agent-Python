# CI/CD Transformation Guide

A step-by-step playbook to transform a multi-service CopilotKit integration test repo into an automated **daily CI/CD recording and validation pipeline**.

---

## 1. Architecture Overview

A complete test harness requires coordinating three parts:

```
┌─────────────────────────────────────────────────────────────┐
│                   GitHub Actions Runner                     │
│                                                             │
│  [xvfb Virtual Display: 1920x1080]                          │
│                                                             │
│  ┌──────────────────┐    ┌─────────────────┐    ┌────────┐  │
│  │ Backend (:8000)  │ ◄─►│ Frontend (:3000)│ ◄─►│Playwright│ │
│  │ FastAPI / AG-UI  │    │ Next.js Runtime │    │Recorder│  │
│  └──────────────────┘    └─────────────────┘    └────────┘  │
│                                                     │       │
│                                                     ▼       │
│                                             [videos/*.webm] │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Files Required

To port this setup to another framework repo, copy or create these 3 files:

| File | Purpose |
|---|---|
| **`scripts/automate.mjs`** | Orchestrates updates, starts background servers, waits for health, and executes recordings in a single process. |
| **`scripts/check-doc-drift.mjs`** | Fetches live docs and diffs them against `doc-snapshot/` before testing. |
| **`.github/workflows/daily-recorder.yml`** | GitHub Actions workflow that installs dependencies, runs `xvfb-run`, and uploads video artifacts. |

---

## 3. Step-by-Step Implementation

### Step 1: Add the Automation Orchestrator (`scripts/automate.mjs`)
In CI/CD, running background processes in separate YAML steps (`uv run ... &`) fails because GitHub Actions kills orphan background processes when a step subshell exits.

**`scripts/automate.mjs` solves this** by managing the entire lifecycle in one persistent Node.js process:
1. Validates doc drift against `doc-snapshot/`.
2. Syncs backend (`uv sync --prerelease=allow`) and installs frontend deps.
3. Spawns backend (`:8000`) and frontend (`:3000`).
4. Polls `http://127.0.0.1:8000/health` and `http://127.0.0.1:3000` until `200 OK`.
5. Executes the Playwright recorder with passed arguments (e.g. `--limit=3`).
6. Cleanly terminates background processes on completion or error.

### Step 2: Add Doc Drift Check (`scripts/check-doc-drift.mjs`)
- Reads `doc-snapshot/manifest.json`.
- Fetches live `.md` endpoints for each tracked page.
- Normalizes text (`\r\n` $\rightarrow$ `\n` and BOM stripping).
- Compares SHA256 hashes and classifies drift severity (High, Medium, Low).

### Step 3: Add the GitHub Actions Workflow (`.github/workflows/daily-recorder.yml`)

```yaml
name: Daily Auto-Update and Demo Recording

on:
  schedule:
    - cron: '0 6 * * *' # Daily at 06:00 UTC
  workflow_dispatch:
    inputs:
      record_args:
        description: 'Autorecorder CLI arguments (e.g. --limit=3, or blank for all)'
        required: false
        type: string
        default: '--limit=3'
      upgrade_packages:
        description: 'Upgrade CopilotKit & AG-UI packages'
        required: false
        type: boolean
        default: false
      fail_on_doc_drift:
        description: 'Fail immediately if doc drift is detected'
        required: false
        type: boolean
        default: false

jobs:
  update-and-record:
    runs-on: ubuntu-latest
    timeout-minutes: 45

    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      OPENAI_CHAT_MODEL_ID: ${{ vars.OPENAI_CHAT_MODEL_ID || 'gpt-4o-mini' }}

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup uv
        uses: astral-sh/setup-uv@v5
        with:
          enable-cache: true

      - name: Setup Python
        run: uv python install 3.12

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
          cache-dependency-path: |
            frontend/package-lock.json
            autorecorder/package-lock.json

      - name: Install Playwright & Chromium
        run: |
          cd autorecorder
          npm install
          npx playwright install --with-deps chromium

      - name: Run Automation Pipeline
        run: |
          RECORD_ARGS="${{ inputs.record_args }}"
          if [ -z "$RECORD_ARGS" ]; then
            RECORD_ARGS="--limit=3"
          fi

          EXTRA_FLAGS=""
          if [ "${{ inputs.upgrade_packages }}" = "true" ]; then
            EXTRA_FLAGS="$EXTRA_FLAGS --upgrade"
          fi
          if [ "${{ inputs.fail_on_doc_drift }}" != "true" ]; then
            EXTRA_FLAGS="$EXTRA_FLAGS --ignore-doc-drift"
          fi

          xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24" node scripts/automate.mjs $EXTRA_FLAGS $RECORD_ARGS

      - name: Upload Recorded Video Artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: demo-recordings-${{ github.sha }}
          path: autorecorder/videos/*.webm
          if-no-files-found: ignore
          retention-days: 14
```

---

## 4. GitHub Configuration

1. Go to **Settings** $\rightarrow$ **Secrets and variables** $\rightarrow$ **Actions**.
2. Add Repository Secret:
   - `OPENAI_API_KEY`: Your OpenAI API key (`sk-...`).
3. *(Optional)* If using Azure OpenAI:
   - `AZURE_OPENAI_ENDPOINT` & `AZURE_OPENAI_API_KEY`.

---

## 5. Critical Gotchas & Rules

| Gotcha | Problem | Solution |
|---|---|---|
| **Headless Linux Display** | Playwright headed mode crashes on Ubuntu runner with `Missing X server or $DISPLAY`. | Wrap execution with `xvfb-run --auto-servernum --server-args="-screen 0 1920x1080x24"`. |
| **Process Reaper** | Background servers started in separate YAML steps die immediately. | Run all services and tests within `node scripts/automate.mjs`. |
| **Auth Tokens** | Setting `AUTH_BEARER_TOKEN` without matching frontend token causes all chats to fail with 401. | Leave `AUTH_BEARER_TOKEN` unset by default unless explicitly testing auth. |
| **DOM CSS Selectors** | Non-standard selectors (e.g. `button:has-text(...)`) fail native `document.querySelector`. | Use standard CSS in `selectors.config.ts` (e.g. `[data-testid="..."], button[type="submit"]`). |
| **Hash Drift Normalization** | CRLF (`\r\n`) vs LF (`\n`) creates false positive doc drift on Windows vs Linux. | Strip BOM and normalize line endings before hashing. |
