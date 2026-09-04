# CopilotKit CLI Testing

Quick guide to scaffold, install, and run the Microsoft Agent Framework
(Python) starter across four package managers (`npm`, `pnpm`, `yarn`, `bun`).
Results of the last run are in [Results](#results-2026-09-03).

## 1. Scaffold Projects

Run from this directory to create the project:

```bash
# npm
npx copilotkit@latest create
```

---

## 2. Install Dependencies

Navigate into each generated project folder (`npm/app`, `pnpm/app`, `yarn/app`, `bun/app`) and install:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

> **Automate all 4:** Run `.\install-all.ps1` (or `install-all.bat`)

---

## 3. Run Dev Server

Start the local development server in each folder:

```bash
# npm
npm run dev

# pnpm
pnpm run dev

# yarn
yarn run dev

# bun
bun run dev
```

> **Automate all 4:** Run `.\run-all.ps1` (or `run-all.bat`)

---

## Notes

- **Environment**: Ensure `OPENAI_API_KEY` is set in `.env` (scripts automatically copy it to each app).
- **Cleanup**: Run `.\delete-projects.ps1` (or `delete-projects.bat`) to delete generated apps and reset the workspace.

---

## Results (2026-09-03)

One scaffold — `npx copilotkit@latest create`, Microsoft Agent Framework
(Python), Intelligence project `myapp` — copied into all four directories, so
the install is the only variable.

| Manager | `install` | `run dev` | Notes |
|---|---|---|---|
| npm | ✅ 242s | ✅ agent replies | 22 packages resolved. Blocks `@scarf/scarf`, `esbuild` and `sharp` install scripts, which does not matter — the starter's own `postinstall` still runs and creates `agent/.venv`. |
| yarn | ✅ 314s | ✅ boots, agent starts | Not filmed: cold compile overruns the recorder's navigation budget, not an app fault. |
| pnpm | ❌ exit 1 | ❌ | `ERR_PNPM_IGNORED_BUILDS`. pnpm blocks dependency build scripts by default, so `install:agent` never runs and `agent/.venv` is never created. Needs `pnpm approve-builds`. |
| bun | ❌ exit 1 | ❌ | Windows postinstall bug, reproduced again — see below. |

### bun install fails on Windows

1373 packages install, then the postinstall dies:

```
bun: command not found: scriptssetup-agent.bat
```

`package.json` declares:

```json
"install:agent": "./scripts/setup-agent.sh || scripts\\setup-agent.bat"
```

bun's shell eats the backslash, so `scripts\setup-agent.bat` becomes
`scriptssetup-agent.bat` — the missing separator is visible in bun's own error.
Both scripts exist on disk. npm runs the same line through `cmd.exe`, where `\`
is just a path separator, so npm never hits it. Consequence: no `agent/.venv`,
the Python agent has no dependencies, and `bun run dev` cannot start it.

Fix: `scripts/setup-agent.bat` with a forward slash, which works in both shells.

The same shape appears in `dev:agent` (`./scripts/run-agent.sh || scripts\run-agent.bat`) —
under npm, `cmd.exe` prints `'.' is not recognized…` for the `.sh` half before
falling through to the `.bat`, which is noisy but harmless.

### Recordings

Videos live in `autorecorder/videos/`. Video 3 of a set is the scaffolded app
actually running; only npm has one, and
[autorecorder/README.md](../autorecorder/README.md#video-3-what-only-npm-survives)
explains why the other three do not.

