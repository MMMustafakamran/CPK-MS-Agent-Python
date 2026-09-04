import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/in-app-agent-write" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The other direction: the app writing into agent state.{" "}
          <code>agent.setState</code> updates the value and re-renders anything
          reading it, and the agent sees the new state on its next run.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Press Toggle Language, then ask: what language are you using?",
              "Press Toggle + re-run agent",
            ]}
            expect="Toggle flips the value immediately in the panel; the agent acknowledges it on the next message you send. Toggle + re-run makes the agent respond straight away without you typing."
            fail="The panel value changes but the agent never acknowledges it — the state is not reaching the run."
          />
        </div>
      </Panel>

      <Callout tone="info" title="`setState` replaces — the doc now spreads">
        The page used to publish{" "}
        <code>agent.setState({"{ language: … }"})</code>. It now publishes{" "}
        <code>agent.setState({"{ ...(agent.state ?? {}), language: … }"})</code>
        . That is a correction, not a style change:{" "}
        <code>setState</code> assigns the whole state object, so the old form
        dropped every other key the agent was carrying. A one-key schema never
        showed it; the State Rendering agent&apos;s would have.
      </Callout>

      <Callout tone="warn" title="The fix landed in one snippet and not its sibling">
        <p>
          The correction above only reached the <em>Implementation</em> step.
          Further down, &ldquo;Re-run the agent with a hint about what&apos;s
          changed&rdquo; still publishes{" "}
          <code>agent.setState({"{ language: newLanguage }"})</code> — no
          spread — and reads <code>agent.state.language</code> rather than the
          guarded <code>state</code> const the same page builds. One page, two
          snippets, two different answers to the same question.
        </p>
        <p className="mt-2">
          The un-spread one is the worse place for it: it is the snippet that
          calls <code>runAgent()</code>, so the wiped keys reach the agent
          immediately rather than waiting for some later turn.
        </p>
        <p className="mt-2">
          Both buttons in the demo are as published — <strong>Toggle</strong>{" "}
          spreads, <strong>Toggle + re-run</strong> does not.
        </p>
      </Callout>

      <Callout tone="info" title="Seeding moved into an effect">
        The starting value used to come from an <code>initialState</code> prop
        the hook does not accept. The page now seeds after connect —{" "}
        <code>isReady</code>, then <code>setState</code> if the key is still
        missing. <code>default_state</code> on the endpoint stays, because the
        client seed only covers the first paint and does not survive a re-run.
      </Callout>

      <Callout tone="info" title="Set state, then decide when the agent reacts">
        <code>setState</code> alone is passive — the new value waits for the next
        run. When a UI change should provoke the agent immediately, the doc&apos;s
        pattern is to add a short hint message describing what changed and then
        call <code>copilotkit.runAgent()</code>. Both buttons in the demo exist
        to make that difference visible.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/shared-state/in-app-agent-write/demo-chat/page.tsx" />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The agent, schema, and <code>update_language</code> tool are the same
          ones shown on the{" "}
          <a
            href="/shared-state/in-app-agent-read"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            reading route
          </a>{" "}
          — the two doc pages share one backend sample.
        </p>
      </Panel>
    </>
  );
}
