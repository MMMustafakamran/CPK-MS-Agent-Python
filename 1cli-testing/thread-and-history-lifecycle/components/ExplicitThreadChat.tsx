"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";

export function ExplicitThreadChat({
  myThreadId,
}: {
  myThreadId: string;
}) {
  // [1] lifecycle: explicit thread id
  // [!code highlight]
  return <CopilotChat agentId="my-agent" threadId={myThreadId} />;
}

