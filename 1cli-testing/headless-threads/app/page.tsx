"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { ThreadSidebar } from "../components/ThreadSidebar";

export default function Page() {
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();

  return (
    <div className="flex">
      <ThreadSidebar onSelectThread={setActiveThreadId} />
      {/* [6] headless threads: active chat thread */}
      {/* [!code highlight] */}
      <CopilotChat threadId={activeThreadId} />
    </div>
  );
}

