"use client";

import { CopilotChat, useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";

import { DemoFrame } from "@/components/demo-frame";

/**
 * The doc's `sayHello` tool, registered on this page.
 *
 * Page-scoped registration is safe for this integration: the agent never
 * declares the tool, so it only exists when this route is mounted and forwards
 * it in the AG-UI run input. There is no risk of the agent calling a tool with
 * no handler and stalling the run.
 *
 * The handler is the doc's — an `alert`. Crude, but unambiguous when you are
 * checking whether browser execution actually happened.
 */
export default function Page() {
  // [1] frontend tools: browser handler
  // [!code highlight]
  useFrontendTool({
    name: "sayHello",
    description: "Say hello to the user",
    parameters: z.object({
      name: z.string().describe("The name of the user to say hello to"),
    }),
    handler: async ({ name }) => {
      alert(`Hello, ${name}!`);
      return `Said hello to ${name}!`;
    },
  });

  return (
    <DemoFrame
      parentPath="/frontend-tools"
      subtitle="sayHello runs in this browser tab"
    >
      <CopilotChat
        agentId="my_agent"
        labels={{
          welcomeMessageText:
            'Try "Say hello to Damien" — the handler fires a browser alert.',
        }}
      />
    </DemoFrame>
  );
}
