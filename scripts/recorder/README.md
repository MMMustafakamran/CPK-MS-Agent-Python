# Screen Recording Automation Suite

Automated Playwright test and recording engine for **Next.js 16 (React 19)** and **Microsoft Agent Framework (Python)**.

## Directory Structure

```
scripts/
├── record-all-pages.ts        # CLI entrypoint
└── recorder/
    ├── README.md              # Documentation
    ├── types.ts               # Interface definitions
    ├── config.ts              # Page configurations and line ranges for all 17 routes
    ├── engine.ts              # Playwright browser lifecycle and recording runner
    ├── overlays/
    │   ├── taskbar.ts         # Windows 11 taskbar simulation
    │   ├── cursor.ts          # Virtual mouse cursor physics and Bézier animations
    │   └── notepad.ts         # Slide-up Notepad developer notes
    └── actions/
        ├── prebuilt.action.ts
        ├── slots.action.ts
        ├── headless-ui.action.ts
        ├── programmatic.action.ts
        ├── inspector.action.ts
        ├── interactive.action.ts
        ├── frontend-tools.action.ts
        ├── shared-state.action.ts
        ├── runtime-agui.action.ts
        └── index.ts           # Action dispatcher
```

## Workflow

1. **Documentation View**: Opens the official CopilotKit documentation URL (`https://docs.copilotkit.ai/ms-agent-python/...`), smoothly scrolls through content, and glides over reference code.
2. **Monaco IDE View**: Navigates to `/ide` with full-screen VS Code IDE (`vs-dark`), loads source code, scrolls to line range (`startLine` to `endLine`), and highlights the snippet.
3. **Live Demonstration**: Navigates to the route's clean demo (`http://localhost:3000/<route>/demo-chat`), injects Windows 11 Taskbar + Virtual Mouse cursor, triggers human-cadence interactions (chat typing, tool rendering, interactive approval gates, or state switches).
4. **Video Export**: Saves WebM recordings to `recordings/<page_id>.webm`.

## Usage

### 1. Ensure services are running:

- **Terminal 1 — Python Backend (port 8000):**
  ```bash
  cd backend
  uv run --prerelease=allow main.py
  ```

- **Terminal 2 — Next.js Frontend (port 3000):**
  ```bash
  cd frontend
  npm run dev
  ```

### 2. Run recordings:

From the `frontend` directory:

```bash
# Record a single page (e.g. quickstart)
npm run record -- --page=quickstart

# Record any of the 17 pages:
# quickstart, prebuilt-components, slots, headless-ui, programmatic-control,
# inspector, display-only, interactive, tool-rendering, state-rendering,
# frontend-tools, in-app-agent-read, in-app-agent-write, agent-app-context,
# auth, copilot-runtime, ag-ui
npm run record -- --page=interactive

# Record all 17 configured pages sequentially
npm run record
```

## Configured Pages (17 Total)

| Page ID | Route Demo | Target Source File |
|---|---|---|
| `quickstart` | `/quickstart/demo-chat` | `frontend/src/app/quickstart/demo-chat/page.tsx` |
| `prebuilt-components` | `/prebuilt-components/demo-chat` | `frontend/src/app/prebuilt-components/demo-chat/page.tsx` |
| `slots` | `/custom-look-and-feel/slots/demo-chat` | `frontend/src/app/custom-look-and-feel/slots/demo-chat/page.tsx` |
| `headless-ui` | `/custom-look-and-feel/headless-ui/demo-chat` | `frontend/src/app/custom-look-and-feel/headless-ui/demo-chat/page.tsx` |
| `programmatic-control` | `/programmatic-control/demo-chat` | `frontend/src/app/programmatic-control/demo-chat/page.tsx` |
| `inspector` | `/inspector/demo-chat` | `frontend/src/app/inspector/demo-chat/page.tsx` |
| `display-only` | `/generative-ui/your-components/display-only/demo-chat` | `frontend/src/app/generative-ui/your-components/display-only/demo-chat/page.tsx` |
| `interactive` | `/generative-ui/your-components/interactive/demo-chat` | `frontend/src/app/generative-ui/your-components/interactive/demo-chat/page.tsx` |
| `tool-rendering` | `/generative-ui/tool-rendering/demo-chat` | `frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx` |
| `state-rendering` | `/generative-ui/state-rendering/demo-chat` | `frontend/src/app/generative-ui/state-rendering/demo-chat/page.tsx` |
| `frontend-tools` | `/frontend-tools/demo-chat` | `frontend/src/app/frontend-tools/demo-chat/page.tsx` |
| `in-app-agent-read` | `/shared-state/in-app-agent-read/demo-chat` | `frontend/src/app/shared-state/in-app-agent-read/demo-chat/page.tsx` |
| `in-app-agent-write` | `/shared-state/in-app-agent-write/demo-chat` | `frontend/src/app/shared-state/in-app-agent-write/demo-chat/page.tsx` |
| `agent-app-context` | `/agent-app-context/demo-chat` | `frontend/src/app/agent-app-context/demo-chat/page.tsx` |
| `auth` | `/auth/demo-chat` | `frontend/src/app/auth/demo-chat/auth-demo-chat.tsx` |
| `copilot-runtime` | `/copilot-runtime/demo-chat` | `frontend/src/app/copilot-runtime/demo-chat/page.tsx` |
| `ag-ui` | `/ag-ui/demo-chat` | `frontend/src/app/ag-ui/demo-chat/page.tsx` |
