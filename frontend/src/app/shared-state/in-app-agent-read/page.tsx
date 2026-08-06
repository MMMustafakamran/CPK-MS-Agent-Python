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

      <Callout tone="warn" title="`initialState` does not exist on useAgent">
        Both Shared State pages seed the starting value with{" "}
        <code>useAgent({"{ agentId, initialState }"})</code>. In{" "}
        <code>@copilotkit/react-core</code> 1.66.2 there is no{" "}
        <code>initialState</code> prop on <code>useAgent</code> — passing it is a
        type error. This repo seeds the value on the server instead, with{" "}
        <code>default_state</code> on{" "}
        <code>add_agent_framework_fastapi_endpoint</code>, which is a real
        parameter of that function. The read page also shows a{" "}
        <code>render</code> prop on <code>useAgent</code>, which likewise is not
        in the shipped type.
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
