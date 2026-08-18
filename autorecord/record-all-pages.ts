/**
 * Automated Screen Recording & Demonstration Pipeline
 * Entrypoint & CLI runner
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES } from './recorder/config';
import { RecordingEngine } from './recorder/engine';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

interface PageResult {
  id: string;
  name: string;
  filename: string;
  success: boolean;
  durationSec: number;
  error?: string;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isListMode =
    args.includes('--list') ||
    args.includes('-l') ||
    args.includes('list') ||
    args.includes('--help') ||
    args.includes('-h');

  if (isListMode) {
    console.log(`\n📋 REGISTERED RECORDING ROUTES (${PAGES.length} total):\n`);
    for (let i = 0; i < PAGES.length; i++) {
      const p = PAGES[i];
      console.log(`  ${String(i + 1).padStart(2, ' ')}. [${p.id}] ${p.name}`);
      console.log(`      Command: npm run record -- --${p.id}`);
      console.log(`      Doc:     ${p.docUrl}`);
      console.log(`      Demo:    ${p.demoUrl}`);
      console.log(`      File:    ${p.ideFile} (lines ${p.startLine}-${p.endLine})`);
    }
    console.log('');
    return;
  }

  // 1. Check for explicit --page=xxx or --page xxx
  let pageArg: string | undefined = args
    .find((a) => a.startsWith('--page='))
    ?.split('=')[1];
  if (!pageArg) {
    const pageIndex = args.indexOf('--page');
    if (pageIndex !== -1 && args[pageIndex + 1]) {
      pageArg = args[pageIndex + 1];
    }
  }

  // 2. Check for direct page flag like --quickstart, -quickstart, --slots, etc.
  if (!pageArg) {
    for (const arg of args) {
      const cleanArg = arg.replace(/^-+/, '').toLowerCase();
      const matchedPage = PAGES.find((p) => p.id.toLowerCase() === cleanArg);
      if (matchedPage) {
        pageArg = matchedPage.id;
        break;
      }
    }
  }

  // 3. Check for positional argument matching a page ID (e.g. `npm run record quickstart`)
  if (!pageArg) {
    for (const arg of args) {
      if (!arg.startsWith('-')) {
        const cleanArg = arg.toLowerCase();
        const matchedPage = PAGES.find((p) => p.id.toLowerCase() === cleanArg);
        if (matchedPage) {
          pageArg = matchedPage.id;
          break;
        }
      }
    }
  }

  // 4. Check for filter flag: --filter=xxx or --filter xxx
  let filterArg: string | undefined = args
    .find((a) => a.startsWith('--filter='))
    ?.split('=')[1];
  if (!filterArg) {
    const filterIndex = args.indexOf('--filter');
    if (filterIndex !== -1 && args[filterIndex + 1]) {
      filterArg = args[filterIndex + 1];
    }
  }

  let targetPages = PAGES;
  if (pageArg) {
    targetPages = PAGES.filter(
      (p) => p.id.toLowerCase() === pageArg!.toLowerCase(),
    );
  } else if (filterArg) {
    const q = filterArg.toLowerCase();
    targetPages = PAGES.filter(
      (p) => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  } else if (args.length > 0) {
    const query = args[0].replace(/^-+/, '').toLowerCase();
    targetPages = PAGES.filter(
      (p) => p.id.toLowerCase().includes(query) || p.name.toLowerCase().includes(query),
    );
  }

  if (targetPages.length === 0) {
    console.error(`❌ No matching page found for query: ${args.join(' ')}`);
    console.log(`Available page IDs: ${PAGES.map((p) => p.id).join(', ')}`);
    console.log(`Tip: run \`npm run record -- --list\` to view all routes.`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(
    `🎬 STARTING AUTOMATED RECORDING FOR ${targetPages.length} PAGE(S)`,
  );
  console.log(`======================================================\n`);

  const engine = new RecordingEngine(ROOT);
  const results: PageResult[] = [];
  const suiteStartTime = Date.now();

  for (const pageConfig of targetPages) {
    const pageStartTime = Date.now();
    const res = await engine.recordPage(pageConfig);
    const durationSec = Number(((Date.now() - pageStartTime) / 1000).toFixed(1));

    results.push({
      id: pageConfig.id,
      name: pageConfig.name,
      filename: res.filename,
      success: res.success,
      durationSec,
      error: res.error,
    });
  }

  const totalDuration = ((Date.now() - suiteStartTime) / 1000).toFixed(1);
  const failedCount = results.filter((r) => !r.success).length;

  console.log(`\n======================================================`);
  console.log(`📊 RECORDING SUITE SUMMARY (Total: ${totalDuration}s)`);
  console.log(`======================================================`);
  for (const r of results) {
    if (r.success) {
      console.log(`   ✅ [PASS] (${r.durationSec}s) ${r.name} -> ${r.filename}`);
    } else {
      console.log(
        `   ❌ [FAIL] (${r.durationSec}s) ${r.name} -> ${r.filename} (${r.error || 'Error captured'})`,
      );
    }
  }
  console.log(`======================================================`);
  console.log(`📁 Video files saved to: ${join(ROOT, 'autorecord', 'videos')}\n`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal recording error:', err);
  process.exit(1);
});
