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
          a value. Both samples now fold that into a system message themselves —
          .NET with <code>TryGetRunAgentInput</code> middleware, Python with the{" "}
          <code>ContextAwareAgent</code> subclass this route runs.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Who are my colleagues?", "What is Jane Smith's role?"]}
            expect="The agent answers from the list on the left, which it was never told in a message."
            fail="The agent says it has no information about your colleagues — the context is not reaching the run. That is what the pre-2026-09-04 sample did on every run."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="The page reversed itself, and the old version could not have worked">
        <p>
          Until this sync the Python sample was a plain agent whose only comment
          read &ldquo;frontend context is forwarded automatically&rdquo;, and
          this route reused <code>sample_agent</code> unchanged on that basis.
          The page now publishes a <code>ContextAwareAgent</code> that builds a
          system message out of <code>input_data[&quot;context&quot;]</code> by
          hand, and the lead-in changed to &ldquo;Use middleware to read it and
          inject it into the agent&apos;s conversation.&rdquo;
        </p>
        <p className="mt-2">
          The shipped source settles which version is right. In{" "}
          <code>agent_framework_ag_ui._agent_run.run_agent_stream</code>,{" "}
          <code>input_data[&quot;context&quot;]</code> is read in exactly one
          place — <code>build_ag_ui_context_slice(...)</code>, inside the branch
          guarded by the A2UI injection flag. A run without{" "}
          <code>injectA2UITool</code> never turns the forwarded context into
          anything the model sees. The old sample was the defect, and it was the
          silent kind: no error, no warning, just an agent answering from
          general knowledge instead of from your data.
        </p>
        <p className="mt-2">
          This route now runs the published subclass on its own endpoint,{" "}
          <code>/context_agent</code>.
        </p>
      </Callout>

      <Callout tone="warn" title="One page migrated to the new import path; seven did not">
        This is the only Python sample in the set that imports from{" "}
        <code>agent_framework_ag_ui</code> and annotates the client as{" "}
        <code>BaseChatClient</code>. Quickstart, Auth, Frontend Tools, Tool
        Rendering, State Rendering and both Shared State pages still publish{" "}
        <code>agent_framework.ag_ui</code> and{" "}
        <code>SupportsChatGetResponse</code>. Both resolve to the same class
        today — <code>agent_framework.ag_ui</code> is a lazy shim over the
        package — so the split is cosmetic until it is not. Nothing in the docs
        says which is preferred, or that they are the same thing.{" "}
        <code>backend/agents.py</code> asserts the two are identical at import,
        so a release that splits them fails loudly here.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/readables/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The agent the page now publishes"
        description="ContextAwareAgent and its helper, verbatim apart from the factory name."
      >
        <SourceCode file="backend/agents.py" region="context-agent" />
      </Panel>
    </>
  );
}
