import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/state-rendering" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Tool rendering shows you a tool <em>call</em>. State rendering shows
          you the agent&apos;s accumulated <em>state</em> — a list that grows
          across turns rather than a single event. Here that is a set of searches,
          each with a <code>query</code> and a <code>done</code> flag.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The mechanism is <code>predict_state_config</code>. It maps a tool
          argument onto a state key, so when the model calls{" "}
          <code>update_searches</code> the <code>searches</code> argument is
          streamed into <code>agent.state.searches</code> as the arguments
          arrive — the UI updates before the tool has even returned.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Search for the tallest mountains",
              "Now also search for the deepest oceans",
            ]}
            expect="A checked item appears in the list on the left as the tool call streams, and the second prompt adds a second item while keeping the first."
            fail="The list stays empty while the chat replies normally — the state schema and the tool argument name are not lining up."
          />
        </div>
      </Panel>

      <Callout tone="info" title="Why this route uses a different agent">
        <code>state_schema</code> belongs to the agent it is attached to, and
        the docs define two different schemas — <code>searches</code> here,{" "}
        <code>language</code> on the Shared State pages. This repo runs both as
        separate agents (<code>search_agent</code> and{" "}
        <code>sample_agent</code>) rather than inventing a merged schema that
        appears in neither doc.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/generative-ui/state-rendering/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The agent, schema, and tool"
        description="The state schema, the predict-state mapping, and the tool are all lifted from the doc's Python sample."
      >
        <SourceCodeGroup
          files={[{ file: "backend/agents.py", region: "update-searches" }]}
          note={
            <>
              The instructions on <code>search_agent</code> matter more than
              usual here: they tell the model to always send the{" "}
              <em>full</em> list on every call. Partial updates would overwrite
              state with a shorter list, so the doc spells that rule out and this
              repo keeps it verbatim.
            </>
          }
        />
      </Panel>
    </>
  );
}
