# Screen Recordings Collection

This directory contains automated demonstration videos for all 17 documented features of **CPK-MS-Agent-Python** (Next.js 16 + Microsoft Agent Framework Python).

## Video Format & Specifications

- **Format**: WebM (`VP8` / `VP9` video, 1920x1080 Full HD, 60fps)
- **Audio**: Muted / Clean simulation
- **Overlays Included**:
  - Windows 11 simulated desktop taskbar with live system clock & active app indicators
  - Authentic virtual mouse physics with multi-phase Bézier curvature, overshoot, and click depression animations
  - Full-screen Visual Studio Code IDE theme (`vs-dark`) with project file tree and snippet line highlights

---

## 3-Step Video Pipeline

Every recording captures the complete developer demonstration workflow:

1. **Step 1 — Official Documentation View**:
   - Opens the official CopilotKit documentation page (`https://docs.copilotkit.ai/ms-agent-python/...`)
   - Natural human reading cadence and cursor gliding over reference code snippets.

2. **Step 2 — Visual Studio Code IDE Code View**:
   - Displays the clean VS Code IDE view (`http://localhost:3000/ide?file=...`)
   - Expands the relevant folder structure in the Explorer sidebar
   - Highlights the exact code snippet lines in the project source file
   - Cursor smoothly traces the snippet boundaries.

3. **Step 3 — Live Interactive Demo**:
   - Navigates directly to the route's clean demo endpoint (`http://localhost:3000/.../demo-chat`)
   - Types tailored prompts with natural keystroke timing
   - Executes interactions (e.g., Human-in-the-Loop decision approval buttons, theme toggles, multi-agent switching)
   - Captures live streaming AI responses from the Microsoft Agent Framework Python backend.

---

## Catalog of Recorded Videos (17 Total)

| # | Video File | Route Tested | Feature Demonstrated |
|---|---|---|---|
| 1 | `quickstart.webm` | `/quickstart/demo-chat` | CopilotSidebar initialization & streaming response |
| 2 | `prebuilt-components.webm` | `/prebuilt-components/demo-chat` | Cycling across `CopilotChat`, `CopilotSidebar`, and `CopilotPopup` |
| 3 | `slots.webm` | `/custom-look-and-feel/slots/demo-chat` | Demonstrating Level 1, Level 2, and Level 3 slot overrides |
| 4 | `headless-ui.webm` | `/custom-look-and-feel/headless-ui/demo-chat` | Custom headless input form & custom message bubbles |
| 5 | `programmatic-control.webm` | `/programmatic-control/demo-chat` | Dark Mode state toggle & programmatic `copilotkit.runAgent()` |
| 6 | `inspector.webm` | `/inspector/demo-chat` | Inspector debugging console overlay |
| 7 | `display-only.webm` | `/generative-ui/your-components/display-only/demo-chat` | Inline generative UI component (`WeatherCard`) rendering |
| 8 | `interactive.webm` | `/generative-ui/your-components/interactive/demo-chat` | Human-in-the-loop (HITL) approval gate button click |
| 9 | `tool-rendering.webm` | `/generative-ui/tool-rendering/demo-chat` | Named `get_weather` tool execution with custom renderer |
| 10 | `state-rendering.webm` | `/generative-ui/state-rendering/demo-chat` | `search_agent` searches checklist & live state streaming |
| 11 | `frontend-tools.webm` | `/frontend-tools/demo-chat` | Client-side frontend tool execution with browser alert |
| 12 | `in-app-agent-read.webm` | `/shared-state/in-app-agent-read/demo-chat` | In-app reading of synchronized `agent.state.language` |
| 13 | `in-app-agent-write.webm` | `/shared-state/in-app-agent-write/demo-chat` | In-app writing of state with "Toggle + re-run agent" |
| 14 | `agent-app-context.webm` | `/agent-app-context/demo-chat` | `useAgentContext` readable context retrieval |
| 15 | `auth.webm` | `/auth/demo-chat` | Bearer token authentication middleware validation |
| 16 | `copilot-runtime.webm` | `/copilot-runtime/demo-chat` | Multi-agent routing between `my_agent` and `sample_agent` |
| 17 | `ag-ui.webm` | `/ag-ui/demo-chat` | Live AG-UI protocol SSE stream event capture |

---

## How to Re-Record

### 1. Ensure servers are running:
- **Python Backend (port 8000)**:
  ```bash
  cd backend
  uv run --prerelease=allow main.py
  ```
- **Next.js Frontend (port 3000)**:
  ```bash
  cd frontend
  npm run dev
  ```

### 2. Run the recording command:
```bash
# Record an individual page
npm run record -- --page=quickstart
npm run record -- --page=interactive
npm run record -- --page=ag-ui

# Record all 17 pages sequentially
npm run record
```
