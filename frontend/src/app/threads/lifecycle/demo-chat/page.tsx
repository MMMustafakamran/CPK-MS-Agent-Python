"use client";

import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  useAgent,
  useCopilotChatConfiguration,
  useThreads,
} from "@copilotkit/react-core/v2";
import { useEffect, useState } from "react";

import { DemoFrame } from "@/components/demo-frame";
import { ThreadsProvider } from "@/components/threads-provider";

/**
 * The lifecycle made observable: which threadId is active, whether it was
 * minted or picked, and what the two setters do to both.
 *
 * The panel deliberately drives threads imperatively and passes no `threadId`
 * prop. Both setters no-op with a warning when the id is prop-controlled, so
 * mixing the two would make every button here silently do nothing.
 */

const AGENT_ID = "default";

function LifecyclePanel() {
  // [1] threads-lifecycle: the active-thread surface
  // [!code highlight]
  const config = useCopilotChatConfiguration();

  // [2] threads-lifecycle: manual hydration — read messages off the agent
  // [!code highlight]
  const { agent } = useAgent({ agentId: AGENT_ID });
  const messages = agent.messages;

  const { threads } = useThreads({ agentId: AGENT_ID });
  const known = threads.filter((t) => t.id !== config?.threadId);

  // An auto-minted id is a `randomUUID()` computed during render, so the server
  // and the client mint different ones and printing it directly is a hydration
  // mismatch. Nothing else here is non-deterministic on first render.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex w-80 shrink-0 flex-col gap-3 overflow-y-auto border-r border-slate-200 p-3 text-xs dark:border-slate-800">
      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-200">Active thread</p>
        <p className="mt-1 break-all font-mono text-[11px] text-slate-500">
          {mounted ? (config?.threadId ?? "—") : "—"}
        </p>
        <p className="mt-1 text-slate-500">
          hasExplicitThreadId:{" "}
          <span
            className={
              config?.hasExplicitThreadId
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-amber-600 dark:text-amber-400"
            }
          >
            {String(config?.hasExplicitThreadId ?? false)}
          </span>
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          {config?.hasExplicitThreadId
            ? "Picked — history replayed from the platform."
            : "Freshly minted — nothing to replay, welcome screen shows."}
        </p>
      </div>

      <div>
        {/* [3] threads-lifecycle: start a fresh, non-explicit thread */}
        {/* [!code highlight] */}
        <button
          type="button"
          onClick={() => config?.startNewThread()}
          className="w-full rounded-md border border-slate-300 px-2 py-1.5 font-medium hover:border-slate-400 dark:border-slate-600"
        >
          New chat
        </button>
      </div>

      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          Open a known conversation
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          Sets it explicitly, which is what triggers history replay.
        </p>
        <ul data-testid="known-threads" className="mt-2 flex flex-col gap-1">
          {known.length === 0 && (
            <li className="text-slate-500">
              No other conversations yet — send a message, then hit New chat.
            </li>
          )}
          {/* [4] threads-lifecycle: restore a known thread */}
          {/* [!code highlight] */}
          {known.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => config?.setActiveThreadId(thread.id, { explicit: true })}
                className="w-full truncate rounded border border-slate-200 px-2 py-1 text-left hover:border-slate-400 dark:border-slate-700"
              >
                {thread.name ?? "New conversation"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-semibold text-slate-700 dark:text-slate-200">
          agent.messages ({messages.length})
        </p>
        <p className="mt-1 text-[11px] text-slate-500">
          There is no v2 `initialMessages`. This is the array a manual
          hydration would replace with `agent.setMessages(...)`.
        </p>
        <ul className="mt-2 flex flex-col gap-1 font-mono text-[11px] text-slate-500">
          {messages.slice(-6).map((m) => (
            <li key={m.id} className="truncate">
              {m.role}: {"content" in m && m.content ? String(m.content) : "—"}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <DemoFrame
      parentPath="/threads/lifecycle"
      subtitle="mint → run → hydrate → switch"
    >
      <ThreadsProvider>
        {/* No `threadId` prop: the setters below are the single source of truth. */}
        <CopilotChatConfigurationProvider agentId={AGENT_ID}>
          <div className="flex h-full">
            <LifecyclePanel />
            <div className="min-w-0 flex-1">
              <CopilotChat />
            </div>
          </div>
        </CopilotChatConfigurationProvider>
      </ThreadsProvider>
    </DemoFrame>
  );
}
