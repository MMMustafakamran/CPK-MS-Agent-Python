import { RouteHeader } from "@/components/route-header";
import { SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/threads/lifecycle" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Mint → run → hydrate → switch, made observable. The panel reports the
          live <code>threadId</code> and, more usefully,{" "}
          <code>hasExplicitThreadId</code> — the flag that decides whether
          mounting replays history or shows a welcome screen.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Can you tell me a joke?"]}
            expect="hasExplicitThreadId is false on a fresh chat and flips to true when you open a known conversation, whose transcript replays into the view."
            fail="Clicking a conversation changes the id but the transcript stays empty — replay needs a server-side store, so check /threads first."
          />
        </div>
      </Panel>

      <Panel title="The demo">
        <SourceCodeGroup
          files={[
            { file: "frontend/src/app/threads/lifecycle/demo-chat/page.tsx" },
            {
              file: "frontend/src/app/api/copilotkit-threads/[[...slug]]/route.ts",
            },
          ]}
          note={
            <>
              The runtime file is here for <code>identifyUser</code>, the
              contract the doc&apos;s &ldquo;scope Rich Threads to the signed-in
              user&rdquo; section describes. Ours is static, which the doc calls
              single-user-demo only.
            </>
          }
        />
      </Panel>

      <Panel title="Pick one source of truth">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <code>setActiveThreadId</code> and <code>startNewThread</code> both
          no-op with a console warning when the <code>threadId</code> is
          prop-controlled. This demo therefore passes no <code>threadId</code>{" "}
          prop at all — the opposite choice from the{" "}
          <a
            href="/threads/headless"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            headless route
          </a>
          , which drives the prop and never calls the setters. Mixing them is
          the failure this pairing is meant to make obvious.
        </p>
      </Panel>

      <Callout tone="warn" title="Auto-minted ids re-mint on remount">
        The fallback id comes from <code>useMemo</code>, so a changed React{" "}
        <code>key</code>, a parent remount, or StrictMode&apos;s double-mount in
        dev produces a new id and silently starts a new conversation. Mint it
        yourself if it has to survive.
      </Callout>

      <Callout tone="warn" title="Not implemented here">
        The doc&apos;s &ldquo;create a thread with your own API on the first
        message&rdquo; section needs a backend that mints thread rows, which
        this harness does not have. The headless variant it recommends —
        composing <code>CopilotChatInput</code> and setting{" "}
        <code>agent.threadId</code> before an imperative send — is left
        unimplemented rather than faked.
      </Callout>
    </>
  );
}
