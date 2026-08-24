"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

/**
 * Provider for the Rich Threads routes, nested inside the app-wide `Providers`.
 *
 * It differs from the root provider in exactly two ways, both required before
 * any thread UI works:
 *
 * `runtimeUrl` points at `/api/copilotkit-threads`, the Intelligence-backed
 * runtime. The root `/api/copilotkit` is the documented Quickstart runtime and
 * has no thread routes.
 *
 * `useSingleEndpoint={false}` forces REST/multi-route transport. Thread routes
 * are only dispatched in multi-route mode, and leaving the transport on
 * auto-detect races the lazily-compiled API route under `next dev`.
 *
 * `headers` forwards the same bearer token the root provider sends, because
 * `backend/main.py` rejects unauthenticated AG-UI calls whenever
 * `AUTH_BEARER_TOKEN` is set.
 */

const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_BEARER_TOKEN;

export function ThreadsProvider({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit-threads"
      useSingleEndpoint={false}
      {...(AUTH_TOKEN
        ? { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
        : {})}
      showDevConsole="auto"
      onError={(event) => {
        console.error(`[CopilotKit ${event.code}]`, event.error);
      }}
    >
      {children}
    </CopilotKitProvider>
  );
}
