import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/frontend-tools" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Tools the agent calls that execute in the user&apos;s browser rather
          than in the agent process. The handler runs client-side, so it can
          touch React state, browser APIs, and anything else only the frontend
          has access to — then returns a string the model reads as the tool
          result.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Say hello to Damien"]}
            expect="A browser alert appears saying 'Hello, Damien!', and after you dismiss it the agent confirms it said hello."
            fail="The agent replies in text without an alert — the tool was not forwarded, so check that the demo route is the page you are on."
          />
        </div>
      </Panel>

      <Callout tone="info" title="The Python stub is optional here">
        The doc shows the AG-UI server alongside this, but note what it{" "}
        <em>doesn&apos;t</em> do: it never declares <code>sayHello</code>. Tools
        registered with <code>useFrontendTool</code> are forwarded to the agent
        automatically in the AG-UI run input, so no backend change is required.
        That is why this repo registers the tool on the page that uses it rather
        than globally — if the route is not mounted, the tool is not offered, and
        the agent cannot call something with no handler.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/frontend-tools/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The agent it talks to"
        description="Unchanged from the Quickstart — no tool registration was added for this route."
      >
        <SourceCodeGroup files={[{ file: "backend/chat_client.py" }]} />
      </Panel>
    </>
  );
}
