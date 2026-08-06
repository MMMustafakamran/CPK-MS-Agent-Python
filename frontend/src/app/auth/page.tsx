import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, CodeBlock, Panel } from "@/components/ui";
import { getHealth } from "@/lib/health";

const FRONTEND_SNIPPET = `<CopilotKit
  runtimeUrl="/api/copilotkit"
  headers={{
    Authorization: \`Bearer \${userToken}\`,
  }}
>
  <YourApp />
</CopilotKit>`;

const ENABLE_SNIPPET = `# backend/.env — turns the middleware on
AUTH_BEARER_TOKEN=super-secret-demo-token

# frontend/.env.local — the token the provider forwards
NEXT_PUBLIC_AUTH_BEARER_TOKEN=super-secret-demo-token`;

export default async function Page() {
  const { authRequired } = await getHealth();

  return (
    <>
      <RouteHeader path="/auth" />

      {authRequired ? (
        <Callout tone="success" title="Auth is currently enabled">
          <code>AUTH_BEARER_TOKEN</code> is set on the agent, so the AG-UI
          endpoints reject requests without a matching bearer token. If chats
          across the app are failing, the provider is not forwarding a token
          that matches.
        </Callout>
      ) : (
        <Callout tone="warn" title="Auth is currently disabled">
          <code>AUTH_BEARER_TOKEN</code> is not set, so the middleware passes
          every request through and the agent endpoints are open. That is the
          default for this repo — see below for how to switch it on.
        </Callout>
      )}

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Forwarding a user&apos;s identity from the browser to the agent. The
          provider attaches an <code>Authorization</code> header, the runtime
          passes it through, and the AG-UI server validates it before the agent
          runs.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Auth is a property of the provider and the server rather than of one
          page, so turning it on changes every route at once and needs both
          processes restarted. The demo reports the live state of both sides and
          gives you a chat to send through it — whether that chat succeeds or
          fails <em>is</em> the test.
        </p>
      </Panel>

      <Panel title="Frontend — forwarding the token">
        <CodeBlock filename="The doc's sample" language="tsx" code={FRONTEND_SNIPPET} />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          This repo does the same thing on <code>CopilotKitProvider</code>, and
          only when a token is configured, so the app still runs unauthenticated
          out of the box:
        </p>
        <div className="mt-3">
          <SourceCode file="frontend/src/components/providers.tsx" />
        </div>
      </Panel>

      <Panel
        title="Backend — validating the token"
        description="The doc's Python middleware, extended to cover all three agent endpoints instead of just one."
      >
        <SourceCodeGroup
          files={[{ file: "backend/main.py", region: "auth-middleware" }]}
        />
      </Panel>

      <Panel title="The demo page">
        <SourceCode file="frontend/src/app/auth/demo-chat/auth-demo-chat.tsx" />
      </Panel>

      <Panel title="Turning it on">
        <CodeBlock filename="Environment" language="bash" code={ENABLE_SNIPPET} />
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          Restart both processes afterwards. With only the backend variable set,
          every chat in the app will start failing with a 401 — which is a
          reasonable way to confirm the middleware is actually running.
        </p>
      </Panel>

      <Callout tone="warn" title="Shared secrets are for demos only">
        Comparing a token against one environment variable is what the doc
        itself calls a local-demo pattern, and this repo follows it for that
        reason. Production wants real OAuth 2.0 / OIDC JWT validation, or an API
        gateway that validates before requests reach the AG-UI server.
      </Callout>
    </>
  );
}
