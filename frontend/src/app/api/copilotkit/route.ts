import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { HttpAgent } from "@ag-ui/client";
import { NextRequest } from "next/server";

// The AG-UI server from `backend/main.py`. Microsoft Agent Framework speaks
// AG-UI directly, so the runtime binds a plain `HttpAgent` — there is no
// framework-specific adapter package to install.
const AGENT_URL = process.env.MS_AGENT_URL ?? "http://localhost:8000";

// 1. Any service adapter works for multi-agent setups. The empty adapter is
//    right here because the agents call the model themselves.
const serviceAdapter = new ExperimentalEmptyAdapter();

// 2. Three agents, one per AG-UI endpoint. `my_agent` is the Quickstart agent;
//    the other two exist because Shared State and State Rendering each define
//    their own `state_schema`, which is a property of the agent it is attached
//    to and cannot be shared.
// Docs: docs/1-get started/quickstart.md and docs/6-backend/copilot-runtime.md
// - "Setup Copilot Runtime" / "Setting Up the Runtime".
// [!code highlight]
const runtime = new CopilotRuntime({
  agents: {
    my_agent: new HttpAgent({ url: `${AGENT_URL}/` }),
    sample_agent: new HttpAgent({ url: `${AGENT_URL}/sample_agent` }),
    search_agent: new HttpAgent({ url: `${AGENT_URL}/search_agent` }),
  },
});

// 3. A Next.js route handler for the CopilotKit runtime requests.
// Docs: docs/6-backend/copilot-runtime.md - runtime request handler.
// [!code highlight]
export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
