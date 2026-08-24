"use client";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Agent state streamed into the UI.
 *
 * `search_agent` declares a `searches` state schema and a
 * `predict_state_config` that maps the `update_searches` tool argument onto it,
 * so calling the tool updates `agent.state.searches` as the run streams —
 * before the tool result is even returned.
 *
 * Rendered twice on purpose: once beside the chat, and once as the chat's own
 * panel, which is the "in the chat" vs "outside the chat" split the doc draws.
 */

type SearchInfo = {
  query: string;
  done: boolean;
};

type AgentState = {
  searches: SearchInfo[];
};

export default function Page() {
  // [1] state rendering: read state
  // [!code highlight]
  const { agent } = useAgent({ agentId: "search_agent" });
  const state = agent.state as AgentState | undefined;

  const renderedState = (
    <div className="mt-4 flex flex-col gap-2">
      {state?.searches?.length ? (
        state.searches.map((search, index) => (
          <div key={index} className="flex flex-row gap-2 text-sm">
            <span>{search.done ? "✅" : "❌"}</span>
            <span className="text-slate-800 dark:text-slate-100">
              {search.query}
              {search.done ? "" : "..."}
            </span>
          </div>
        ))
      ) : (
        <p className="text-sm text-slate-500">
          No searches yet. Ask the agent to search for something.
        </p>
      )}
    </div>
  );

  return (
    <DemoFrame
      parentPath="/generative-ui/state-rendering"
      subtitle="searches state streamed from search_agent"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r dark:border-slate-800">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Searches (rendered outside the chat)
          </h2>
          {renderedState}

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Raw agent.state
          </h2>
          {/* [2] state rendering: display state */}
          {/* [!code highlight] */}
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(agent.state ?? {}, null, 2)}
          </pre>
        </div>

        <div className="min-h-0">
          <CopilotChat
            agentId="search_agent"
            labels={{
              welcomeMessageText:
                'Try "Search for the tallest mountains, then search for the deepest oceans".',
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
