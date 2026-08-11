"use client";

import { useThreads } from "@copilotkit/react-core/v2";

export function ThreadSidebar({
  onSelectThread,
}: {
  onSelectThread: (threadId: string) => void;
}) {
  // [1] headless threads: useThreads
  // [!code highlight]
  const {
    threads,
    isLoading,
    renameThread,
    archiveThread,
    deleteThread,
    hasMoreThreads,
    isFetchingMoreThreads,
    fetchMoreThreads,
  } = useThreads({
    agentId: "my-agent",
    // [2] headless threads: page size
    // [!code highlight]
    limit: 20,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <aside>
      {threads.map((thread) => (
        <div key={thread.id}>
          {/* [3] headless threads: select thread */}
          <button type="button" onClick={() => onSelectThread(thread.id)}>
            {thread.name ?? "New conversation"}
          </button>
          {/* [4] headless threads: rename */}
          <button
            type="button"
            onClick={() => renameThread(thread.id, "Renamed")}
          >
            Rename
          </button>
          {/* [5] headless threads: archive */}
          <button
            type="button"
            onClick={() => archiveThread(thread.id)}
          >
            Archive
          </button>
          <button type="button" onClick={() => deleteThread(thread.id)}>
            Delete
          </button>
        </div>
      ))}

      {hasMoreThreads && (
        <button
          type="button"
          onClick={fetchMoreThreads}
          disabled={isFetchingMoreThreads}
        >
          {isFetchingMoreThreads ? "Loading..." : "Load more"}
        </button>
      )}
    </aside>
  );
}

