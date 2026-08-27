import {
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

// The AG-UI server from `backend/main.py`. Microsoft Agent Framework speaks
// AG-UI directly, so the runtime binds a plain `HttpAgent` — there is no
// framework-specific adapter package to install.
const AGENT_URL = process.env.MS_AGENT_URL ?? "http://localhost:8000";

// Three agents, one per AG-UI endpoint. `my_agent` is the Quickstart agent;
// the other two exist because Shared State and State Rendering each define
// their own `state_schema`, which is a property of the agent it is attached
// to and cannot be shared.
// The Quickstart's snippet wires `intelligence` + `identifyUser` here; this
// route deliberately takes the fallback that step documents (no Intelligence,
// in-memory runner). The wired version is in `api/copilotkit-threads`.
// [1] quickstart: runtime config
// [!code highlight]
const runtime = new CopilotRuntime({
  agents: {
    my_agent: new HttpAgent({ url: `${AGENT_URL}/` }),
    sample_agent: new HttpAgent({ url: `${AGENT_URL}/sample_agent` }),
    search_agent: new HttpAgent({ url: `${AGENT_URL}/search_agent` }),
  },
  runner: new InMemoryAgentRunner(),
});

// A Next.js catch-all route handler for the CopilotKit runtime requests.
// [2] copilot-runtime: request handler
// [!code highlight]
const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
