# Autorecording Suite — Project Porting & Integration Guide 🚀

This guide explains how to port and adapt this **3-step automated recording engine** (Official Doc $\rightarrow$ Standalone VS Code $\rightarrow$ Live Demo with interactive Taskbar, Human Cursor, Shadow DOM Piercing, Token Stream Completion Detection, and Error Auto-Capture) into any project.

---

## 🏗️ Architecture & Decoupling

The autorecord suite is designed around modular, plug-and-play layers:

```mermaid
graph TD
    A[record-all-pages.ts / CLI] --> B[recorder/engine.ts]
    B --> C[Step 1: Doc Scroller]
    B --> D[Step 2: Standalone VS Code IDE Simulator]
    B --> E[Step 3: Live Demo + Action Dispatcher]

    subgraph Fully Generic / Zero-Change Modules
        D
        F[overlays/taskbar.ts]
        G[overlays/cursor.ts]
        I[overlays/notepad.ts]
        J[ide/generator.ts]
    end

    subgraph Project-Specific Adaptation
        K[recorder/config.ts - Route Registry]
        L[recorder/actions/* - Page Interactions]
        M[recorder/diagnostics.ts - Health Checks]
    end

    B --> F
    B --> G
    E --> L
```

---

## 📦 Step 1: Copying Files & Installation

1. Copy the entire `autorecord/` directory into your new project's root folder:

   ```
   my-new-project/
   ├── backend/
   ├── frontend/
   └── autorecord/
   ```

2. Inside `autorecord/package.json`, verify required dependencies:

   ```json
   {
     "name": "autorecord",
     "version": "1.0.0",
     "scripts": {
       "record": "tsx record-all-pages.ts",
       "typecheck": "tsc --noEmit"
     },
     "dependencies": {
       "playwright": "^1.51.0"
     },
     "devDependencies": {
       "@types/node": "^20",
       "tsx": "^4.19.3",
       "typescript": "^5"
     }
   }
   ```

3. Install dependencies and Chromium browser binary:
   ```bash
   cd autorecord
   npm install
   npx playwright install chromium
   ```

---

## ⚙️ Step 2: Adapting to Your Backend & Ports

Different frameworks use different ports and health check endpoints.

### Update `recorder/diagnostics.ts` or Set Environment Variables

Modify the backend/frontend URL targets or provide `FRONTEND_URL` / `BACKEND_URL` in your environment:

```typescript
// autorecord/recorder/diagnostics.ts
const FRONTEND_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function checkServicesHealth(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    frontendOk: false,
    backendOk: false,
  };

  // Check Frontend
  try {
    const res = await fetch(`${FRONTEND_BASE_URL}/`, {
      signal: AbortSignal.timeout(3000),
    });
    result.frontendOk = res.ok || res.status < 500;
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    result.frontendError = errMessage || `Connection refused on ${FRONTEND_BASE_URL}`;
  }

  // Check Backend
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    result.backendOk = res.ok || res.status < 500;
  } catch (err: unknown) {
    result.backendError = `Connection refused on ${BACKEND_BASE_URL}`;
  }

  return result;
}
```

---

## 📋 Step 3: Registering Routes in `recorder/config.ts`

`recorder/config.ts` is the single source of truth for all recorded pages. Define each page with:

- `id`: Unique CLI identifier (used with `--page=<id>`).
- `name`: Clean feature title.
- `filename`: Exported video filename (e.g. `MSPY-react-01-Quickstart`).
- `docUrl`: Official documentation link for Step 1.
- `demoUrl`: Local demo URL for Step 3 (`http://localhost:3000/...`).
- `ideFile`: Target source code file to highlight in Step 2.
- `startLine` & `endLine`: Snippet line range highlighted in VS Code.
- `extraTabs`: *(Optional)* Array of extra file tabs to render and switch through in VS Code.
- `prompt`: User prompt typed in Step 3.
- `waitAfterPromptMs`: Reading pause duration after the response finishes streaming (e.g. `4000` standard, `1500` for multi-step sequences).

### Example Configuration:

```typescript
// autorecord/recorder/config.ts
export const PAGES: PageRecordConfig[] = [
  {
    id: 'quickstart',
    name: 'Quickstart',
    filename: 'MSPY-react-01-Quickstart',
    docUrl: 'https://docs.copilotkit.ai/ms-agent-python/quickstart?agent=bring-your-own',
    ideFile: 'frontend/package.json',
    startLine: 12,
    endLine: 22,
    extraTabs: [
      {
        filePath: 'frontend/src/app/quickstart/demo-chat/page.tsx',
        startLine: 28,
        endLine: 38,
      },
    ],
    demoUrl: 'http://localhost:3000/quickstart/demo-chat',
    prompt: 'Can you tell me a joke?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'interactive',
    name: 'Generative UI - Interactive Component',
    filename: 'MSPY-react-08-Interactive',
    docUrl: 'https://docs.copilotkit.ai/ms-agent-python/generative-ui/your-components/interactive',
    ideFile: 'frontend/src/app/generative-ui/your-components/interactive/demo-chat/page.tsx',
    startLine: 23,
    endLine: 64,
    demoUrl: 'http://localhost:3000/generative-ui/your-components/interactive/demo-chat',
    prompt: 'Run the command rm -rf /tmp/cache',
    waitAfterPromptMs: 4000,
  },
];
```

---

## ⚡ Step 4: Next.js Hydration & Dev-Server Compilation Resilience

In development mode (Next.js App Router / Turbopack / Webpack), pages compile chunks on demand upon first navigation. If an automated script types immediately, React hydration can re-render and swallow input.

The engine handles this with dark shield protection and explicit DOM readiness checks in [`recorder/engine.ts`](./recorder/engine.ts):

```typescript
// Step 3 Navigation in recorder/engine.ts
await page.evaluate(`
  (function() {
    document.body.style.backgroundColor = '#0f172a';
    document.body.style.transition = 'none';
  })()
`).catch(() => {});

await page.goto(config.demoUrl, {
  waitUntil: 'domcontentloaded',
  timeout: 45000,
});
await ensureOverlays(page, 'chrome');

// Wait for page body and chat element readiness
console.log(`   ⏳ Waiting for Next.js compilation & React hydration to settle...`);
await page.waitForSelector('body', { timeout: 10000 }).catch(() => {});
await page.waitForSelector(
  'textarea, input[type="text"], input, [contenteditable="true"], .copilotKitChat, [class*="copilotKit"]',
  { state: 'visible', timeout: 15000 },
).catch(() => {});
await sleep(1000);
```

---

## 🎯 Step 5: Active Token Stream Stability & Response Completion Detection

Rather than relying on static timers or brittle spinner selectors, use text stability polling with `waitForAgentResponseCompletion`:

```typescript
export async function waitForAgentResponseCompletion(
  page: Page,
  postWaitMs = 4000,
): Promise<void> {
  console.log(`   ⏳ Actively detecting AI agent response start & streaming progress...`);

  // 1. Wait until assistant message starts receiving content
  let hasStarted = false;
  const startTime = Date.now();
  while (Date.now() - startTime < 30000) {
    const text = await page.evaluate(() => {
      const msgs = document.querySelectorAll(
        '.copilotKitAssistantMessage, [data-message-role="assistant"], .copilotKitMessage:not(:first-child), [class*="assistant"]'
      );
      if (msgs.length === 0) return '';
      const lastMsg = msgs[msgs.length - 1];
      return (lastMsg.textContent || '').trim();
    }).catch(() => '');

    if (text.length > 2) {
      hasStarted = true;
      break;
    }
    await sleep(300);
  }

  // 2. Poll until text length stabilizes (streaming tokens finished)
  if (hasStarted) {
    console.log(`   🌊 AI agent is streaming response tokens...`);
    let previousText = '';
    let stableCount = 0;
    const streamStart = Date.now();

    while (Date.now() - streamStart < 45000) {
      const currentText = await page.evaluate(() => {
        const msgs = document.querySelectorAll(
          '.copilotKitAssistantMessage, [data-message-role="assistant"], .copilotKitMessage:not(:first-child), [class*="assistant"]'
        );
        if (msgs.length === 0) return '';
        const lastMsg = msgs[msgs.length - 1];
        return (lastMsg.textContent || '').trim();
      }).catch(() => '');

      if (currentText.length > 0 && currentText === previousText) {
        stableCount++;
        if (stableCount >= 4) {
          console.log(`   ✅ AI agent response completed (${currentText.length} characters).`);
          break;
        }
      } else {
        stableCount = 0;
        previousText = currentText;
      }
      await sleep(400);
    }
  }

  // 3. Glide cursor smoothly over the completed assistant response
  const assistantLocator = page.locator(
    '.copilotKitAssistantMessage, [data-message-role="assistant"], .copilotKitMessage:not(:first-child)'
  ).last();

  if (await assistantLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
    const abBox = await assistantLocator.boundingBox();
    if (abBox) {
      await humanGlide(page, abBox.x + Math.min(abBox.width / 2, 220), abBox.y + Math.min(abBox.height / 2, 60), 25);
    }
  }

  // 4. Comfortable post-response reading pause
  console.log(`   📖 Reading completed response (pausing ${postWaitMs / 1000}s)...`);
  await sleep(postWaitMs);
}
```

---

## 🔍 Step 6: Piercing Shadow DOM Web Components (e.g. CopilotKit Inspector)

Modern overlays like `@copilotkit/web-inspector` mount inside `#shadow-root (open)`. Standard DOM queries will not pierce shadow roots without direct traversal.

Use `page.evaluate()` to query inside all active shadow roots:

```typescript
// Finding elements inside shadow DOM:
const targetPos = await page.evaluate(() => {
  for (const el of Array.from(document.querySelectorAll('*'))) {
    if (el.shadowRoot) {
      const target = Array.from(el.shadowRoot.querySelectorAll('button, a, [role="tab"], div, span')).find(
        (e) => (e.textContent || '').trim().toLowerCase() === 'agents'
      ) as HTMLElement;
      if (target) {
        target.click();
        const r = target.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
  }
  return null;
});

if (targetPos) {
  await humanGlide(page, targetPos.x, targetPos.y, 20);
  await humanClick(page);
}
```

---

## 📝 Step 7: Slide-up Notepad Notes for Architecture & Stubs

For features requiring architectural notes, database requirement explanations, or stub pages, use [`showNotepadNote`](./recorder/overlays/notepad.ts):

```typescript
import { showNotepadNote } from '../overlays/notepad';

await showNotepadNote(page, 'architecture_notice.txt', [
  'Note: Multi-agent routing requires AG-UI protocol endpoints active on :8000',
]);
```

This slides up an authentic Windows 11 Notepad window, clicks into the document, and simulates developer typing keystrokes with natural human jitter.

---

## 🚀 Running Your Suite

```bash
cd autorecord

# Inspect all registered pages and file mappings without running
npm run record -- --list

# Record an individual feature
npm run record -- --page=quickstart
npm run record -- --page=interactive

# Record a subset of matching pages
npm run record -- --filter=generative-ui
npm run record -- --filter=shared-state

# Record all registered routes in batch
npm run record
```

All recorded videos are saved to `autorecord/videos/` as **1080p, 60fps WebM** files with the configured filename (e.g. `MSPY-react-*.webm`). Execution elapsed duration per page is reported in the final summary.

---

## 📋 5-Minute Porting Checklist

- [ ] Copied `autorecord/` into project root.
- [ ] Ran `npm install` and `npx playwright install chromium` inside `autorecord/`.
- [ ] Verified frontend (`:3000`) and backend (`:8000`) ports in `recorder/diagnostics.ts`.
- [ ] Registered project routes, files, and line numbers in `recorder/config.ts`.
- [ ] Set `filename: 'MSPY-react-<FeatureName>'` for all target pages.
- [ ] Created action handlers in `recorder/actions/` using `waitForAgentResponseCompletion`.
- [ ] Tested single page recording: `npm run record -- --page=<page_id>`.
