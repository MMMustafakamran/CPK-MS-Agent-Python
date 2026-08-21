"use client";

import { CopilotChat, useThreads } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";
import { ThreadsProvider } from "@/components/threads-provider";

/**
 * The doc's four steps, built as one screen: a hand-rolled `ThreadSidebar` on
 * `useThreads`, thread switching by passing `threadId` to `<CopilotChat>`, and
 * cursor pagination.
 *
 * No `CopilotChatConfigurationProvider` here on purpose — this is the path
 * where the host owns the active thread in its own state, which is the whole
 * difference from the drawer page.
 */

const AGENT_ID = "default";

/** `limit` is deliberately tiny so "Load more" is reachable with a handful of threads. */
const PAGE_SIZE = 5;

function ThreadSidebar({
  activeThreadId,
  onSelectThread,
}: {
  activeThreadId?: string;
  onSelectThread: (threadId: string | undefined) => void;
}) {
  const [includeArchived, setIncludeArchived] = useState(false);

  // [1] headless-threads: useThreads — list, mutate, paginate
  // [!code highlight]
  const {
    threads,
    isLoading,
    listError,
    renameThread,
    archiveThread,
    unarchiveThread,
    deleteThread,
    isMutating,
    hasMoreThreads,
    isFetchingMoreThreads,
    fetchMoreThreads,
    startNewThread,
  } = useThreads({ agentId: AGENT_ID, includeArchived, limit: PAGE_SIZE });

  // The doc's `if (isLoading) return <div>Loading...</div>` verbatim would
  // collapse this column to nothing and shove the chat left until the list
  // arrives. Same early return, but holding the sidebar's width so the layout
  // does not jump.
  if (isLoading) {
    return (
      <div className="w-72 shrink-0 border-r border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            // Clears our own selection; `startNewThread` resets the hook's
            // notion of the active thread. Nothing is persisted until the
            // first run, so no row appears yet.
            startNewThread();
            onSelectThread(undefined);
          }}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:border-slate-400 dark:border-slate-600"
        >
          + New conversation
        </button>
        <label className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
          />
          Archived
        </label>
      </div>

      {listError && (
        <p className="border-b border-red-200 p-3 text-xs text-red-600 dark:border-red-900 dark:text-red-400">
          {listError.message}
        </p>
      )}

      <ul data-testid="thread-list" className="min-h-0 flex-1 overflow-y-auto">
        {threads.length === 0 && (
          <li className="p-3 text-xs text-slate-500">
            No conversations yet — send a message to create one.
          </li>
        )}

        {/* [2] headless-threads: rows with rename / archive / delete */}
        {/* [!code highlight] */}
        {threads.map((thread) => (
          <li
            key={thread.id}
            className={`border-b border-slate-100 p-2 dark:border-slate-800/60 ${
              thread.id === activeThreadId ? "bg-slate-100 dark:bg-slate-800" : ""
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectThread(thread.id)}
              className="block w-full truncate text-left text-sm"
            >
              {thread.name ?? "New conversation"}
              {thread.archived && (
                <span className="ml-1 text-[10px] uppercase opacity-50">archived</span>
              )}
            </button>

            <div className="mt-1 flex gap-2 text-[11px] text-slate-500">
              <button
                type="button"
                disabled={isMutating}
                onClick={() => {
                  const name = window.prompt("Rename thread", thread.name ?? "");
                  if (name) void renameThread(thread.id, name);
                }}
                className="hover:underline disabled:opacity-40"
              >
                Rename
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() =>
                  void (thread.archived
                    ? unarchiveThread(thread.id)
                    : archiveThread(thread.id))
                }
                className="hover:underline disabled:opacity-40"
              >
                {thread.archived ? "Unarchive" : "Archive"}
              </button>
              <button
                type="button"
                disabled={isMutating}
                onClick={() => {
                  // deleteThread is permanent and ships no confirmation of its
                  // own — the doc says to add one, so here it is.
                  if (!window.confirm("Delete this conversation permanently?")) return;
                  if (thread.id === activeThreadId) onSelectThread(undefined);
                  void deleteThread(thread.id);
                }}
                className="hover:underline disabled:opacity-40"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* [3] headless-threads: cursor pagination */}
      {/* [!code highlight] */}
      {hasMoreThreads && (
        <button
          type="button"
          onClick={fetchMoreThreads}
          disabled={isFetchingMoreThreads}
          className="shrink-0 border-t border-slate-200 p-2 text-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:hover:bg-slate-900"
        >
          {isFetchingMoreThreads ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}

export default function Page() {
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();

  return (
    <DemoFrame
      parentPath="/threads/headless"
      subtitle="useThreads + your own sidebar"
    >
      <ThreadsProvider>
        <div className="flex h-full">
          <ThreadSidebar
            activeThreadId={activeThreadId}
            onSelectThread={setActiveThreadId}
          />

          <div className="min-w-0 flex-1">
            {/*
              [4] headless-threads: switch threads by passing threadId
              [!code highlight]

              Keyed on the id so a fresh conversation remounts the chat rather
              than reusing the previous thread's view. Without a key, going from
              a selected thread back to undefined leaves the old transcript up,
              because an auto-minted id is memoized for the component's lifetime.
            */}
            <CopilotChat
              key={activeThreadId ?? "new"}
              agentId={AGENT_ID}
              threadId={activeThreadId}
            />
          </div>
        </div>
      </ThreadsProvider>
    </DemoFrame>
  );
}
