"use client";

import {
  CopilotChat,
  useCopilotChatConfiguration,
} from "@copilotkit/react-core/v2";
import { useState } from "react";

export default function Page() {
  const config = useCopilotChatConfiguration();
  const [existingId, setExistingId] = useState("");

  return (
    <div>
      <div>
        <input
          value={existingId}
          onChange={(event) => setExistingId(event.target.value)}
          placeholder="Existing thread id"
        />
        {/* [2] lifecycle: restore thread */}
        <button
          type="button"
          onClick={() =>
            config?.setActiveThreadId(existingId, { explicit: true })
          }
        >
          Open conversation
        </button>
        {/* [3] lifecycle: start new thread */}
        <button type="button" onClick={() => config?.startNewThread()}>
          New chat
        </button>
      </div>

      {/* [4] lifecycle: active chat */}
      {/* [!code highlight] */}
      <CopilotChat agentId="my-agent" />
    </div>
  );
}

