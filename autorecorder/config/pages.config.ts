/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 3 of 3
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * One entry per doc page, in the order the doc nav lists them.
 *
 * Entries are deliberately short. `docUrl`, `demoUrl` and the output filename
 * are derived from `project.config.ts` plus the fields below, so no entry can
 * point at the wrong framework's docs and filenames stay in nav order without
 * anyone numbering them by hand.
 *
 * Adapting means: delete the pages this framework does not document, add the
 * ones it does, and fix the line ranges. `npm run doctor` then tells you which
 * ranges no longer point at real code.
 *
 * ── The line ranges ────────────────────────────────────────────────────────
 * `startLine`/`endLine` are what the simulated IDE highlights. They are
 * hardcoded, which means they drift the moment someone edits a demo page.
 * Doctor guards this: where a file carries `[!code highlight]` or `#region`
 * markers, it checks the range still covers one and names the marker's current
 * line when it does not. Keep those markers in the frontend and the guard keeps
 * working.
 */

import { definePages } from '../core/types';

export const PAGES = definePages([
  {
    id: 'quickstart',
    name: 'Quickstart',
    videoName: 'Quickstart',
    docPath: 'quickstart?agent=bring-your-own',
    route: 'quickstart',
    // Leads with the versions, not the manifest. package.json declares
    // RANGES, so this clip used to show a floor while the run it
    // documented had installed something newer. VERSIONS.md is generated
    // after install (ci/write-versions.mjs) and names what resolved.
    // package.json stays as the first tab: the range is still what a
    // reader would write in their own project.
    ideFile: 'frontend/VERSIONS.md',
    startLine: 6,
    endLine: 24,
    extraTabs: [
      {
        filePath: 'frontend/package.json',
        startLine: 12,
        endLine: 22,
      },
      {
        filePath: 'frontend/src/app/quickstart/demo-chat/page.tsx',
        startLine: 28,
        endLine: 38,
      },
    ],
    prompt: 'Can you tell me a joke?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'prebuilt-components',
    name: 'Prebuilt Components',
    videoName: 'PrebuiltComponents',
    docPath: 'prebuilt-components',
    route: 'prebuilt-components',
    ideFile: 'frontend/src/app/prebuilt-components/demo-chat/page.tsx',
    startLine: 58,
    endLine: 104,
    prompt: 'What is CopilotKit?',
    prompts: ['What is CopilotKit?'],
    waitAfterPromptMs: 1500,
  },
  {
    id: 'slots',
    name: 'Custom Look and Feel - Slots',
    videoName: 'Slots',
    docPath: 'custom-look-and-feel/slots',
    route: 'custom-look-and-feel/slots',
    ideFile: 'frontend/src/app/custom-look-and-feel/slots/demo-chat/page.tsx',
    startLine: 66,
    endLine: 116,
    prompt: 'Hello from customized slots level 1!',
    prompts: [
      'Hello from customized slots level 1!',
      'Hello from slot level 2 props override!',
      'Hello from slot level 3 custom component!',
    ],
    waitAfterPromptMs: 1500,
  },
  {
    id: 'headless-ui',
    name: 'Custom Look and Feel - Headless UI',
    videoName: 'HeadlessUI',
    docPath: 'custom-look-and-feel/headless-ui',
    route: 'custom-look-and-feel/headless-ui',
    ideFile: 'frontend/src/app/custom-look-and-feel/headless-ui/demo-chat/page.tsx',
    startLine: 28,
    endLine: 78,
    prompt: 'Tell me a joke',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'programmatic-control',
    name: 'Custom Look and Feel - Programmatic Control',
    videoName: 'ProgrammaticControl',
    docPath: 'programmatic-control',
    route: 'programmatic-control',
    ideFile: 'frontend/src/app/programmatic-control/demo-chat/page.tsx',
    startLine: 28,
    endLine: 102,
    prompt: "What's the weather in Tokyo?",
    waitAfterPromptMs: 1500,
  },
  {
    id: 'inspector',
    name: 'Custom Look and Feel - Inspector',
    videoName: 'Inspector',
    docPath: 'inspector',
    route: 'inspector',
    ideFile: 'frontend/src/components/providers.tsx',
    startLine: 30,
    endLine: 47,
    prompt: 'Hello agent! Testing inspector.',
    waitAfterPromptMs: 1500,
  },
  {
    id: 'display-only',
    name: 'Generative UI - Display Only Component',
    videoName: 'DisplayOnly',
    docPath: 'generative-ui/your-components/display-only',
    route: 'generative-ui/your-components/display-only',
    ideFile:
      'frontend/src/app/generative-ui/your-components/display-only/demo-chat/page.tsx',
    startLine: 27,
    endLine: 55,
    prompt: 'Show the weather card for Tokyo: 77 degrees, clear',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'interactive',
    name: 'Generative UI - Interactive Component (Approval Gate)',
    videoName: 'Interactive',
    docPath: 'generative-ui/your-components/interactive',
    route: 'generative-ui/your-components/interactive',
    ideFile:
      'frontend/src/app/generative-ui/your-components/interactive/demo-chat/page.tsx',
    startLine: 23,
    endLine: 64,
    prompt: 'Run the command rm -rf /tmp/cache',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'tool-rendering',
    name: 'Generative UI - Tool Rendering',
    videoName: 'ToolRendering',
    docPath: 'generative-ui/tool-rendering',
    route: 'generative-ui/tool-rendering',
    ideFile: 'frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx',
    startLine: 23,
    endLine: 63,
    prompt: "What's the weather in Tokyo?",
    waitAfterPromptMs: 4000,
  },
  {
    id: 'state-rendering',
    name: 'Generative UI - State Rendering',
    videoName: 'StateRendering',
    docPath: 'generative-ui/state-rendering',
    route: 'generative-ui/state-rendering',
    ideFile: 'frontend/src/app/generative-ui/state-rendering/demo-chat/page.tsx',
    startLine: 28,
    endLine: 53,
    prompt: 'Search for the tallest mountains, then search for the deepest oceans',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'frontend-tools',
    name: 'App Control - Frontend Tools',
    videoName: 'FrontendTools',
    docPath: 'frontend-tools',
    route: 'frontend-tools',
    ideFile: 'frontend/src/app/frontend-tools/demo-chat/page.tsx',
    startLine: 20,
    endLine: 33,
    prompt: 'Say hello to Malaika',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'in-app-agent-read',
    name: 'Shared State - In-App Agent Read',
    videoName: 'SharedStateRead',
    docPath: 'shared-state/in-app-agent-read',
    route: 'shared-state/in-app-agent-read',
    ideFile: 'frontend/src/app/shared-state/in-app-agent-read/demo-chat/page.tsx',
    startLine: 20,
    endLine: 55,
    prompt: 'Switch to Spanish',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'in-app-agent-write',
    name: 'Shared State - In-App Agent Write',
    videoName: 'SharedStateWrite',
    docPath: 'shared-state/in-app-agent-write',
    route: 'shared-state/in-app-agent-write',
    ideFile: 'frontend/src/app/shared-state/in-app-agent-write/demo-chat/page.tsx',
    startLine: 30,
    endLine: 54,
    prompt: 'What language are we using now?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'readables',
    name: 'Readables',
    videoName: 'Readables',
    docPath: 'agent-app-context',
    route: 'readables',
    ideFile: 'frontend/src/app/readables/demo-chat/page.tsx',
    startLine: 18,
    endLine: 34,
    prompt: 'Who are my colleagues?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'auth',
    name: 'Authentication - Bearer Token',
    videoName: 'Auth',
    docPath: 'auth',
    route: 'auth',
    ideFile: 'backend/main.py',
    startLine: 66,
    endLine: 90,
    prompt: 'Hello agent! Can you hear me?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'threads-drawer',
    name: 'Rich Threads - Threads Drawer',
    videoName: 'ThreadsDrawer',
    docPath: 'prebuilt-components/copilot-threads-drawer',
    route: 'threads/drawer',
    ideFile: 'frontend/src/app/threads/drawer/demo-chat/page.tsx',
    startLine: 80,
    endLine: 116,
    prompt: 'Can you tell me a joke?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'threads-headless',
    name: 'Rich Threads - Headless Threads',
    videoName: 'ThreadsHeadless',
    docPath: 'headless-threads',
    route: 'threads/headless',
    ideFile: 'frontend/src/app/threads/headless/demo-chat/page.tsx',
    startLine: 30,
    endLine: 50,
    extraTabs: [
      {
        filePath: 'frontend/src/app/threads/headless/demo-chat/page.tsx',
        startLine: 150,
        endLine: 200,
      },
    ],
    prompt: 'What is CopilotKit?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'threads-lifecycle',
    name: 'Rich Threads - Thread & History Lifecycle',
    videoName: 'ThreadsLifecycle',
    docPath: 'threads-lifecycle',
    route: 'threads/lifecycle',
    ideFile: 'frontend/src/app/threads/lifecycle/demo-chat/page.tsx',
    startLine: 25,
    endLine: 40,
    extraTabs: [
      {
        filePath: 'frontend/src/app/threads/lifecycle/demo-chat/page.tsx',
        startLine: 70,
        endLine: 100,
      },
    ],
    prompt: 'Can you tell me a joke?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'copilot-runtime',
    name: 'Backend - Copilot Runtime',
    videoName: 'CopilotRuntime',
    docPath: 'copilot-runtime',
    route: 'copilot-runtime',
    ideFile: 'frontend/src/app/api/copilotkit/[[...slug]]/route.ts',
    startLine: 19,
    endLine: 37,
    prompt: "What's the weather in Tokyo?",
    prompts: ["What's the weather in Tokyo?", 'Switch to Spanish'],
    waitAfterPromptMs: 1500,
  },
  {
    id: 'ag-ui',
    name: 'Backend - AG-UI Protocol Stream',
    videoName: 'AgUi',
    docPath: 'ag-ui',
    route: 'ag-ui',
    ideFile: 'frontend/src/app/ag-ui/demo-chat/page.tsx',
    startLine: 70,
    endLine: 102,
    prompt: "What's the weather in Tokyo?",
    waitAfterPromptMs: 4000,
  },
]);
