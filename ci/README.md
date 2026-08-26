# `ci/` — the recording pipeline

Everything that builds, starts, checks and records this repo lives here. The
only piece outside this folder is `.github/workflows/daily-recorder.yml`, because
GitHub requires that path.

## Layout

```
ci/
├── automate.mjs          entry point — one process, start to finish
├── check-doc-drift.mjs   compares doc-snapshot/ against the live docs
├── list-pages.mjs        prints the recorder's page ids
├── validate-pages.mjs    rejects unknown ids before a run starts
└── lib/
    ├── config.mjs        paths, ports, URLs
    ├── env.mjs           loads .env files the way backend/main.py does
    ├── pages.mjs         reads page ids from the recorder's config
    ├── preflight.mjs     port, credential and warmup checks
    ├── mux.mjs           voiceover muxing (the only implementation)
    └── report.mjs        RUN_REPORT.md / .json
```

## Commands

| Command | What it does |
|---|---|
| `npm run automate` | Full pipeline: drift → preflight → deps → servers → record |
| `npm run automate:pull` | Same, after `git pull` |
| `npm run automate:upgrade` | Same, upgrading dependencies first |
| `npm run drift` | Doc drift check on its own |
| `npm run drift:sync` | Update `doc-snapshot/` to match live docs |
| `npm run ci:pages` | List valid page ids |

Anything not consumed by `automate.mjs` is forwarded to the recorder:

```bash
node ci/automate.mjs --pages=quickstart,readables
node ci/automate.mjs --shard=1/3
node ci/automate.mjs --limit=3 --ignore-doc-drift
```

## Flags

| Flag | Effect |
|---|---|
| `--pull` | `git pull` first |
| `--upgrade` | Upgrade deps instead of installing the lockfile |
| `--skip-install` | Skip dependency installation |
| `--ignore-doc-drift` / `--force` | Record even if the live docs moved |
| `--allow-port-reuse` | Record against servers that are already running |
| `--skip-credential-check` | Skip the model-credential preflight |

## What runs, in order

1. **Doc drift** — compares each `doc-snapshot/pages/*.md` hash against the live
   page. Drift halts the run with exit code 2 unless `--ignore-doc-drift`.
2. **Preflight** — loads `.env`, then refuses to continue if a port is already
   held or the model credential is missing/rejected. Both checks are cheap and
   both have cost a full run before.
3. **Dependencies** — `uv sync` for the backend, `npm install` for the frontend
   and recorder.
4. **Servers** — backend and frontend, spawned from this process, logging to
   `autorecorder/videos/logs/`.
5. **Health + warmup** — poll until both answer, then compile the heaviest
   routes so the recorder is not racing a cold Turbopack build.
6. **Record** — hand off to the recorder with the forwarded flags.
7. **Mux + report** — always runs, success or failure.

## Why one process

Each `run:` step in a GitHub Actions job is a separate subshell. A server
started with `&` in one step is reaped before the next step begins. Spawning
both servers from inside `automate.mjs` keeps them alive for the whole run,
which is why the pipeline is a Node program and not a sequence of YAML steps.

## Page selection

`autorecorder/config/pages.config.ts` is the single source of truth for which
demos exist. `lib/pages.mjs` reads the ids from it, `list-pages.mjs` prints
them, and `validate-pages.mjs` checks a dispatch selection against them.

The workflow does **not** restate the list. It used to, in two more places, and
they drifted whenever a page was renamed.

## Adding a page

Add it to `autorecorder/config/pages.config.ts`. Nothing here needs editing —
`npm run ci:pages` will show it, the workflow will accept it, and sharding will
include it.

## CI shape

Three parallel workers each record a third of the pages under `xvfb-run`, then a
consolidate job merges the artifacts.

```
Worker 1/3 ─┐
Worker 2/3 ─┼─→ consolidate-recordings → demo-recordings-all-<sha>
Worker 3/3 ─┘
```

Manual dispatch takes 4 inputs: `pages`, `upgrade_packages`, `fail_on_doc_drift`,
`custom_args`. GitHub caps `workflow_dispatch` at **10 inputs** — worth
remembering before adding more.

## Secrets and variables

| Name | Kind | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | secret | Model provider key |
| `AZURE_OPENAI_API_KEY` / `AZURE_OPENAI_ENDPOINT` | secret | Azure instead of OpenAI |
| `COPILOTKIT_LICENSE_TOKEN` | secret | Unlocks the Rich Threads pages |
| `INTELLIGENCE_API_KEY` | secret | Managed thread store |
| `OPENAI_CHAT_MODEL_ID` | variable | Model override (default `gpt-4o-mini`) |
| `INTELLIGENCE_API_URL` / `INTELLIGENCE_GATEWAY_WS_URL` | variable | Endpoint overrides |

Without the Intelligence pair the three Rich Threads pages still record, but the
drawer stays locked and mutations return 422.

## Troubleshooting

**"Ports already in use"** — a previous run's servers survived. Stop the listed
PIDs, or pass `--allow-port-reuse` to record against them. Do not ignore this:
Windows lets a second process bind a port another is already listening on, and
requests then land on whichever accepts first, so a stale server holding old
environment variables can answer instead of the new one.

**"OPENAI_API_KEY is missing or still the placeholder"** — set a real key in
`backend/.env` or the repo-root `.env`. Note the precedence: `backend/.env` is
read first, so an uncommented placeholder there shadows a real key at the root.

**Server died mid-run** — read `autorecorder/videos/logs/backend.log` and
`frontend.log`. They are uploaded with the CI artifacts.

**Recorder aborts on preflight** — the frontend was still compiling. The warmup
step covers the usual routes; a page added to `WARMUP_ROUTES` in `lib/config.mjs`
gets the same treatment.
