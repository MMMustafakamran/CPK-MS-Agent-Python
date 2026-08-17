# Screen Recording Automation Suite

Automated Playwright test and recording engine for **Next.js 16 (React 19)** and **CopilotKit + Microsoft Agent Framework (Python)**.

## Directory Structure

```
autorecord/
├── record-all-pages.ts        # CLI entrypoint & batch runner with summary report
├── README.md                  # Comprehensive root guide
├── PORTING_GUIDE.md           # Guide for porting to other agent framework projects
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript compilation configuration
├── videos/                    # Output directory for exported WebM videos
└── recorder/
    ├── README.md              # Architecture reference (this file)
    ├── types.ts               # Interface definitions
    ├── config.ts              # Page configurations and line ranges for all 17 routes
    ├── engine.ts              # Playwright browser lifecycle, taskbar transitions & coordinator
    ├── diagnostics.ts         # Pre-flight service checks & automated error diagnosis
    ├── ide/
    │   └── generator.ts       # Standalone pure HTML/CSS VS Code Dark+ simulator
    ├── overlays/
    │   ├── taskbar.ts         # Windows 11 taskbar simulation & app switching
    │   ├── cursor.ts          # Virtual mouse cursor physics and Bézier animations
    │   ├── nextjs-error.ts    # Next.js error badge auto-detector, click & modal expander
    │   └── notepad.ts         # Slide-up Notepad developer notes
    └── actions/
        ├── prebuilt.action.ts       # Tab switching: CopilotChat -> CopilotSidebar -> CopilotPopup
        ├── slots.action.ts          # Slot customization: Level 1 -> Level 2 -> Level 3
        ├── headless-ui.action.ts    # Hand-built headless chat input & response detection
        ├── programmatic.action.ts   # Dark Mode state toggle & copilotkit.runAgent execution
        ├── inspector.action.ts      # Shadow DOM piercing & DevConsole inspection
        ├── display-only.action.ts   # WeatherCard generative UI rendering
        ├── hitl.action.ts           # Human-in-the-loop command approval gate
        ├── tool-rendering.action.ts # Named get_weather card + wildcard fallback
        ├── state-rendering.action.ts# Real-time searches state list streaming
        ├── frontend-tools.action.ts # sayHello client-side browser execution
        ├── shared-state.action.ts   # Language state read & toggle + re-run write
        ├── agent-app-context.action.ts # Colleagues readables context sharing
        ├── auth.action.ts           # Bearer token authentication status inspection
        ├── runtime.action.ts        # Multi-agent routing: my_agent vs sample_agent vs search_agent
        ├── ag-ui.action.ts          # Live AG-UI SSE protocol event log showcase
        └── index.ts                 # Action dispatcher & standard chat submission fallback
```

---

## 3-Step Demonstration Workflow

1. **Step 1 — Official Documentation View**:
   - Opens the official CopilotKit Microsoft Agent Framework doc URL (`https://docs.copilotkit.ai/ms-agent-python/...`).
   - Smoothly scrolls through content at human reading cadence and focuses cursor on the code block.
   - Glides cursor down to the simulated Windows 11 Taskbar and clicks the **VS Code** icon (illuminating its blue glow bar).

2. **Step 2 — Visual Studio Code IDE View**:
   - Renders a standalone VS Code dark theme interface (`vs-dark`) generated directly from project source files on disk via `autorecord/recorder/ide/generator.ts`.
   - Renders a clean Explorer sidebar with expanded route folders, file tabs, and exact line numbers.
   - Highlights the exact snippet lines (`startLine` to `endLine`) in the project source file and smoothly glides cursor down the code.
   - Glides cursor down to the Taskbar and clicks the **Chrome** icon (illuminating its blue glow bar).

3. **Step 3 — Live Interactive Demonstration**:
   - Navigates directly to the isolated demo endpoint (`http://localhost:3000/<route>/demo-chat`).
   - Injects the simulated Windows 11 Taskbar + Virtual Mouse cursor.
   - Types tailored prompts with natural keystroke timing and executes interactions (e.g. prebuilt tabs switching, Dark Mode state toggles, HITL approval gate, live AG-UI stream monitoring, shared state updates).

4. **Video Export**:
   - Clean runs saved to `autorecord/videos/MSAgentReact-<FeatureName>.webm` (`✅ [PASS]`).

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
npm run record -- --page=state-rendering
npm run record -- --page=in-app-agent-read

# Record all 17 configured pages sequentially
npm run record
```
