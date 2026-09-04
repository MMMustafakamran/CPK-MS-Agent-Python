# QA findings — 2026-09-04 sync

**Repo:** MsPy-react · **Docs:** <https://docs.copilotkit.ai/ms-agent-python>

**Versions pinned for every finding below:**

| Package | Declared | Installed |
| --- | --- | --- |
| `@copilotkit/react-core` | `^1.69.2` | **1.69.2** |
| `@copilotkit/runtime` | `^1.69.2` | 1.69.2 |
| `@ag-ui/client` | `^0.0.58` | 0.0.58 |
| `agent-framework-ag-ui` | `>=1.0.1` | **1.1.0** (pinned by `backend/uv.lock`) |
| `agent-framework-core` | (transitive) | 1.14.0 |
| `agent-framework-openai` | `>=1.12.0` | 1.13.0 |

> Read from `node_modules` and `.venv` after the recording run, not from the
> declared ranges. An earlier draft of this report said `1.66.2` — copied from a
> page callout rather than measured. `autorecorder/core/versions.ts` exists in
> this repo precisely because "the Readables note claimed 1.66.2 and listed
> packages this repo does not even install"; the same mistake was made again
> here and is corrected.
>
> Note that `uv run` — how `ci/automate.mjs` launches the backend — re-syncs
> `.venv` to `uv.lock` on every run. A manually `pip install`ed newer version
> does not survive a recording, so the lockfile is the only version that
> matters.

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
`agent_framework_ag_ui` **1.1.0**, the version `backend/uv.lock` pins and every
recording actually runs, `_agent_run.py` never reads `input_data["context"]` at
all. The only context it injects is *state* context (`_inject_state_context`),
which is a different thing entirely. The forwarded AG-UI context is accepted by
the endpoint and dropped.

(For completeness: in 1.2.1 — briefly present in this venv as a stray manual
install, and wiped by the next `uv run` — the key is read in exactly one place,
`build_ag_ui_context_slice(...)`, inside the branch guarded by the A2UI
injection flag. A run without `injectA2UITool` still sees nothing. The
conclusion holds on both versions; only 1.1.0 is the one that ships here.)

**Why this matters more than a normal doc bug:** the failure was silent. No
error, no console warning. The agent answered questions about "your colleagues"
from general knowledge, and with placeholder names like *John Doe* and *Jane
Smith* the answer looked right. Drift passed. Recording passed. The clip showed
a working chat doing the wrong thing.

**Status:** implemented. `ContextAwareAgent` is in `backend/agents.py` verbatim
(bar the factory name — this file names one factory per page), mounted at
`/context_agent`, and `/readables` now binds it.

### Verified empirically, not just by reading the source

Same AG-UI payload — same question, same forwarded `context` — posted to both
endpoints on the running backend:

| Endpoint | Answer | Names matched |
| --- | --- | --- |
| `/sample_agent` (the old published sample) | *"I don't have specific information about your colleagues. If you can provide their names or any details about them, I'd be happy to help you with that!"* | **0 / 3** |
| `/context_agent` (the new published sample) | *"Here are your colleagues: 1. **John Doe** — Developer, 2. **Jane Smith** — Designer, 3. **Bob Wilson** — Product Manager"* | **3 / 3** |

The plain agent received the context and discarded it. That is the defect,
measured rather than inferred, and it is the same shape the old page's own
"Give it a try!" step tells you to expect success from.

Reproduce with `scripts`-free curl against a running backend, or re-run the
probe used here: POST a `RunAgentInput` carrying `context` to each path and
reassemble the `TEXT_MESSAGE_CONTENT` deltas.

**Recorded:** `MSPY-react-14-Readables.webm`, re-recorded 2026-09-04 against
this change. The take passes and the agent answers from the panel.

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
| `/readables` recording | **re-recorded and passing** |
| Other recordings | **not re-run.** Every other clip predates these changes. |

`/readables` has been re-recorded and passes; finding 1 is confirmed by direct
measurement (above), not only by the clip. Every other route still carries a
clip that predates these changes — in particular both Shared State routes, whose
on-screen behaviour changed.

**Recording note:** three port variables must be set together or the recorder
silently targets whatever else is on port 3000. `PORT` (what `next dev` binds),
`FRONTEND_PORT` (what `ci/lib/config.mjs` preflights) and `FRONTEND_URL` (what
`autorecorder/config/project.config.ts` actually navigates to) are read by three
different layers and none derives from the others. Setting only the first two
produced a take against a sibling repo's app on this machine.
