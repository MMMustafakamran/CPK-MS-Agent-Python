import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/readables" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Telling the agent what is going on in your app — the current user, the
          open record, the visible page — without stuffing it into a chat
          message. <code>useAgentContext</code> registers a description and a
          value, and CopilotKit forwards them on every run.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The context is delivered in the AG-UI <code>RunAgentInput</code>, as{" "}
          <code>RunAgentInput.Context</code> entries carrying a description and
          a value. The .NET sample adds middleware to recover the request with{" "}
          <code>TryGetRunAgentInput</code> and fold that into a system message;
          the Python sample does not, because the Python AG-UI integration
          already surfaces it to the agent.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Until 2026-08-30 the guide located this at{" "}
          <code>ChatOptions.AdditionalProperties[&quot;ag_ui_context&quot;]</code>,
          and this page repeated it. The drift retracted that: the new wording
          is that <code>TryGetRunAgentInput</code> &ldquo;recovers the request
          without depending on hosting-layer keys&rdquo;. Nothing changed for
          the Python path either way, which is why this route kept passing
          across the correction — the claim it restated was never one it
          exercised.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Who are my colleagues?", "What is Jane Smith's role?"]}
            expect="The agent answers from the list on the left, which it was never told in a message."
            fail="The agent says it has no information about your colleagues — the context is not reaching the run."
          />
        </div>
      </Panel>

      <Callout tone="info" title="Nothing to add on the backend">
        The doc&apos;s Python sample for this page is a plain agent with no
        tools and no extra configuration — the comment in it literally reads
        &ldquo;frontend context is forwarded automatically&rdquo;. This route
        therefore adds nothing to <code>backend/agents.py</code>; it reuses{" "}
        <code>sample_agent</code> as-is.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/readables/demo-chat/page.tsx" />
      </Panel>
    </>
  );
}
