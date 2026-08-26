# Dev Terminals & Step-by-Step Runners

This folder contains modular Windows batch scripts (`.bat`) designed to open dedicated, visible command prompt terminals for each phase of development and testing.

## Files Overview

| Script | Purpose | Description |
|---|---|---|
| **`run-all-step-by-step.bat`** | **Master Orchestrator** | Interactive menu to launch terminals step-by-step or start servers simultaneously. |
| **`01-check-doc-drift.bat`** | **Doc Drift Check & Sync** | Runs `scripts/check-doc-drift.mjs` against `doc-snapshot/` with options to check only or automatically update `.md` files. |
| **`01b-sync-doc-snapshot.bat`** | **Direct Doc Snapshot Sync** | Fetches live upstream documentation from docs.copilotkit.ai and updates local `doc-snapshot/pages/*.md` and `doc-snapshot/manifest.json`. |
| **`02-update-dependencies.bat`** | **Update Packages** | Runs `uv sync --prerelease=allow` for backend, and `npm install` for frontend & autorecorder (keeping peer-dependent packages safe). |
| **`03-run-backend.bat`** | **Backend Server** | Runs Python FastAPI agent on port `8000` with `uv run --prerelease=allow main.py`. |
| **`04-run-frontend.bat`** | **Frontend Server** | Runs Next.js app on port `3000` with `npm run dev`. |
| **`05-run-autorecorder.bat`** | **Autorecorder** | Runs Playwright video recorder in `autorecorder/` with interactive options. |

## Quick Start

1. Double-click `run-terminals.bat` in the root folder, or run:
   ```cmd
   dev-terminals\run-all-step-by-step.bat
   ```
2. Choose **[A]** for the step-by-step guided mode where each terminal opens with a confirmation prompt.
3. Choose **[1B]** (or run `01b-sync-doc-snapshot.bat`) to update and sync local markdown snapshot files with live docs.
4. Choose **[S]** to quickly start both backend and frontend servers in separate windows.
5. Or run any individual script directly by double-clicking it.
