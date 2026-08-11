"use client";

import {
  CopilotChat,
  useDefaultRenderTool,
  useRenderTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";

import { DemoFrame } from "@/components/demo-frame";

/**
 * Two renderers in one chat: a named one for `get_weather`, and a generic
 * fallback for every other tool.
 *
 * `get_weather` is the agent's only server-side tool — defined in
 * `backend/agents.py` exactly as the doc's Python sample defines it. The
 * renderer name has to match that tool name character for character.
 *
 * Both registrations are scoped to this route, so the same tool call falls back
 * to CopilotKit's built-in rendering everywhere else in the app.
 */
export default function Page() {
  // [1] tool rendering: named renderer
  // [!code highlight]
  useRenderTool(
    {
      name: "get_weather",
      parameters: z.object({ location: z.string() }),
      render: (props) => {
        if (props.status !== "complete") {
          return (
            <p className="mt-2 text-gray-500">Calling weather API...</p>
          );
        }
        return (
          <p className="mt-2 text-gray-500">
            Called the weather API for {props.parameters?.location}.
          </p>
        );
      },
    },
    [],
  );

  // [2] tool rendering: default renderer
  // [!code highlight]
  // Catch-all for tools without a dedicated renderer.
  useDefaultRenderTool({
    render: ({ name, status, result }) => (
      <div className="my-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
        <p className="font-mono text-xs text-slate-600 dark:text-slate-300">
          {status === "complete" ? "✓" : "⏳"} {name}
        </p>
        {status === "complete" && result && (
          <pre className="mt-1 overflow-x-auto text-xs text-slate-500">
            {result}
          </pre>
        )}
      </div>
    ),
  });

  return (
    <DemoFrame
      parentPath="/generative-ui/tool-rendering"
      subtitle="named renderer + wildcard fallback"
    >
      <CopilotChat
        agentId="my_agent"
        labels={{
          welcomeMessageText:
            "Ask for the weather in a city to see the named renderer.",
        }}
      />
    </DemoFrame>
  );
}
