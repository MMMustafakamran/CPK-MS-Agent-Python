import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PAGES } from './config';
import { type IdeTabConfig } from './ide/generator';

/**
 * Static validation of the page registry, without launching a browser.
 *
 * `config.ts` anchors every IDE snippet to hardcoded line numbers. Insert one
 * line into a demo page and the recording silently highlights the wrong code --
 * there is no error, the video just shows the wrong thing, and nobody notices
 * until they watch all seventeen. This is the cheap guard against that.
 *
 * The frontend already marks its interesting lines with `[!code highlight]` and
 * `#region`, so where a file carries those markers we can check the range still
 * covers at least one of them. That is a heuristic, not a proof: a file with no
 * markers can only be bounds-checked.
 */

interface Problem {
  pageId: string;
  file: string;
  severity: 'error' | 'warning';
  message: string;
}

const MARKER = /\[!code highlight\]|#region\b/;

function checkTab(
  rootDir: string,
  pageId: string,
  tab: IdeTabConfig,
  label: string,
  problems: Problem[],
): void {
  const fullPath = join(rootDir, tab.filePath);

  if (!existsSync(fullPath)) {
    problems.push({
      pageId,
      file: tab.filePath,
      severity: 'error',
      message: `${label}: file does not exist`,
    });
    return;
  }

  const lines = readFileSync(fullPath, 'utf-8').replace(/\r\n/g, '\n').split('\n');
  const total = lines.length;

  if (tab.startLine < 1 || tab.startLine > tab.endLine) {
    problems.push({
      pageId,
      file: tab.filePath,
      severity: 'error',
      message: `${label}: invalid range ${tab.startLine}-${tab.endLine}`,
    });
    return;
  }

  if (tab.endLine > total) {
    problems.push({
      pageId,
      file: tab.filePath,
      severity: 'error',
      message: `${label}: range ${tab.startLine}-${tab.endLine} runs past end of file (${total} lines)`,
    });
    return;
  }

  const fileHasMarkers = lines.some((l) => MARKER.test(l));
  if (!fileHasMarkers) return;

  const rangeCoversMarker = lines
    .slice(tab.startLine - 1, tab.endLine)
    .some((l) => MARKER.test(l));

  if (!rangeCoversMarker) {
    const markerLines = lines
      .map((l, i) => (MARKER.test(l) ? i + 1 : 0))
      .filter(Boolean)
      .join(', ');
    problems.push({
      pageId,
      file: tab.filePath,
      severity: 'warning',
      message:
        `${label}: range ${tab.startLine}-${tab.endLine} covers no marked line ` +
        `(markers at ${markerLines}) -- the range may have drifted`,
    });
  }
}

/**
 * @returns Process exit code: 1 if any hard error was found, else 0.
 */
export function verifyConfig(rootDir: string): number {
  const problems: Problem[] = [];
  const seenIds = new Set<string>();
  const seenFilenames = new Set<string>();

  for (const page of PAGES) {
    if (seenIds.has(page.id)) {
      problems.push({
        pageId: page.id,
        file: '-',
        severity: 'error',
        message: 'duplicate page id',
      });
    }
    seenIds.add(page.id);

    const filename = page.filename ?? page.id;
    if (seenFilenames.has(filename)) {
      problems.push({
        pageId: page.id,
        file: '-',
        severity: 'error',
        message: `duplicate output filename "${filename}" -- one recording overwrites the other`,
      });
    }
    seenFilenames.add(filename);

    checkTab(
      rootDir,
      page.id,
      { filePath: page.ideFile, startLine: page.startLine, endLine: page.endLine },
      'primary',
      problems,
    );

    (page.extraTabs ?? []).forEach((tab, i) => {
      checkTab(rootDir, page.id, tab, `extraTabs[${i}]`, problems);
    });

    if (page.prompts?.length && page.prompts[0] !== page.prompt) {
      problems.push({
        pageId: page.id,
        file: '-',
        severity: 'warning',
        message: 'prompts[0] differs from prompt -- one of them is stale',
      });
    }
  }

  const errors = problems.filter((p) => p.severity === 'error');
  const warnings = problems.filter((p) => p.severity === 'warning');

  console.log(`\n🔎 CONFIG VERIFICATION (${PAGES.length} pages)\n`);

  if (problems.length === 0) {
    console.log(`   ✅ All page configs resolve: files exist, ranges are in bounds,`);
    console.log(`      and every marked range still covers a highlighted line.\n`);
    return 0;
  }

  for (const p of problems) {
    const badge = p.severity === 'error' ? '❌' : '⚠️ ';
    console.log(`   ${badge} [${p.pageId}] ${p.file}`);
    console.log(`        ${p.message}`);
  }

  console.log(`\n   ${errors.length} error(s), ${warnings.length} warning(s)\n`);
  return errors.length > 0 ? 1 : 0;
}
