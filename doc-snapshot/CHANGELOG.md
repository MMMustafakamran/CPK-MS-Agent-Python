# Doc drift changelog

What the CopilotKit docs changed under this repo, written by the sync on
`/doc-sync`. Only pages that actually moved are recorded — a sync that finds
everything unchanged writes nothing here at all.

Holds the 3 most recent dated entries. When a change lands on a fourth
date, the oldest entry is dropped. Entries are counted, not aged, so a gap of
weeks between changes does not expire anything.

## 2026-08-30

### 13:44 UTC — 8 pages, highest severity high

**High — Readables**

`/ms-agent-python/agent-app-context` · route `/readables` · under “Consume the data in your AG-UI server”

45 code lines, 6 prose lines changed.

````diff
- The `context` you register on the frontend is forwarded to your AG-UI server in `ChatOptions.AdditionalProperties["ag_ui_context"]`. Use middleware to access this context and inject it into the agent's conversation.
+ The `context` you register on the frontend is forwarded in the AG-UI `RunAgentInput`. Use middleware to read it and inject it into the agent's conversation.
- using Azure.AI.OpenAI;
- using Azure.Identity;
+ using AGUI.Abstractions;
+ using AGUI.Server;
+ using OpenAI;
+ using OpenAI.Chat;
````

**High — Authentication**

`/ms-agent-python/auth` · route `/auth` · under “Backend Setup” · in a `csharp` block

21 code lines, 3 prose lines changed. The number of fenced code blocks changed.

````diff
+ using OpenAI.Chat;
+ builder.Services.AddAGUIServer();
- string githubToken = builder.Configuration["GitHubToken"]!;
- var openAI = new OpenAIClient(
- new System.ClientModel.ApiKeyCredential(githubToken),
- new OpenAIClientOptions { Endpoint = new Uri("https://models.inference.ai.azure.com") }
- );
+ string openAiApiKey = builder.Configuration["OPENAI_API_KEY"]
````

**High — Frontend Tools**

`/ms-agent-python/frontend-tools` · route `/frontend-tools` · under “Create your AG-UI server” · in a `csharp` block

18 code lines changed.

````diff
- using Azure.AI.OpenAI;
- using Azure.Identity;
+ using OpenAI;
+ using OpenAI.Chat;
- builder.Services.AddAGUI();
+ builder.Services.AddAGUIServer();
- string endpoint = builder.Configuration["AZURE_OPENAI_ENDPOINT"]!;
- string deployment = builder.Configuration["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"]!;
````

**High — State Rendering**

`/ms-agent-python/generative-ui/state-rendering` · route `/generative-ui/state-rendering` · under “Stream state from your agent” · in a `csharp` block

92 code lines changed.

````diff
- using Azure.AI.OpenAI;
- using Azure.Identity;
+ using AGUI.Abstractions;
+ using AGUI.Server;
+ using OpenAI;
+ using OpenAI.Chat;
+ using AIChatMessage = Microsoft.Extensions.AI.ChatMessage;
+ using AIChatResponseFormat = Microsoft.Extensions.AI.ChatResponseFormat;
````

**High — Tool Rendering**

`/ms-agent-python/generative-ui/tool-rendering` · route `/generative-ui/tool-rendering` · under “Give your agent a tool to call” · in a `csharp` block

23 code lines changed.

````diff
- using Azure.AI.OpenAI;
- using Azure.Identity;
+ using Microsoft.Extensions.AI;
+ using OpenAI;
+ using OpenAI.Chat;
- builder.Services.AddAGUI();
+ builder.Services.AddAGUIServer();
- string endpoint = builder.Configuration["AZURE_OPENAI_ENDPOINT"]!;
````

**High — Quickstart**

`/ms-agent-python/quickstart` · route `/quickstart` · under “Quickstart”

37 code lines, 30 prose lines changed. The number of fenced code blocks changed.

````diff
- <OpsPlatformCTA
- variant="card"
- title="Ship Microsoft Agent Framework to production"
- body="Add persistent threads and the inspector with CopilotKit Intelligence."
- ctaLabel="Create a free account"
+ <IntelligenceOnboardingPrompt
+ feature="learning"
- - A GitHub Personal Access Token (for GitHub Models API - free AI access)
````

**Low — Headless Threads**

`/ms-agent-python/headless-threads` · route `/threads/headless` · under “What is this?”

6 prose lines changed.

````diff
- <OpsPlatformCTA
- variant="inline"
- title="Threads run in CopilotKit Intelligence"
- body="Get persistent threads and realtime sync on the free Developer tier."
+ <IntelligenceOnboardingPrompt
+ feature="threads"
````

**Low — Overview**

`/ms-agent-python/threads` · route `/threads` · under “Rich Threads”

14 prose lines changed.

````diff
+ <IntelligenceOnboardingPrompt
+ feature="threads"
+ surface="docs_threads_overview"
+ />
+ 
+ Open a real thread and use **Try from here** to copy it into a Playground scratch session. The stored thread does not change.
- 
- <OpsPlatformCTA
````

---

## 2026-08-24

### 07:45 UTC — 6 pages, highest severity high

**High — Copilot Runtime**

`/ms-agent-python/copilot-runtime` · route `/copilot-runtime` · under “Setting Up the Runtime”

41 code lines, 13 prose lines changed. The number of fenced code blocks changed.

````diff
- The runtime is a lightweight server endpoint that you add to your backend. Here's a minimal example using Next.js:
+ The runtime is a lightweight server endpoint that you add to your backend:
- ```ts title="app/api/copilotkit/route.ts"
+ ```npm
+ npm install @copilotkit/runtime
+ ```
+ 
+ Here's a minimal example using Next.js. `createCopilotRuntimeHandler` returns a
````

**High — Headless Threads**

`/ms-agent-python/headless-threads` · route `/threads/headless` · under “Configure your Runtime with Enterprise Intelligence”

18 code lines, 14 prose lines changed.

````diff
- Your `CopilotRuntime` must be connected to Enterprise Intelligence before the thread UI can list and resume conversations. If your app came from a CLI starter, this Runtime configuration is generated for you. Otherwise, keep your existing Enterprise Intelligence Runtime configuration while adding the headless UI. Thread names are automatically generated by the LLM after the first message — you can disable this with `generateThreadNames: false`.
+ Your `CopilotRuntime` must be connected to Enterprise Intelligence before the thread UI can list and resume conversations. That connection is the `intelligence` option below — a `CopilotKitIntelligence` instance. If your app came from a CLI starter, this Runtime configuration is generated for you. Otherwise, follow [Connect your runtime to Intelligence](/ms-agent-python/premium/connect-your-runtime) for the full constructor, then return here to add the headless UI. Thread names are automatically generated by the LLM after the first message — you can disable this with `generateThreadNames: false`.
- import { CopilotRuntime } from "@copilotkit/runtime";
+ import {
+ CopilotKitIntelligence,
+ CopilotRuntime,
+ } from "@copilotkit/runtime/v2";
+ // Without `intelligence` the runtime runs in SSE mode and the thread
````

**High — Quickstart**

`/ms-agent-python/quickstart` · route `/quickstart` · under “Setup Copilot Runtime”

27 code lines, 1 heading, 15 prose lines changed.

````diff
- Create a new API route at `app/api/copilotkit/route.ts`:
+ Create a new API route at `app/api/copilotkit/[[...slug]]/route.ts`:
- ```tsx title="app/api/copilotkit/route.ts"
+ ```tsx title="app/api/copilotkit/[[...slug]]/route.ts" doctest="component"
- ExperimentalEmptyAdapter,
- copilotRuntimeNextJSAppRouterEndpoint,
- } from "@copilotkit/runtime";
+ createCopilotRuntimeHandler,
````

**High — Thread & History Lifecycle**

`/ms-agent-python/threads-lifecycle` · route `/threads/lifecycle` · under “Scope Rich Threads to the signed-in user” · in a `ts` block

8 code lines, 5 prose lines changed.

````diff
+ import { CopilotKitIntelligence, CopilotRuntime } from "@copilotkit/runtime/v2";
+ 
+ // `apiKey` is the only required field. The key scopes the project, so there is
+ // no separate project or organization id to pass. See Connect your runtime.
+ const intelligence = new CopilotKitIntelligence({
+ apiKey: process.env.INTELLIGENCE_API_KEY!,
+ });
+ 
````

**Low — Inspector**

`/ms-agent-python/inspector` · route `/inspector` · under “What it shows”

21 prose lines changed.

````diff
- The CopilotKit Inspector is a built-in debugging tool that overlays on your app, giving you full visibility into what's happening between your frontend and your agents in real time.
+ The CopilotKit Inspector is a built-in debugging tool that overlays on your app.
+ The first open lands on **Home**. Later opens return to the last pane you used.
+ | **Home** | Project, runtime, services, and CopilotKit news. |
+ | **Memory** | Inspect long-term memory when Intelligence exposes it. |
- The primary navigation groups the Inspector into **Threads**, **Agents**, and
- **Learning**. Threads is the default. Open a real Thread to inspect its
+ The sidebar has three groups: **Home**, **Workbench** (Threads, Memory), and
````

**Low — Overview**

`/ms-agent-python/threads` · route `/threads` · under “Rich Threads”

20 prose lines changed.

````diff
+ <Callout type="info" title="See this in Inspector">
+ Open Inspector on localhost. Stay on **Threads** (it is the default).
+ Real threads appear when Intelligence is on. Enable Intelligence appears when it is off.
+ 
+ More detail: [Inspector](/ms-agent-python/inspector).
+ </Callout>
+ 
+ 
````

---

---

## 2026-08-20

### 11:18 UTC — 4 pages, highest severity none

**None — Rich Threads** · _new pages brought into tracking, not an upstream change_

Four doc pages that already existed upstream were added to `nav-config.ts` and
fetched into the snapshot for the first time, so there is no prior copy to diff
against:

- `/ms-agent-python/threads` · route `/threads`
- `/ms-agent-python/prebuilt-components/copilot-threads-drawer` · route `/threads/drawer`
- `/ms-agent-python/headless-threads` · route `/threads/headless`
- `/ms-agent-python/threads-lifecycle` · route `/threads/lifecycle`

`/ms-agent-python/threads-import` exists upstream and is deliberately left
untracked — see README §8.

---
