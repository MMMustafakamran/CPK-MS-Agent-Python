# Doc drift changelog

What the CopilotKit docs changed under this repo, written by the sync on
`/doc-sync`. Only pages that actually moved are recorded — a sync that finds
everything unchanged writes nothing here at all.

Holds the 3 most recent dated entries. When a change lands on a fourth
date, the oldest entry is dropped. Entries are counted, not aged, so a gap of
weeks between changes does not expire anything.

## 2026-08-20

### 11:18 UTC — 4 pages, highest severity none

**None — Rich Threads** · _new pages brought into tracking, not an upstream change_

Four doc pages that already existed upstream were added to `nav-config.ts` and
fetched into the snapshot for the first time, so there is no prior copy to diff
against:

- `/ms-agent-python/threads` · route `/threads`
- `/ms-agent-python/prebuilt-components/copilot-threads-drawer` · route `/threads/drawer`
- `/ms-agent-python/headless-threads` · route `/threads/headless`
- `/ms-agent-python/threads-lifecycle` · route `/threads/lifecycle`

`/ms-agent-python/threads-import` exists upstream and is deliberately left
untracked — see README §8.

## 2026-08-17

### 13:46 UTC — 1 page, highest severity low

**Low — Readables** · _local snapshot edit, not an upstream change_

`/ms-agent-python/agent-app-context` · route `/readables` · under “Implementation”

3 prose lines changed.

````diff
- 
+ Check out the [Frontend Data
+ documentation](/integrations/langgraph/agent-app-context)
````
