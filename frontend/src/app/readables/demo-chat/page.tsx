"use client";

import { CopilotChat, useAgentContext } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Sharing app state with the agent as context rather than as a message.
 *
 * `useAgentContext` forwards its value on every run as `RunAgentInput.Context`.
 * The page used to say the Python integration surfaced that to the agent on its
 * own; it now publishes a `ContextAwareAgent` that folds the entries into a
 * system message per request, and the shipped adapter confirms that is what is
 * actually required. This chat therefore binds `context_agent`, the endpoint
 * running that subclass, not the plain `sample_agent` it used before.
 *
 * The colleagues list is the doc's sample data.
 */
export default function Page() {
  // [1] readable: context values
  // [!code highlight]
  const [colleagues] = useState([
    { id: 1, name: "John Doe", role: "Developer" },
    { id: 2, name: "Jane Smith", role: "Designer" },
    { id: 3, name: "Bob Wilson", role: "Product Manager" },
  ]);

  // [2] readable: register context
  // [!code highlight]
  useAgentContext({
    description: "The current user's colleagues",
    value: colleagues,
  });

  return (
    <DemoFrame
      parentPath="/readables"
      subtitle="useAgentContext — injected by ContextAwareAgent"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-2">
        <div className="min-h-0 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r dark:border-slate-800">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Context shared with the agent
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            &ldquo;The current user&apos;s colleagues&rdquo;
          </p>
          <ul className="mt-3 space-y-2">
            {colleagues.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
              >
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {c.name}
                </p>
                <p className="text-xs text-slate-500">{c.role}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            This is never sent as a chat message — it rides along with the run.
          </p>
        </div>

        <div className="min-h-0">
          <CopilotChat
            agentId="context_agent"
            labels={{
              welcomeMessageText:
                'Try "Who are my colleagues?" — I was never told in a message.',
            }}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
