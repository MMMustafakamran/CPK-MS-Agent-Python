"use client";

import { useEffect } from "react";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Reading the agent's live state in your own UI.
 *
 * `sample_agent` declares a `language` state schema and maps the
 * `update_language` tool argument onto it, so asking the agent to switch
 * language updates `agent.state.language` — and this panel — without any
 * message parsing on the frontend.
 *
 * The page used to seed with `useAgent({ initialState })`, a prop the hook has
 * never had. It now seeds in an effect gated on `isReady`, which the hook does
 * return, so the published snippet compiles and is reproduced verbatim below.
 * `default_state` on the endpoint in `backend/main.py` stays: the client seed
 * only covers the first paint, the server one survives a re-run.
 */

type AgentState = {
  language: "english" | "spanish";
};

export default function Page() {
  // [1] shared state: read agent state
  // [!code highlight]
  const { agent, isReady } = useAgent({ agentId: "sample_agent" });
  const state = (agent.state ?? {}) as Partial<AgentState>;

  // [2] shared state: seed state once the agent is ready
  // [!code highlight]
  useEffect(() => {
    if (!isReady || state.language !== undefined) return;
    agent.setState({ ...(agent.state ?? {}), language: "english" });
  }, [agent, isReady, state.language]);

  return (
    <DemoFrame
      parentPath="/shared-state/in-app-agent-read"
      subtitle="agent.state read from sample_agent"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r dark:border-slate-800">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Your main content
          </h1>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            Language:{" "}
            <strong className="text-[var(--accent)]">
              {state.language ?? "—"}
            </strong>
          </p>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Raw agent.state
          </h2>
          {/* [2] shared state: display state */}
          {/* [!code highlight] */}
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(agent.state ?? {}, null, 2)}
          </pre>
        </div>

        <div className="min-h-0">
          <CopilotChat
            agentId="sample_agent"
            labels={{
              welcomeMessageText:
                'Try "Switch to Spanish" and watch the panel on the left.',
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
