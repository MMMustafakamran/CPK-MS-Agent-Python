/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 4 of 4
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * This framework's command-line flows: the scaffolding CLI and the installs
 * that follow it, each driven through a real terminal and captured to a cast
 * file that the recorder later replays on camera.
 *
 * Adapting means rewriting the prompts below to match *this* framework's CLI.
 * Every CopilotKit repo runs the same `copilotkit create`, but the answers
 * differ — the framework row, the Intelligence project, whether a chat-channel
 * prompt appears at all — and some frameworks' quickstarts use a different tool
 * entirely.
 *
 * ── The one rule ───────────────────────────────────────────────────────────
 * Name rows, do not count them. `select: { label: '...' }` walks the list until
 * the highlight is on that row. The alternative — "press Down twelve times" —
 * works until the CLI adds a menu entry, and then it scaffolds the wrong
 * framework while reporting success. The framework list has 23 entries today
 * and grows with every integration CopilotKit ships.
 *
 * ── Before the first run ───────────────────────────────────────────────────
 * `npm run capture -- --login` once. Sign-in opens a browser and cannot be
 * automated; doing it up front turns the mid-run auth pause into a precondition
 * and makes everything after it deterministic. It is also why these flows are
 * local-only and are not part of CI.
 *
 * The prompts encoded here were read off a real run — see
 * `1-cli-testing/CLI-FLOW.md`, which documents each one, what it expects, and
 * which of them are conditional.
 */
import { type DistributionConfig } from '../core/cli/distribute';
import { defineCliFlows, defineCliVideos } from '../core/cli/flow';

/** Names the generated app and its directory. Lowercase, digits, hyphens, ≤30. */
const APP_NAME = 'app';

/**
 * The row to select in `Select agent framework`.
 *
 * Must match this repo's backend. Matched as a case-insensitive substring, so
 * it needs to be unique in the list — 'Microsoft Agent Framework' alone would
 * also match the .NET row, which sits directly above it.
 */
const FRAMEWORK_ROW = 'Microsoft Agent Framework (Python)';

/** Existing CopilotKit Intelligence project to bind the app to. */
const INTELLIGENCE_PROJECT = 'myapp';

/** Where the CLI runs, relative to the repo root. The app lands inside it. */
const SCAFFOLD_DIR = '1-cli-testing';

/**
 * Sign-in can take minutes when the CLI session has expired: the operator has
 * to complete a browser round trip before the project picker appears. Waiting
 * that long for one step is correct; it is the only step a human touches.
 */
const AUTH_TIMEOUT_MS = 6 * 60_000;

/**
 * The sign-in window, which is a person noticing a browser tab and typing a
 * password — not a machine doing something slow.
 *
 * Six minutes proved too short in practice: the run died while the operator was
 * still signing in, and a timeout there reads as "sign-in failed" when nothing
 * failed at all. This is the one step whose limit should be set by human
 * attention rather than by how long the work takes.
 */
const LOGIN_TIMEOUT_MS = 15 * 60_000;

/** Package managers the scaffold is installed with, one flow each. */
const PACKAGE_MANAGERS = [
  { id: 'npm', command: 'npm' },
  { id: 'pnpm', command: 'pnpm' },
  { id: 'yarn', command: 'yarn' },
  { id: 'bun', command: 'bun' },
] as const;

/**
 * One scaffold, copied into four directories, with the model key seeded in.
 *
 * The CLI runs once. Running it four times would make the scaffold itself a
 * variable in a test whose only subject is the install, so a difference between
 * managers could not be attributed to the manager.
 *
 * The key is seeded here rather than typed into the CLI: the scaffold is created
 * without one on purpose, so no recording ever contains a secret, and placing it
 * once before the copy means it cannot be typo'd into three directories of four.
 */
export const CLI_DISTRIBUTION: DistributionConfig = {
  source: `${SCAFFOLD_DIR}/${APP_NAME}`,
  targets: PACKAGE_MANAGERS.map((pm) => `${SCAFFOLD_DIR}/${pm.id}/${APP_NAME}`),
  exclude: ['node_modules', '.next', '.git', '.turbo'],
  envFiles: [
    // The repo root .env is the one with a real key in it. Both destinations are
    // needed: the Next app reads the first, the agent process the second.
    { from: '.env', to: '.env' },
    { from: '.env', to: 'agent/.env' },
  ],
};

export const CLI_FLOWS = defineCliFlows([
  {
    id: 'login',
    name: 'CopilotKit CLI — sign in',
    castName: 'Login',
    cwd: '.',
    command: 'npx',
    args: ['copilotkit@latest', 'login'],
    // Manual because it hands off to a browser: the operator finishes the round
    // trip, and nothing here can wait on that meaningfully. Run it once, then
    // the scaffold flow needs no human at all.
    manual: true,
    timeoutMs: LOGIN_TIMEOUT_MS,
    stepTimeoutMs: LOGIN_TIMEOUT_MS,
    steps: [
      {
        // `login` does not open the browser until this is acknowledged. Without
        // the keypress it sits on the prompt until the timeout, which reads as
        // "sign-in never completed" when in fact it never started.
        label: 'Acknowledge browser hand-off',
        waitFor: /Press Enter to continue/i,
        keys: ['Enter'],
        timeoutMs: 60_000,
      },
    ],
    // Nothing on disk to assert: the session is cached wherever the CLI keeps
    // it, and the proof it worked is the scaffold no longer pausing for auth.
    expectFiles: [],
  },

  {
    id: 'scaffold',
    name: 'CopilotKit CLI — create app',
    castName: 'Scaffold',
    docPath: 'quickstart?agent=bring-your-own',
    cwd: SCAFFOLD_DIR,
    command: 'npx',
    // `--project` names the Intelligence project instead of showing the picker.
    //
    // Not a shortcut for its own sake: with a valid CLI session already saved,
    // the interactive picker still sat on "Verifying authentication…" until the
    // step timed out, twice, on a network where `copilotkit project list`
    // answers instantly. Naming the project skips the step that hangs and
    // leaves every other prompt interactive and driven.
    args: ['copilotkit@latest', 'create', '--project', INTELLIGENCE_PROJECT],
    cols: 120,
    rows: 32,
    timeoutMs: 12 * 60_000,
    // The scaffold clones a template over the network, and that fails in ways
    // the CLI reports and then stops making progress on. Naming those here
    // turns a six-minute wait for a prompt that is never coming into an
    // immediate failure that quotes the actual error.
    abortOn: [/Init failed/i, /fatal: /i, /RPC failed/i],
    // Git's default HTTP/2 transport is what produced
    // "schannel: server closed abruptly" on this network. Scoped to this
    // command's children via git's own env-var config, so nothing global
    // changes for the machine.
    env: {
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.version',
      GIT_CONFIG_VALUE_0: 'HTTP/1.1',
    },
    steps: [
      {
        // npx's own prompt, not CopilotKit's — it appears only when the package
        // is not already cached. Optional, so a second run does not fail here,
        // and so the `y` is never typed into whatever prompt came instead.
        label: 'npx package install',
        waitFor: /Ok to proceed/i,
        optional: true,
        timeoutMs: 45_000,
        type: 'y',
        keys: ['Enter'],
      },
      {
        label: 'App name',
        waitFor: /App name/i,
        timeoutMs: 120_000,
        type: APP_NAME,
        keys: ['Enter'],
        settleMs: 600,
      },
      {
        label: 'Agent framework',
        waitFor: /Select agent framework/i,
        select: { label: FRAMEWORK_ROW, max: 40 },
        keys: ['Enter'],
        settleMs: 600,
      },
      {
        // `login` does not open its browser until Enter is pressed, and this
        // screen carries the same "…to continue" wording. Optional and cheap:
        // if it is only a spinner, the keypress is harmless; if it is waiting
        // for acknowledgement, nothing else was ever going to send it.
        label: 'Acknowledge account link (only if it asks)',
        waitFor: /Sign in with your browser|Verifying authentication/i,
        optional: true,
        timeoutMs: 30_000,
        keys: ['Enter'],
        settleMs: 2000,
      },
      {
        // Optional because `--project` above normally means this never appears.
        // Kept so that dropping the flag — or a CLI version that ignores it —
        // still produces a driven run rather than a hang.
        label: 'Intelligence project (skipped when --project is given)',
        waitFor: /Select a project/i,
        optional: true,
        timeoutMs: 90_000,
        select: { label: INTELLIGENCE_PROJECT },
        keys: ['Enter'],
        settleMs: 600,
      },
      {
        // Only frameworks whose starter ships a managed Channel host ask this —
        // 18 of the 23. Optional so this same config survives being pointed at
        // one of the five that do not.
        label: 'Chat platform',
        waitFor: /chat platform/i,
        optional: true,
        // Minutes, not seconds: the template is cloned between the account link
        // and this prompt. A 45s window expired mid-clone, so the prompt arrived
        // after this step had already given up — and then sat unanswered while
        // the next step waited for something behind it.
        timeoutMs: 5 * 60_000,
        select: { label: 'Not now' },
        keys: ['Enter'],
        settleMs: 600,
      },
      {
        // Single keypress: this prompt acts on the character, with no Enter.
        // Sending one would leak a stray Enter into the key prompt below and
        // answer it before it had painted.
        label: 'Decline dependency install',
        waitFor: /install the dependencies/i,
        timeoutMs: 5 * 60_000,
        type: 'n',
      },
      {
        // The model key is placed into the project afterwards, deliberately, so
        // it never appears in a recording. Enter leaves it empty and the CLI
        // exits. Optional because the exact wording is unconfirmed.
        label: 'Skip model API key',
        waitFor: /API key/i,
        optional: true,
        timeoutMs: 60_000,
        keys: ['Enter'],
      },
    ],
    // The CLI prints its success banner and then holds the terminal open rather
    // than exiting, so waiting for an exit fails a run whose own last line says
    // it worked.
    doneWhen: /created successfully/i,
    // Answering every prompt is not the same as producing an app. Without this,
    // a CLI that exits 0 having written nothing counts as a pass.
    expectFiles: [
      `${SCAFFOLD_DIR}/${APP_NAME}/package.json`,
      `${SCAFFOLD_DIR}/${APP_NAME}/agent`,
    ],
    // Light compression only. The pauses in an interactive session are someone
    // reading the prompt before answering it, and cutting them makes the video
    // unreadable — which is the one thing this clip exists to show.
    render: { maxGapSec: 1.6, speed: 1.15, title: 'Windows PowerShell' },
  },

  // One install per package manager. The scaffold is generated once and copied
  // into each of these directories, so the app is identical in all four and the
  // install path is the only variable under test.
  //
  // These have no steps: a package install asks nothing. They are here for the
  // cast — the install is a segment of the demo video — and for the durations,
  // which are the matrix's actual finding.
  ...PACKAGE_MANAGERS.map(({ id, command }) => ({
    id: `install-${id}`,
    name: `Install dependencies — ${id}`,
    castName: `Install-${id}`,
    cwd: `${SCAFFOLD_DIR}/${id}/${APP_NAME}`,
    command,
    args: ['install'],
    // Cold installs on a slow network genuinely take this long; a tighter cap
    // reports a failure for a command that was working fine.
    timeoutMs: 15 * 60_000,
    expectFiles: [`${SCAFFOLD_DIR}/${id}/${APP_NAME}/node_modules`],
    // The demo leads with resolved versions, and they can only be read once
    // something is installed.
    versionsFor: `${SCAFFOLD_DIR}/${id}/${APP_NAME}`,
    // An install is minutes of a spinner. Nobody watches that, but cutting it
    // entirely loses what the segment is evidence of — that it completed, and
    // roughly how long it took. Cap the dead air, then play what is left fast.
    render: { maxGapSec: 0.4, speed: 3, title: `${command} install` },
  })),
]);

/**
 * The deliverable: three videos per package manager, twelve in all.
 *
 * Each manager gets a complete set — the CLI creating the project, that
 * manager installing it, and its copy running and answering — so one folder of
 * clips tells the whole story for one manager without cross-referencing.
 *
 * The CLI clip is deliberately the same footage in all four sets: the CLI runs
 * once and the result is copied, so there is only one real create to show.
 * `cli-render.ts` records it once and copies the file, rather than re-filming
 * identical footage four times.
 *
 * The third video of each set is a page recording, in `pages.config.ts`.
 */
/**
 * The finding this QA pass produced, as a clip that explains itself.
 *
 * `project-context.md` is explicit that a broken thing keeps its broken
 * implementation and the recording exists to show the defect, and that every
 * finding pins installed against declared versions. So the order is: the doc
 * page that tells you to run the command, the versions it actually resolved,
 * the manifest line that breaks, the command failing, then the explanation
 * written out — so the clip stands on its own for someone who was not here.
 */
const BUN_APP = `${SCAFFOLD_DIR}/bun/app`;

const BUN_FINDING_NOTE = [
  'bun install fails on windows',
  '',
  '1373 packages install fine, then postinstall dies:',
  '  bun: command not found: scriptssetup-agent.bat',
  '',
  'package.json line 13:',
  '  "install:agent": "./scripts/setup-agent.sh || scripts\\setup-agent.bat"',
  '',
  "bun's shell eats the backslash, so scripts\\setup-agent.bat becomes",
  "scriptssetup-agent.bat - you can see the slash missing in bun's own",
  'error. both scripts are there on disk. npm runs the same line through',
  'cmd.exe where \\ is just a path separator, so npm never hits this.',
  '',
  'so agent/.venv never gets created, the python agent has no deps, and',
  'bun run dev cant start it. exits 1.',
  '',
  'fix: scripts/setup-agent.bat - forward slash works in both shells.',
].join('\n');

export const CLI_VIDEOS = defineCliVideos(
  PACKAGE_MANAGERS.flatMap(({ id, command }) => [
    {
      id: `cli-${id}`,
      name: `${id} · 1 · CopilotKit CLI — creating the app`,
      videoName: `${id}-1-CLI-Create`,
      docPath: 'quickstart?agent=bring-your-own',
      flows: ['scaffold'],
    },
    {
      id: `install-video-${id}`,
      name: `${id} · 2 · Installing dependencies`,
      videoName: `${id}-2-Install`,
      docPath: 'quickstart?agent=bring-your-own',
      flows: [`install-${id}`],
    },
  ]),
);

/** Video 3 for bun: the finding, in full. */
export const CLI_FINDING_VIDEOS = defineCliVideos(
  [
    {
      id: 'finding-bun',
      name: 'bun · 3 · Finding — bun install fails on Windows',
      videoName: 'bun-3-Finding',
      docPath: 'quickstart?agent=bring-your-own',
      flows: ['install-bun'],
      ideTabs: [
        // Installed, not declared: what this run actually resolved to.
        { filePath: `${BUN_APP}/VERSIONS.md`, startLine: 1, endLine: 20 },
        // What the starter declares — the CopilotKit packages under test.
        { filePath: `${BUN_APP}/package.json`, startLine: 20, endLine: 30 },
        // The line that breaks.
        { filePath: `${BUN_APP}/package.json`, startLine: 13, endLine: 14 },
      ],
      ideDwellMs: 4200,
      notepad: {
        filename: 'bun-install-finding.txt',
        body: BUN_FINDING_NOTE,
        // Faster than the 62ms default: this note is several times longer than
        // a one-line issue jotting, and at the default it would spend two
        // minutes typing while the viewer has already read it.
        charDelayMs: 22,
      },
    },
  ],
);
