import { RouteHeader } from "@/components/route-header";
import { SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/threads/headless" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The same thread data as the drawer, with none of its UI. The doc walks
          four steps and the demo does all four on one screen: a hand-rolled{" "}
          <code>ThreadSidebar</code> over <code>useThreads</code>, rename /
          archive / delete, thread switching by passing <code>threadId</code> to{" "}
          <code>&lt;CopilotChat&gt;</code>, and cursor pagination.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The structural difference from the drawer route is that there is no{" "}
          <code>CopilotChatConfigurationProvider</code> — the active thread
          lives in this page&apos;s own <code>useState</code>, which is exactly
          the wiring the drawer exists to remove.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Can you tell me a joke?"]}
            expect="A row appears. Rename it and the new name sticks through a reload. Archive it and it disappears until you tick Archived."
            fail="Rows list but mutations error — mutations need the Intelligence runtime, unlike the read-only routes."
          />
        </div>
      </Panel>

      <Panel
        title="The demo and the runtime options behind it"
        description="Step 1 of the doc is server-side; steps 2-4 are the sidebar."
      >
        <SourceCodeGroup
          files={[
            { file: "frontend/src/app/threads/headless/demo-chat/page.tsx" },
            {
              file: "frontend/src/app/api/copilotkit-threads/[[...slug]]/route.ts",
            },
          ]}
          note={
            <>
              <code>generateThreadNames</code> is spelled out at its default so
              the flag is visible; the three lock options are listed commented,
              also at their defaults.
            </>
          }
        />
      </Panel>

      <Callout tone="warn" title="Archive is a soft delete, delete is not">
        <code>archiveThread</code> hides a thread from the default list and is
        reversible with <code>unarchiveThread</code>. <code>deleteThread</code>{" "}
        is permanent. Neither ships a confirmation dialog — the doc says to add
        your own, so the demo puts a <code>window.confirm</code> on delete only.
      </Callout>

      <Callout tone="warn" title="Keying the chat">
        <code>&lt;CopilotChat&gt;</code> is keyed on the active id here.
        Auto-minted ids are memoized for the component&apos;s lifetime, so
        clearing the selection back to <code>undefined</code> would otherwise
        leave the previous transcript on screen. This is the practical edge of
        the remount caveat on the{" "}
        <a
          href="/threads/lifecycle"
          className="text-[var(--accent)] underline underline-offset-4"
        >
          lifecycle page
        </a>
        .
      </Callout>
    </>
  );
}
