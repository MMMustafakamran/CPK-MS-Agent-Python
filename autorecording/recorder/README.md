# Screen Recording Automation Suite

Automated Playwright test and recording engine for **Next.js 16 (React 19)** and **Microsoft Agent Framework (Python)**.

## Directory Structure

```
scripts/
├── record-all-pages.ts        # CLI entrypoint
├── README.md                  # Scripts directory overview
└── recorder/
    ├── README.md              # Recording suite architecture documentation
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
        └── index.ts           # Action dispatcher & standard chat submission fallback
```

---

## 3-Step Demonstration Workflow

1. **Step 1 — Official Documentation View**:
   - Opens the official CopilotKit documentation URL (`https://docs.copilotkit.ai/ms-agent-python/...`).
   - Smoothly scrolls through content at human reading cadence and focuses cursor on the code block.

2. **Step 2 — Visual Studio Code IDE View**:
   - Navigates to `/ide` with a dedicated VS Code dark theme interface (`vs-dark`).
   - Renders a clean Explorer sidebar with expanded route folders, file tabs, and exact line numbers.
   - Highlights the exact snippet lines (`startLine` to `endLine`) in the project source file and smoothly glides cursor down the code.

3. **Step 3 — Live Interactive Demonstration**:
   - Navigates directly to the isolated demo endpoint (`http://localhost:3000/<route>/demo-chat`).
   - Injects the simulated Windows 11 Taskbar + Virtual Mouse cursor.
   - Types tailored prompts with natural keystroke timing and executes interactions (e.g. Human-in-the-loop approval gate clicks, theme toggles, multi-agent switching).
   - Captures live streaming AI responses from the backend.

4. **Video Export**:
   - Saves WebM recordings directly to `recordings/<page_id>.webm` (1080p, 60fps).

---

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

```bash
# Record an individual page
npm run record -- --page=quickstart
npm run record -- --page=interactive
npm run record -- --page=ag-ui

# Record all 17 configured pages sequentially
npm run record
```

---

## Configured Pages (17 Total)

| Page ID | Route Demo | Target Source File | Highlighted Lines |
|---|---|---|---|
| `quickstart` | `/quickstart/demo-chat` | `frontend/src/app/quickstart/demo-chat/page.tsx` | 28–38 |
| `prebuilt-components` | `/prebuilt-components/demo-chat` | `frontend/src/app/prebuilt-components/demo-chat/page.tsx` | 59–103 |
| `slots` | `/custom-look-and-feel/slots/demo-chat` | `frontend/src/app/custom-look-and-feel/slots/demo-chat/page.tsx` | 67–116 |
| `headless-ui` | `/custom-look-and-feel/headless-ui/demo-chat` | `frontend/src/app/custom-look-and-feel/headless-ui/demo-chat/page.tsx` | 28–80 |
| `programmatic-control` | `/programmatic-control/demo-chat` | `frontend/src/app/programmatic-control/demo-chat/page.tsx` | 28–100 |
| `inspector` | `/inspector/demo-chat` | `frontend/src/app/inspector/demo-chat/page.tsx` | 8–30 |
| `display-only` | `/generative-ui/your-components/display-only/demo-chat` | `frontend/src/app/generative-ui/your-components/display-only/demo-chat/page.tsx` | 43–71 |
| `interactive` | `/generative-ui/your-components/interactive/demo-chat` | `frontend/src/app/generative-ui/your-components/interactive/demo-chat/page.tsx` | 23–65 |
| `tool-rendering` | `/generative-ui/tool-rendering/demo-chat` | `frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx` | 24–63 |
| `state-rendering` | `/generative-ui/state-rendering/demo-chat` | `frontend/src/app/generative-ui/state-rendering/demo-chat/page.tsx` | 28–75 |
| `frontend-tools` | `/frontend-tools/demo-chat` | `frontend/src/app/frontend-tools/demo-chat/page.tsx` | 20–47 |
| `in-app-agent-read` | `/shared-state/in-app-agent-read/demo-chat` | `frontend/src/app/shared-state/in-app-agent-read/demo-chat/page.tsx` | 24–68 |
| `in-app-agent-write` | `/shared-state/in-app-agent-write/demo-chat` | `frontend/src/app/shared-state/in-app-agent-write/demo-chat/page.tsx` | 30–70 |
| `agent-app-context` | `/agent-app-context/demo-chat` | `frontend/src/app/agent-app-context/demo-chat/page.tsx` | 18–62 |
| `auth` | `/auth/demo-chat` | `frontend/src/app/auth/demo-chat/auth-demo-chat.tsx` | 20–65 |
| `copilot-runtime` | `/copilot-runtime/demo-chat` | `frontend/src/app/copilot-runtime/demo-chat/page.tsx` | 16–57 |
| `ag-ui` | `/ag-ui/demo-chat` | `frontend/src/app/ag-ui/demo-chat/page.tsx` | 70–102 |
