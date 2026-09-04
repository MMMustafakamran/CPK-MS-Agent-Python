import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/in-app-agent-read" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Agent state is not confined to the chat. <code>agent.state</code> is
          reactive, so any component can read it and re-render when the agent
          changes it — here a language preference shown next to the conversation
          rather than inside it.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The link between the tool and the state is{" "}
          <code>predict_state_config</code> on the server: it maps the{" "}
          <code>language</code> argument of <code>update_language</code> onto the{" "}
          <code>language</code> state key. The frontend never parses a message to
          learn the value.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Switch to Spanish", "Change it back to English"]}
            expect="The Language line updates as the tool call streams, and the raw state block shows the new value."
            fail="The agent confirms the change in text but the panel stays on 'english' — the state key and the tool argument are not lining up."
          />
        </div>
      </Panel>

      <Callout tone="info" title="Fixed upstream: `initialState` and `render` are gone">
        Both Shared State pages used to seed with{" "}
        <code>useAgent({"{ agentId, initialState }"})</code>, and this one also
        showed a <code>render</code> prop. Neither has ever been on{" "}
        <code>useAgent</code> in <code>@copilotkit/react-core</code> 1.69.2, so
        both were type errors. The pages now seed in a <code>useEffect</code>{" "}
        gated on <code>isReady</code>, which the hook does return, and the demo
        runs that snippet as published. <code>default_state</code> on{" "}
        <code>add_agent_framework_fastapi_endpoint</code> stays: the client seed
        covers the first paint, the server one survives a re-run.
      </Callout>

      <Callout tone="warn" title="`isReady` does not mean the state has loaded">
        The published seed writes <code>english</code> whenever{" "}
        <code>state.language</code> is still undefined at the moment{" "}
        <code>isReady</code> flips true. But <code>isReady</code> only reports
        that the runtime <code>/info</code> sync resolved — it says nothing
        about whether a state snapshot has arrived. On these routes the endpoint
        supplies <code>default_state</code>, so the two agree and the seed is
        harmless; on a persisted thread holding <code>spanish</code>, the same
        snippet races the replay and the docs offer no guard.
      </Callout>

      <Callout tone="warn" title="The render sample is named after the component it would replace">
        &ldquo;Rendering agent state in your app&rdquo; reuses the component
        name <code>YourMainContent</code> from the step above — the component
        that draws the entire left pane — but its body is{" "}
        <code>if (!state.language) return null;</code> followed by a single{" "}
        <code>div</code>. Take the page at its word and your main content is
        replaced by one line that vanishes whenever state is empty. The old{" "}
        <code>render</code> prop failed to compile; this one compiles and
        deletes your UI.
        <br />
        <br />
        It is implemented verbatim, under its published name, and rendered in
        the dashed box on the demo — small, so the route survives it, and live,
        so you can watch it return nothing before the seed lands.
      </Callout>

      <Callout tone="warn" title="The snippet builds a guarded `state` and then ignores it">
        The step&apos;s snippet computes{" "}
        <code>const state = (agent.state ?? {"{}"}) as Partial&lt;AgentState&gt;</code>
        , uses it in the effect, and then renders{" "}
        <code>&lt;p&gt;Language: {"{agent.state?.language}"}&lt;/p&gt;</code> —
        back to the raw object on the one line that is highlighted. The guarded
        const exists only to feed the effect&apos;s dependency array. Harmless
        here, since the optional chaining covers it, but the page is
        demonstrating a defensive pattern it does not follow itself.
      </Callout>

      <Callout tone="warn" title="The same line is written two different ways across the guides">
        This page publishes <code>{"{agent.state?.language}"}</code>, and so
        does the Mastra version. The AG2 version of the identical snippet
        publishes <code>{"{agent.state.language}"}</code>, without the optional
        chaining — the one character that decides whether the page survives an
        undefined state. Nothing says which is intended. Each repo here
        reproduces its own page&apos;s spelling, so the divergence stays visible
        rather than being normalised away.
      </Callout>

      <Callout tone="warn" title="Rendering state inside the chat is no longer documented">
        The section was retitled from &ldquo;Rendering agent state in the
        chat&rdquo; to &ldquo;in your app&rdquo;, and the in-chat option went
        with the title. Nothing on the page now says how to put state into the
        conversation, and no replacement page is linked.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/shared-state/in-app-agent-read/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The agent, schema, and tool"
        description="Lifted from the doc's Python sample — the schema, the predict-state mapping, and the tool."
      >
        <SourceCodeGroup
          files={[{ file: "backend/agents.py", region: "update-language" }]}
        />
      </Panel>
    </>
  );
}
