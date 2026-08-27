import Link from "next/link";

import { RouteHeader } from "@/components/route-header";
import { SourceCodeGroup } from "@/components/source-code";
import { Callout, KeyValue, Panel } from "@/components/ui";

const SUB_ROUTES = [
  {
    path: "/threads/drawer",
    title: "Threads Drawer",
    blurb:
      "The drop-in sidebar: list, switch, archive, delete, with no active-thread state of your own.",
  },
  {
    path: "/threads/headless",
    title: "Headless Threads",
    blurb:
      "The same data through useThreads, driving a sidebar this repo writes itself. The only path with rename.",
  },
  {
    path: "/threads/lifecycle",
    title: "Thread & History Lifecycle",
    blurb:
      "How a threadId is minted, when history replays, and what the two active-thread setters actually do.",
  },
];

export default function Page() {
  return (
    <>
      <RouteHeader path="/threads" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Persisted conversation history. Unlike every other route in this
          harness, thread storage lives neither in the agent nor in the runtime
          — it lives in CopilotKit&apos;s managed Intelligence platform, which
          makes this the one section that needs credentials to work at all.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The doc splits the surface across three pages, and so does this
          section. Start here for the credentials, then pick a path:
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {SUB_ROUTES.map((route) => (
            <li key={route.path}>
              <Link
                href={route.path}
                className="block rounded-md border border-slate-200 p-3 transition-colors hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"
              >
                <span className="text-sm font-medium text-[var(--accent)]">
                  {route.title}
                </span>
                <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">
                  {route.blurb}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel
        title="Authentication"
        description="Why this section has its own runtime endpoint and its own provider."
      >
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Three things have to be true before any thread UI works, and only the
          third is what people usually mean by &ldquo;authentication&rdquo;.
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <li>
            <strong>Multi-route Intelligence endpoint.</strong> Thread routes are
            served via the catch-all runtime handler. While{" "}
            <code>/api/copilotkit</code> serves the core agents with in-memory
            running, <code>/api/copilotkit-threads</code> is configured with the
            managed CopilotKit Intelligence platform to persist conversations.
          </li>
          <li>
            <strong>An Intelligence runtime.</strong> Without one, the runtime
            still answers the read-only thread routes from the in-memory
            runner&apos;s local-dev fallback, but mutations return 422 and{" "}
            <code>/info</code> omits <code>licenseStatus</code> entirely.
          </li>
          <li>
            <strong>A license token.</strong>{" "}
            <code>&lt;CopilotThreadsDrawer&gt;</code> requires a status of{" "}
            <code>valid</code> or <code>expiring</code> and passes{" "}
            <code>enabled: licensed</code> into <code>useThreads</code>, so an
            unlicensed drawer never touches the network. The headless hook is
            not gated this way.
          </li>
        </ol>

        <div className="mt-4">
          <KeyValue
            rows={[
              [
                "COPILOTKIT_LICENSE_TOKEN",
                <>
                  EdDSA-signed JWT, verified <em>offline</em> against a public
                  key bundled in <code>@copilotkit/license-verifier</code>. No
                  login, no network call.
                </>,
              ],
              [
                "INTELLIGENCE_API_KEY",
                <>
                  Project key (<code>cpk-1476_…</code>) for the managed thread
                  store — this is what actually persists threads.
                </>,
              ],
              ["INTELLIGENCE_API_URL", "Managed Intelligence REST endpoint."],
              [
                "INTELLIGENCE_GATEWAY_WS_URL",
                "Managed realtime endpoint, on a different host from the REST one.",
              ],
            ]}
          />
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          All four were copied into <code>frontend/.env.local</code> from{" "}
          <code>1cli-testing/copilotkit-cli/npm-cli/.env</code>, which{" "}
          <code>copilotkit init</code> wrote for project 1476. Threads created
          here therefore land in the same Intelligence project as that CLI app.
        </p>
      </Panel>

      <Panel
        title="The two files that make it work"
        description="Both are additions. The documented runtime route and the root provider are untouched."
      >
        <SourceCodeGroup
          files={[
            {
              file: "frontend/src/app/api/copilotkit-threads/[[...slug]]/route.ts",
            },
            { file: "frontend/src/components/threads-provider.tsx" },
          ]}
        />
      </Panel>

      <Callout tone="warn" title="Shared identity">
        <code>identifyUser</code> returns a fixed <code>demo-user</code>, so
        every browser sees one shared thread list — convenient for manual QA,
        but not what a real deployment does. Send an{" "}
        <code>x-copilotkit-user-id</code> header to confirm two users get two
        separate lists. See{" "}
        <Link
          href="/threads/lifecycle"
          className="text-[var(--accent)] underline underline-offset-4"
        >
          Lifecycle
        </Link>{" "}
        for the doc&apos;s own treatment of this.
      </Callout>

      <Callout tone="warn" title="License expiry">
        The token in use is a <code>free</code>-tier license that expires{" "}
        <code>2026-09-12</code>, with limits of 200 persisted threads and 72
        hours of retention. Past expiry the status flips to{" "}
        <code>expiring</code> during the grace period and then locks the drawer.
      </Callout>

      <Callout tone="warn" title="Not covered">
        The doc&apos;s fourth threads page,{" "}
        <a
          href="https://docs.copilotkit.ai/ms-agent-python/threads-import"
          target="_blank"
          rel="noreferrer"
          className="text-[var(--accent)] underline underline-offset-4"
        >
          Import &amp; Synchronize Thread History
        </a>
        , is about migrating existing LangGraph or ADK conversations into the
        platform store. There is nothing to migrate from here, so it is left
        out rather than mocked.
      </Callout>
    </>
  );
}
