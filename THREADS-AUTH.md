# THREADS-AUTH.md — adding Rich Threads authentication to an existing test repo

**Read this before changing anything. Follow it in order.**

You have a CopilotKit test harness for some framework — `agno`, `mastra`,
`langgraph`, `ms-agent-dotnet`, anything — that was hand-built rather than
scaffolded by `npx copilotkit@latest init`. Its Rich Threads pages cannot work,
because threads are not stored by your agent or your runtime: they live in
CopilotKit's managed Enterprise Intelligence platform, and reaching it needs
credentials your repo does not have.

This file is the procedure for borrowing those credentials from a CLI-scaffolded
project and wiring them into an existing repo, verified end to end on
`CPK-MS-Agent-Python`.

---

## The one thing to understand first

**None of this is framework-specific.** Thread storage, the license check, and
the thread REST routes all live in the Next.js frontend and its runtime route.
Your agent backend — Python, Node, .NET, whatever — is not involved and does not
change. An `agno` repo and a `mastra` repo do the identical work here.

What *does* change per repo is small and listed in [Step 6](#step-6--the-parts-that-differ-per-framework).

---

## Definition of done

```bash
curl -s localhost:3000/api/copilotkit-threads/info | jq '{mode, licenseStatus, threadEndpoints}'
```

must print:

```json
{
  "mode": "intelligence",
  "licenseStatus": "valid",
  "threadEndpoints": { "list": true, "inspect": true, "mutations": true, "realtimeMetadata": true }
}
```

and

```bash
curl -s "localhost:3000/api/copilotkit-threads/threads?agentId=default" | jq '.threads | length'
```

must return a number, not a 422. Anything less and threads are not authenticated —
do not describe the wiring as done because the files look right.

---

## Why three separate things have to be true

Most of the time lost on this goes to assuming it is only about credentials. It
is not. Three independent gates sit in front of Rich Threads, and each fails
differently:

| # | Gate | Symptom when it fails |
|---|---|---|
| 1 | **Multi-route transport** | `GET /api/copilotkit/threads` → `404`. No thread route exists at all. |
| 2 | **An Intelligence runtime** | Thread routes answer, but mutations → `422 Missing CopilotKitIntelligence configuration`, and `/info` has no `licenseStatus`. |
| 3 | **A valid license token** | Everything answers, but `<CopilotThreadsDrawer>` renders a locked panel and never issues a network call. |

**Gate 1 is the one no doc page mentions.** The runtime helper every Quickstart
shows — `copilotRuntimeNextJSAppRouterEndpoint` — delegates to
`createCopilotEndpointSingleRoute`, and single-route mode dispatches with
`threadEndpointsEnabled: false` hardcoded. Thread routes exist *only* in
multi-route mode. That needs a `[[...slug]]` catch-all route file **and**
`useSingleEndpoint={false}` on the provider, and no doc sample shows either.

Verify it yourself in your repo's own `node_modules` rather than trusting this:

```bash
grep -n "threadEndpointsEnabled" \
  frontend/node_modules/@copilotkit/runtime/dist/v2/runtime/core/fetch-handler.mjs
```

Two hits, `false` for single-route and `true` for multi-route. This held
identically in 1.65.0 and 1.68.2.

Gate 3 is worth knowing precisely, because it decides how much you can test
without paying. `<CopilotThreadsDrawer>` requires
`status === "valid" || status === "expiring"` and passes `enabled: licensed`
into `useThreads`, so an unlicensed drawer never touches the network. But
`/info` only reports `licenseStatus` when the runtime was built with a
`CopilotKitIntelligence` instance. **The headless `useThreads` hook is not gated
this way** — see [Step 7](#step-7--what-works-with-no-license-at-all).

---

## Step 1 — Get a CLI project to borrow from

If you already have one (in this repo it is `1cli-testing/copilotkit-cli/npm-cli`),
skip to Step 2. Otherwise, scaffold one in a scratch directory:

```bash
cd /some/scratch/dir
npx copilotkit@latest init
```

It opens a browser for sign-in and asks you to create or select an Enterprise
Intelligence project. The free Developer tier is enough: 200 persisted threads,
72-hour retention.

The CLI writes two things:

- `.copilotkit/project.json` — project id, slug, org id. Bookkeeping; you do not
  need it. Usually gitignored.
- `.env` — the four values you actually want.

> One scaffolded project is enough for **all** your framework repos. They can
> share one Intelligence project — threads are partitioned by `agentId` and by
> whatever `identifyUser` returns, not by which repo made the call. Just know
> that they land in one bucket, so give each repo a distinct `agentId` or user
> id if you want them separated.

---

## Step 2 — Copy the four credentials

From the CLI project's `.env` into your repo's **`frontend/.env.local`**:

```bash
INTELLIGENCE_API_URL=https://api.intelligence.copilotkit.ai
INTELLIGENCE_GATEWAY_WS_URL=wss://realtime.intelligence.copilotkit.ai
INTELLIGENCE_API_KEY=cpk-<project>_<...>
COPILOTKIT_LICENSE_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkxJQyI...
```

What each one is:

| Variable | What it does |
|---|---|
| `COPILOTKIT_LICENSE_TOKEN` | EdDSA-signed JWT. Verified **offline** against a public key bundled in `@copilotkit/license-verifier` — no login, no network call, works on a plane. Its expiry is what eventually locks the drawer. |
| `INTELLIGENCE_API_KEY` | Project key for the managed thread store. This is the one that actually persists threads. |
| `INTELLIGENCE_API_URL` | Managed REST endpoint. |
| `INTELLIGENCE_GATEWAY_WS_URL` | Managed realtime endpoint. A **different host** from the REST one — override both or neither, or the two planes point at different deployments. |

Three warnings:

- **`frontend/.env.local`, not the repo root.** Next.js does not read a
  root-level `.env`. This trips people whose backend key lives at the root.
- **Server-side only.** None of these get a `NEXT_PUBLIC_` prefix. The license
  token is read by the runtime and its *status* is reported to the browser via
  `/info`; the token itself must never ship to the client.
- **Confirm `.env.local` is gitignored** before you paste a real key:
  `git check-ignore -v frontend/.env.local` should print a matching rule.

---

## Step 3 — Verify the license offline, before writing any code

Do this first. It is ten seconds and it tells you whether the rest is worth
doing. Run from your repo's `frontend/` so the package resolves:

```bash
cd frontend
cat > lic-check.mjs <<'EOF'
import fs from "node:fs";
import { createLicenseChecker } from "@copilotkit/license-verifier";
const tok = /^COPILOTKIT_LICENSE_TOKEN=(.*)$/m.exec(fs.readFileSync(".env.local", "utf8"))[1].trim();
const s = createLicenseChecker(tok).getStatus();
console.log("valid:", s.valid, "| error:", s.error, "| severity:", s.warningSeverity);
console.log("expires:", s.license?.expires_at, "| tier:", s.license?.tier);
console.log("features:", s.license?.features);
EOF
node lic-check.mjs && rm lic-check.mjs
```

You want `valid: true`, `error: null`, `severity: none`.

<a id="checkfeature"></a>
**Ignore `checkFeature("threads")` if you try it — it returns `false` on a valid
license.** There is no bare `threads` entry in `LICENSED_FEATURES` (only
`threads.retention_hours` and `threads.max_count`), and nothing in the runtime
calls it: `resolveLicenseStatus` uses `getStatus()` alone. The browser-side
`checkFeature` is a *different* function from `@copilotkit/shared` that returns
`true` unless the status is `expired` or `invalid`. Chasing that `false` is a
dead end.

---

## Step 4 — Add a second runtime endpoint

**Do not convert your existing `/api/copilotkit` route.** Keep it exactly as the
docs write it: it is what your Quickstart and Copilot Runtime pages display and
diff against, and converting it breaks that comparability for one feature. Add a
second endpoint instead.

Create `frontend/src/app/api/copilotkit-threads/[[...slug]]/route.ts`. The
`[[...slug]]` catch-all segment is required — that is Gate 1.

```ts
import {
  CopilotRuntime,
  CopilotKitIntelligence,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { HttpAgent } from "@ag-ui/client";

const AGENT_URL = process.env.MY_AGENT_URL ?? "http://localhost:8000";
const LICENSE_TOKEN = process.env.COPILOTKIT_LICENSE_TOKEN;

const runtime = new CopilotRuntime({
  // `default` matters: <CopilotThreadsDrawer> and useThreads fall back to
  // DEFAULT_AGENT_ID ("default") when given no agentId, and threads are stored
  // per agent id. Register it even if your other route uses different names.
  agents: {
    default: new HttpAgent({ url: `${AGENT_URL}/` }),
    // ...plus whatever ids your framework's agents use
  },

  ...(LICENSE_TOKEN
    ? {
        intelligence: new CopilotKitIntelligence({
          apiKey: process.env.INTELLIGENCE_API_KEY ?? "",
          ...(process.env.INTELLIGENCE_API_URL
            ? { apiUrl: process.env.INTELLIGENCE_API_URL }
            : {}),
          ...(process.env.INTELLIGENCE_GATEWAY_WS_URL
            ? { wsUrl: process.env.INTELLIGENCE_GATEWAY_WS_URL }
            : {}),
        }),
        generateThreadNames: true,
        // Threads are stored per user, so the runtime must name one. A static
        // value is demo-only — the docs say so explicitly. Reading a header
        // makes multi-user isolation testable without real auth.
        identifyUser: (request: Request) => {
          const id = request.headers.get("x-copilotkit-user-id") ?? "demo-user";
          return { id, name: id === "demo-user" ? "Demo User" : id };
        },
        licenseToken: LICENSE_TOKEN,
      }
    // No token? Degrade instead of crashing — see Step 7.
    : { runner: new InMemoryAgentRunner() }),
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit-threads",
});

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
```

Two notes on portability:

- **`createCopilotRuntimeHandler` returns a plain `(Request) => Promise<Response>`,
  so no `hono` dependency is needed.** CLI starters use
  `createCopilotEndpoint` + `handle` from `hono/vercel` instead; both work, and
  both have existed since at least 1.65.0. Prefer the plain handler in a repo
  that does not already depend on hono.
- `licenseToken` falls back to `process.env.COPILOTKIT_LICENSE_TOKEN` on its
  own, so passing it explicitly is only for readability.

---

## Step 5 — Add a provider for the threads routes

Create `frontend/src/components/threads-provider.tsx`, and wrap **only** your
threads pages in it. Nesting it inside your app-wide `CopilotKitProvider` is
fine; the inner one wins for its subtree.

```tsx
"use client";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

const AUTH_TOKEN = process.env.NEXT_PUBLIC_AUTH_BEARER_TOKEN; // only if your backend needs one

export function ThreadsProvider({ children }: { children: ReactNode }) {
  return (
    <CopilotKitProvider
      runtimeUrl="/api/copilotkit-threads"
      // Gate 1, client half. Thread routes are dispatched only in multi-route
      // mode, and leaving this on auto-detect races the lazily-compiled API
      // route under `next dev`.
      useSingleEndpoint={false}
      {...(AUTH_TOKEN ? { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } } : {})}
      showDevConsole="auto"
      onError={(e) => console.error(`[CopilotKit ${e.code}]`, e.error)}
    >
      {children}
    </CopilotKitProvider>
  );
}
```

If your backend enforces a bearer token, **forward it here too** — this provider
does not inherit the outer one's `headers`. Forgetting it produces a thread list
that loads fine and an agent that 401s, which reads like a threads problem and
is not.

---

## Step 6 — The parts that differ per framework

Everything above is identical across repos. These are the only lines to adjust:

| What | Where | How to find the right value |
|---|---|---|
| Agent URL env var | `AGENT_URL` in the route | Copy whatever your existing `/api/copilotkit/route.ts` uses (`MS_AGENT_URL`, `AGNO_AGENT_URL`, …). |
| Agent ids and endpoints | `agents: {}` in the route | Mirror your existing route, then **add `default`**. |
| Agent class | `new HttpAgent({ url })` | Frameworks speaking AG-UI natively use `HttpAgent`. If your existing route imports a framework-specific agent class, use that same class here. |
| Bearer header | `ThreadsProvider` | Only if your backend has auth middleware. |
| Backend | — | **Nothing.** Do not touch it. |

Restating the important one: if your existing runtime route binds
`new HttpAgent(...)`, so does this one. If it binds something like
`new LangGraphHttpAgent(...)`, copy that. The Intelligence wiring is orthogonal
to which agent class you use.

---

## Step 7 — What works with no license at all

Worth knowing before you decide you need credentials. With the
`InMemoryAgentRunner` fallback from Step 4 and no token, the runtime still
serves a documented local-dev fallback:

| Route | No license | With license |
|---|---|---|
| `GET /threads` | ✅ from memory | ✅ from platform |
| `GET /threads/:id/messages` | ✅ | ✅ |
| `GET /threads/:id/events` | ✅ | ✅ |
| `GET /threads/:id/state` | ✅ | ✅ |
| `DELETE /threads` (clear all) | ✅ | no-op by design |
| `PATCH /threads/:id` (rename) | ❌ 422 | ✅ |
| archive / unarchive / delete one | ❌ 422 | ✅ |
| `POST /threads/subscribe` (realtime) | ❌ 422 | ✅ |
| `<CopilotThreadsDrawer>` | ❌ locked panel | ✅ |
| `useThreads` (headless) | ✅ list/read only | ✅ full |

So a **Headless Threads** page can be genuinely tested with zero credentials —
list and history replay both work. A **Threads Drawer** page cannot: the drawer
is license-gated regardless of whether its routes answer. Nothing survives a
process restart in the in-memory case.

---

## Step 8 — Verify

Run the two `curl`s from [Definition of done](#definition-of-done) first. Then in
a browser:

1. Send a message on a threads page. A row should appear, auto-named a second or
   two after the reply finishes.
2. **Reload the page.** The row is still there and selecting it replays the
   transcript. This is the only step that proves the platform, not local state.
3. Check user scoping:
   ```bash
   curl -s -H "x-copilotkit-user-id: someone-else" \
     "localhost:3000/api/copilotkit-threads/threads?agentId=default" | jq '.threads | length'
   ```
   Should be `0` while your default user has rows.
4. Confirm you did not break the documented route:
   ```bash
   curl -s -o /dev/null -w "%{http_code}\n" localhost:3000/api/copilotkit/threads
   ```
   `404` is correct and expected. That route is not supposed to serve threads.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `404` on every `/api/copilotkit-threads/*` | Route file is not a `[[...slug]]` catch-all, or `basePath` does not match the URL. | Check the directory is literally named `[[...slug]]`. |
| `422 Missing CopilotKitIntelligence configuration` | No `intelligence` on the runtime — usually `COPILOTKIT_LICENSE_TOKEN` is unset, so the ternary took the in-memory branch. | Confirm the var is in `frontend/.env.local` and restart `next dev`. |
| `/info` has no `licenseStatus` key | Same cause. It is only emitted for an Intelligence runtime. | As above. |
| Drawer renders a locked panel, but `curl` on `/threads` returns rows | Gate 3. Client sees `licenseStatus` absent or `expired`/`invalid`. | Check `/info`; if `valid`, check the provider's `runtimeUrl` points at the threads endpoint. |
| Thread list loads, agent replies 401 | Bearer token not forwarded by `ThreadsProvider`. | Add `headers` — it does not inherit from the outer provider. |
| Empty list on a runtime you know has threads | Wrong `agentId`. Threads are stored per agent id and the default is literally `"default"`. | Register a `default` agent, or pass `agentId` explicitly everywhere. |
| Works on first load, empty after HMR | Transport auto-detect raced the lazily-compiled API route. | `useSingleEndpoint={false}`. |
| `checkFeature("threads")` is `false` on a valid license | Expected. | See [Step 3](#checkfeature). |
| A recording or test run fails "agent never responded" on first hit | `next dev` was still compiling the route. | Warm the route once, then re-run. |

---

## Things worth writing down for whoever reads your repo next

When you finish, record these somewhere permanent (in this repo it is README §9):

- **The license expiry date and tier.** A free-tier token expires ~30 days out.
  When it does, the drawer flips to `expiring` during a grace period and then
  locks — and it will look like your code broke.
- **That `identifyUser` is static.** Every browser shares one thread list. Fine
  for QA, wrong for anything else.
- **Which Intelligence project the threads land in**, especially if several
  framework repos share one.
- **That threads accumulate.** Every test run and every recording leaves a real
  row on the platform, against a 200-thread cap on the free tier.

---

## Version note

Verified against `@copilotkit/runtime` and `@copilotkit/react-core` **1.68.2**,
with the CLI starter on **1.65.0**. The gates above behaved identically in both.
Re-check with the `grep` in the [gates section](#why-three-separate-things-have-to-be-true)
before assuming they still hold on a newer release, and check your repo's actual
version rather than the newest published one:

```bash
node -p "require('./frontend/node_modules/@copilotkit/runtime/package.json').version"
```
