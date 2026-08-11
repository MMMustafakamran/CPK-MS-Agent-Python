"use client";

import { CopilotChat } from "@copilotkit/react-core/v2";

/**
 * The client half of the Authentication demo.
 *
 * Auth state is resolved on the server (the browser cannot reach the agent), so
 * it arrives as props. What this component adds is the part you can actually
 * exercise: a chat whose success or failure *is* the test.
 *
 * `tokenConfigured` is read from a NEXT_PUBLIC_ variable, which Next inlines at
 * build time, so it reflects what the provider is really forwarding rather than
 * what the server merely expects.
 *
 * Failures are logged by the provider-level `onError` in `components/providers.tsx`
 * rather than a chat-scoped one: `onError` on `CopilotChat` resolves to the DOM
 * handler here, not CopilotKit's.
 */
export function AuthDemoChat({
  authRequired,
  tokenConfigured,
}: {
  authRequired: boolean;
  tokenConfigured: boolean;
}) {
  // [1] authentication: provider chat
  // [!code highlight]
  // The four combinations of "server demands a token" and "provider sends one".
  const verdict = authRequired
    ? tokenConfigured
      ? {
          tone: "ok" as const,
          title: "Protected — token forwarded",
          detail:
            "The agent requires a bearer token and the provider is sending one. Messages should stream normally; a 401 here means the two tokens do not match.",
        }
      : {
          tone: "bad" as const,
          title: "Protected — no token forwarded",
          detail:
            "The agent requires a bearer token but the provider has none to send. Every message should fail. That failure is the demo: it proves the middleware is enforcing.",
        }
    : tokenConfigured
      ? {
          tone: "warn" as const,
          title: "Open — token forwarded but ignored",
          detail:
            "The provider is sending a token, but the agent is not checking one. Messages stream normally. Set AUTH_BEARER_TOKEN on the backend to start enforcing.",
        }
      : {
          tone: "warn" as const,
          title: "Open — no auth in effect",
          detail:
            "Neither side is configured, so the endpoints are unauthenticated. Messages stream normally. This is the repo default.",
        };

  const toneClass = {
    ok: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
    warn: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    bad: "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
  }[verdict.tone];

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-2">
      <div className="min-h-0 space-y-4 overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r dark:border-slate-800">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Current configuration
          </h2>
          <dl className="mt-2 grid grid-cols-[minmax(0,14rem)_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-500">Agent requires a token</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">
              {authRequired ? "Yes" : "No"}
              <span className="ml-2 font-normal text-xs text-slate-500">
                AUTH_BEARER_TOKEN
              </span>
            </dd>
            <dt className="text-slate-500">Provider sends a token</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">
              {tokenConfigured ? "Yes" : "No"}
              <span className="ml-2 font-normal text-xs text-slate-500">
                NEXT_PUBLIC_AUTH_BEARER_TOKEN
              </span>
            </dd>
          </dl>
        </div>

        <div className={`rounded-lg border px-4 py-3 text-sm ${toneClass}`}>
          <p className="font-semibold">{verdict.title}</p>
          <p className="mt-1">{verdict.detail}</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Prove it either way
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-700 dark:text-slate-300">
            <li>Send a message now and note whether it streams.</li>
            <li>
              Set <code>AUTH_BEARER_TOKEN</code> in <code>backend/.env</code>{" "}
              and restart the agent, leaving the frontend token unset.
            </li>
            <li>
              Send again — it should fail. The runtime never reaches the agent.
            </li>
            <li>
              Add a matching <code>NEXT_PUBLIC_AUTH_BEARER_TOKEN</code> in{" "}
              <code>frontend/.env.local</code>, restart the app, and send once
              more. It should stream again.
            </li>
          </ol>
        </div>
      </div>

      <div className="min-h-0">
        <CopilotChat
          agentId="my_agent"
          labels={{
            welcomeMessageText: authRequired
              ? "Auth is on. Whether this replies tells you if your token is accepted."
              : "Auth is off. This should reply normally — the baseline before you enable it.",
          }}
        />
      </div>
    </div>
  );
}
