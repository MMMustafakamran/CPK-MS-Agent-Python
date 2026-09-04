# QA findings — 2026-09-04 sync

**Repo:** MsPy-react · **Docs:** <https://docs.copilotkit.ai/ms-agent-python>

**Versions pinned for every finding below:**

| Package | Declared | Installed |
| --- | --- | --- |
| `@copilotkit/react-core` | `^1.66.2` | 1.66.2 |
| `agent-framework-ag-ui` | `>=1.0.1` | 1.2.1 |
| `agent-framework-core` | (transitive) | 1.16.0 |
| `zod` | — | 3.x |

8 pages drifted. One of them reversed a claim this harness had been built on.

---

## 1. Agent App Context: the old sample could not have worked — HIGH

**Page:** `/ms-agent-python/agent-app-context` → route `/readables`

The Python sample used to be a plain agent whose only comment read *"frontend
context is forwarded automatically"*. This repo took that at face value and
pointed `/readables` at the shared `sample_agent` with no extra wiring.

The page now publishes a `ContextAwareAgent` subclass that folds
`input_data["context"]` into a system message by hand, and the lead-in changed
to *"Use middleware to read it and inject it into the agent's conversation."*

**The shipped source says the new version is the correct one.** In
`agent_framework_ag_ui._agent_run.run_agent_stream`, `input_data["context"]` is
read in exactly one place — `build_ag_ui_context_slice(...)` — inside the branch
guarded by the A2UI injection flag. A run without `injectA2UITool` never turns
the forwarded context into anything the model sees.

**Why this matters more than a normal doc bug:** the failure was silent. No
error, no console warning. The agent answered questions about "your colleagues"
from general knowledge, and with placeholder names like *John Doe* and *Jane
Smith* the answer looked right. Drift passed. Recording passed. The clip showed
a working chat doing the wrong thing.

**Status:** implemented. `ContextAwareAgent` is in `backend/agents.py` verbatim
(bar the factory name — this file names one factory per page), mounted at
`/context_agent`, and `/readables` now binds it.

**To verify:** ask "Who are my colleagues?" and check the answer against the
panel. Exact match means the context arrived. Anything plausible-but-different
means it did not.

---

## 2. One page migrated import paths; seven did not — MEDIUM

`agent-app-context` is now the only page in the set importing from
`agent_framework_ag_ui` and annotating the client as `BaseChatClient`.
Quickstart, Auth, Frontend Tools, Tool Rendering, State Rendering and both
Shared State pages still publish `agent_framework.ag_ui` and
`SupportsChatGetResponse`.

Both resolve to the same class today — `agent_framework.ag_ui` is a lazy shim
over the package — but nothing in the docs says so, or which is preferred.

`backend/agents.py` now asserts the two are identical at import, so a release
that splits them fails loudly here instead of silently running two classes.

---

## 3. Shared State: `initialState` and `render` are gone — HIGH

**Pages:** `in-app-agent-read`, `in-app-agent-write`

Both props had never existed on `useAgent`; this repo had flagged them since the
first pass. The docs have now dropped both. Seeding moved to a `useEffect`
gated on `isReady`, which the hook does return, so the published snippet
compiles. `setState` also gained the spread it needed.

Implemented as published. Four findings on what replaced it:

### 3a. `isReady` does not mean the state has loaded

The seed writes `english` whenever `state.language` is undefined at the moment
`isReady` flips true. But `isReady` only reports that the runtime `/info` sync
resolved — it says nothing about whether a state snapshot has arrived.

Harmless here, because the endpoint supplies `default_state`. On a persisted
thread already holding `spanish`, the same snippet races the replay, and the
page offers no guard.

### 3b. The snippet builds a guarded `state` and then ignores it

It computes `const state = (agent.state ?? {}) as Partial<AgentState>`, uses it
in the effect, then renders `{agent.state?.language}` — back to the raw object
on the one line that is highlighted. The guarded const exists only to feed the
effect's dependency array. The page demonstrates a defensive pattern it does not
follow.

### 3c. The fix landed in one snippet and not its sibling

The Implementation step now spreads:

```tsx
agent.setState({ ...(agent.state ?? {}), language: … })
```

"Re-run the agent with a hint about what's changed", further down the same page,
still publishes:

```tsx
agent.setState({ language: newLanguage })
```

No spread, and it reads `agent.state.language` rather than the `state` const.
The un-spread one is the worse place for it — it is the snippet that calls
`runAgent()`, so wiped keys reach the agent immediately rather than on a later
turn. A one-key schema hides it, which is presumably how it survived the edit.

Both buttons in the demo are as published: **Toggle** spreads, **Toggle +
re-run** does not.

### 3d. The render sample is named after the component it would replace

"Rendering agent state in your app" reuses the name `YourMainContent` from the
step above — the component that draws the whole page — with a body of
`if (!state.language) return null;` plus one `div`. Taken at its word, your main
content becomes a line that vanishes whenever state is empty.

The old `render` prop at least failed to compile. This one compiles and deletes
your UI.

Implemented verbatim under its published name and rendered in a dashed box on
the demo, so the return-null behaviour is watchable rather than asserted.

### 3e. In-chat rendering is no longer documented anywhere

The section was retitled from "Rendering agent state in the chat" to "in your
app", and the in-chat option went with the title. No replacement page is linked.

---

## 4. The same line is spelled two ways across the guides — MEDIUM

| Guide | Published |
| --- | --- |
| AG2 | `{agent.state.language}` |
| Mastra | `{agent.state?.language}` |
| **MS Agent Framework** | `{agent.state?.language}` |

Same guide, same step, same line. The difference is the optional chaining that
decides whether the page survives an undefined state. Nothing says which is
intended. Each repo reproduces its own page's spelling, so the divergence stays
visible.

---

## 5. Credentials — HIGH

`INTELLIGENCE_API_KEY` → `CPK_INTELLIGENCE_API_KEY` across quickstart,
headless-threads, inspector and threads-lifecycle. The placeholder changed from
`your_license_key` to `cpk-...`, and the prose stopped calling it a license key.

Nothing says whether the old name still works, so the runtime route reads the
new name first and falls back to the old one — an existing `.env` must keep
working.

**Unresolved contradiction:** Headless Threads now states that managed project
setup does *not* issue `COPILOTKIT_LICENSE_TOKEN`, and that it is for offline or
self-hosted licensing only. But `<CopilotThreadsDrawer>` gates on a license
status and stays locked without one. Nothing reconciles these. A reader
following the current pages from scratch gets a permanently locked drawer with
no explanation. This repo only unlocks because it holds a token an older CLI
wrote.

Also newly named and never defined: `SL_ENABLED`. `CPK_TELEMETRY_ID` is
described only as "a non-secret analytics identity".

---

## 6. Tooling gap found while doing this sync — HIGH

`npm run drift:sync` compares hashes of pages already in the manifest. It never
fetches the sitemap, so a page appearing or disappearing upstream is invisible
to it — that comparison lives solely in the `/doc-sync` server action.

A clean CLI run prints **NO DOC DRIFT**, which reads as "the docs have not
moved" when it only means "the pages we already knew about have not moved".

Running the sitemap comparison by hand found **12 URLs** under
`/ms-agent-python` that were neither tracked nor previously recorded:

- 8 `/intelligence/*` — the `/premium/*` pages, renamed
- `/webmcp`, `/human-in-the-loop/governed-actions` — genuinely new
- `/generative-ui/a2ui/advanced`, `/generative-ui/a2ui/styling` — a subsection
  this repo does not cover

The `/premium/*` URLs are now **absent from the sitemap entirely** while still
returning 200 with identical content. Not a redirect: a delisted live duplicate.
Anything still pinned to the old path reads a page nobody is updating, and no
drift check will ever say so.

**Fixed:** the CLI script now prints its own scope on every run, and the
manifest's `sitemap` block is rebuilt from what the sitemap actually lists.

---

## Coverage after this sync

| Area | State |
| --- | --- |
| 8 drifted pages | implemented |
| `/context_agent` backend | added, mounts, verified |
| Sitemap record | rebuilt, clean |
| `webmcp` | **not covered** — new top-level page, no route |
| `human-in-the-loop/governed-actions` | **not covered** — this repo tracks no HITL page |
| `generative-ui/a2ui/*` | **not covered** — subsection never covered here |
| Recordings | **not re-run.** Every clip predates these changes. |

`/readables` is the recording to make first: it is the only place where the
claim in finding 1 gets tested rather than reasoned about.
