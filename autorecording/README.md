# Automated Screen Recording Suite

All automated screen recording assets, engine scripts, action handlers, and generated video artifacts for **CPK-MS-Agent-Python** are consolidated in this directory.

---

## Directory Structure

```
autorecording/
├── README.md                  # Master documentation
├── record-all-pages.ts        # CLI runner entrypoint
├── recorder/                  # Playwright automation engine
│   ├── README.md              # Engine architecture & configuration guide
│   ├── config.ts              # 17 route configs (doc URLs, file paths, line ranges, demo prompts)
│   ├── engine.ts              # Playwright browser runner & video recording pipeline
│   ├── types.ts               # TypeScript interfaces
│   ├── overlays/              # Visual enhancements
│   │   ├── taskbar.ts         # Windows 11 simulated desktop taskbar & live clock
│   │   ├── cursor.ts          # Authentic Bézier virtual mouse physics & click animations
│   │   └── notepad.ts         # Developer notes overlay
│   └── actions/               # Route-specific interaction handlers
│       ├── prebuilt.action.ts
│       ├── slots.action.ts
│       ├── headless-ui.action.ts
│       ├── programmatic.action.ts
│       ├── inspector.action.ts
│       ├── interactive.action.ts
│       ├── frontend-tools.action.ts
│       ├── shared-state.action.ts
│       ├── runtime-agui.action.ts
│       └── index.ts           # Central action dispatcher
└── recordings/                # Output WebM video recordings (1080p, 60fps)
    ├── README.md              # Catalog of recorded videos
    └── *.webm                 # Generated demonstration videos (17 total)
```

---

## 3-Step Video Demonstration Workflow

Each recorded feature video follows a realistic developer demonstration flow:

1. **Step 1 — Official Documentation View**:
   - Opens the official CopilotKit documentation page (`https://docs.copilotkit.ai/ms-agent-python/...`).
   - Smoothly scrolls down the page at human reading cadence and focuses on the code block.

2. **Step 2 — Visual Studio Code IDE Code View**:
   - Navigates to `/ide` (dedicated VS Code dark theme interface).
   - Renders a clean Explorer sidebar with expanded route folders, file tabs, and exact line numbers.
   - Highlights the exact snippet lines (`startLine` to `endLine`) in the project source file and smoothly glides cursor down the code.

3. **Step 3 — Live Interactive Demonstration**:
   - Navigates directly to the isolated demo endpoint (`http://localhost:3000/.../demo-chat`).
   - Injects the simulated Windows 11 Taskbar + Virtual Mouse cursor.
   - Types tailored prompts with natural keystroke timing and executes interactions (e.g. Human-in-the-loop approval gate clicks, theme toggles, multi-agent switching).
   - Captures live streaming AI responses from the backend.

4. **Video Export**:
   - WebM video is saved directly into `autorecording/recordings/<page_id>.webm`.

---

## Usage

### 1. Ensure servers are running:

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

From the workspace root or `frontend` directory:

```bash
# Record an individual page
npm run record -- --page=quickstart
npm run record -- --page=interactive
npm run record -- --page=ag-ui

# Record all 17 pages sequentially
npm run record
```

---

## Configured Pages (17 Total)

| Page ID | Route Demo | Target Source File | Highlighted Lines | Output Artifact |
|---|---|---|---|---|
| `quickstart` | `/quickstart/demo-chat` | `frontend/.../quickstart/demo-chat/page.tsx` | 28–38 | `recordings/quickstart.webm` |
| `prebuilt-components` | `/prebuilt-components/demo-chat` | `frontend/.../prebuilt-components/demo-chat/page.tsx` | 59–103 | `recordings/prebuilt-components.webm` |
| `slots` | `/custom-look-and-feel/slots/demo-chat` | `frontend/.../slots/demo-chat/page.tsx` | 67–116 | `recordings/slots.webm` |
| `headless-ui` | `/custom-look-and-feel/headless-ui/demo-chat` | `frontend/.../headless-ui/demo-chat/page.tsx` | 28–80 | `recordings/headless-ui.webm` |
| `programmatic-control` | `/programmatic-control/demo-chat` | `frontend/.../programmatic-control/demo-chat/page.tsx` | 28–100 | `recordings/programmatic-control.webm` |
| `inspector` | `/inspector/demo-chat` | `frontend/.../inspector/demo-chat/page.tsx` | 8–30 | `recordings/inspector.webm` |
| `display-only` | `/generative-ui/your-components/display-only/demo-chat` | `frontend/.../display-only/demo-chat/page.tsx` | 43–71 | `recordings/display-only.webm` |
| `interactive` | `/generative-ui/your-components/interactive/demo-chat` | `frontend/.../interactive/demo-chat/page.tsx` | 23–65 | `recordings/interactive.webm` |
| `tool-rendering` | `/generative-ui/tool-rendering/demo-chat` | `frontend/.../tool-rendering/demo-chat/page.tsx` | 24–63 | `recordings/tool-rendering.webm` |
| `state-rendering` | `/generative-ui/state-rendering/demo-chat` | `frontend/.../state-rendering/demo-chat/page.tsx` | 28–75 | `recordings/state-rendering.webm` |
| `frontend-tools` | `/frontend-tools/demo-chat` | `frontend/.../frontend-tools/demo-chat/page.tsx` | 20–47 | `recordings/frontend-tools.webm` |
| `in-app-agent-read` | `/shared-state/in-app-agent-read/demo-chat` | `frontend/.../in-app-agent-read/demo-chat/page.tsx` | 24–68 | `recordings/in-app-agent-read.webm` |
| `in-app-agent-write` | `/shared-state/in-app-agent-write/demo-chat` | `frontend/.../in-app-agent-write/demo-chat/page.tsx` | 30–70 | `recordings/in-app-agent-write.webm` |
| `agent-app-context` | `/agent-app-context/demo-chat` | `frontend/.../agent-app-context/demo-chat/page.tsx` | 18–62 | `recordings/agent-app-context.webm` |
| `auth` | `/auth/demo-chat` | `frontend/.../auth/demo-chat/auth-demo-chat.tsx` | 20–65 | `recordings/auth.webm` |
| `copilot-runtime` | `/copilot-runtime/demo-chat` | `frontend/.../copilot-runtime/demo-chat/page.tsx` | 16–57 | `recordings/copilot-runtime.webm` |
| `ag-ui` | `/ag-ui/demo-chat` | `frontend/.../ag-ui/demo-chat/page.tsx` | 70–102 | `recordings/ag-ui.webm` |
