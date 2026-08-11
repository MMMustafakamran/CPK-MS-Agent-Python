"use client";

import { CopilotChat, useAgent, useCopilotKit } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Writing into agent state from the app.
 *
 * `agent.setState` updates the state the agent will see on its next run. Two
 * buttons here to show the difference the doc draws:
 *
 *   Toggle          — sets state and stops. The agent picks it up next time it
 *                     runs, which may be several turns later.
 *   Toggle + re-run — sets state, appends a hint message, and calls
 *                     `copilotkit.runAgent()` so the agent reacts immediately.
 */

type AgentState = {
  language: "english" | "spanish";
};

export default function Page() {
  // No `initialState` here — that prop does not exist on `useAgent` in 1.66.2.
  // The starting value is seeded by `default_state` on the server endpoint.
  const { agent } = useAgent({ agentId: "sample_agent" });
  const { copilotkit } = useCopilotKit();
  const state = agent.state as AgentState | undefined;

  const nextLanguage = () =>
    state?.language === "english" ? "spanish" : "english";

  // shared-state write page
  // [!code highlight]
  const toggleLanguage = () => {
    agent.setState({ language: nextLanguage() });
  };

  // shared-state write page
  // [!code highlight]
  const toggleAndRerun = async () => {
    const newLanguage = nextLanguage();
    agent.setState({ language: newLanguage });
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: `the language has been updated to ${newLanguage}`,
    });
    // [!code highlight]
    await copilotkit.runAgent({ agent });
  };

  return (
    <DemoFrame
      parentPath="/shared-state/in-app-agent-write"
      subtitle="agent.setState + optional re-run"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r dark:border-slate-800">
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Your main content
          </h1>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
            Language:{" "}
            <strong className="text-[var(--accent)]">
              {state?.language ?? "—"}
            </strong>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium dark:border-slate-600"
            >
              Toggle Language
            </button>
            <button
              type="button"
              onClick={() => void toggleAndRerun()}
              disabled={agent.isRunning}
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              Toggle + re-run agent
            </button>
          </div>

          <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Raw agent.state
          </h2>
          <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">
            {JSON.stringify(agent.state ?? {}, null, 2)}
          </pre>
        </div>

        <div className="min-h-0">
          <CopilotChat
            agentId="sample_agent"
            labels={{
              welcomeMessageText:
                "Toggle the language on the left, then ask me what language I'm using.",
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
