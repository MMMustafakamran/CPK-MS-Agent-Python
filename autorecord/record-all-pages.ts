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
  const isListMode = args.includes('--list');
  const pageArg = args.find((a) => a.startsWith('--page='))?.split('=')[1];
  const filterArg = args.find((a) => a.startsWith('--filter='))?.split('=')[1];

  if (isListMode) {
    console.log(`\n📋 REGISTERED RECORDING ROUTES (${PAGES.length} total):\n`);
    for (let i = 0; i < PAGES.length; i++) {
      const p = PAGES[i];
      console.log(`  ${String(i + 1).padStart(2, ' ')}. [${p.id}] ${p.name}`);
      console.log(`      Doc:  ${p.docUrl}`);
      console.log(`      Demo: ${p.demoUrl}`);
      console.log(`      File: ${p.ideFile} (lines ${p.startLine}-${p.endLine})`);
    }
    console.log('');
    return;
  }

  let targetPages = PAGES;
  if (pageArg) {
    targetPages = PAGES.filter((p) => p.id.toLowerCase() === pageArg.toLowerCase());
  } else if (filterArg) {
    const q = filterArg.toLowerCase();
    targetPages = PAGES.filter(
      (p) => p.id.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
    );
  }

  if (targetPages.length === 0) {
    console.error(`❌ No matching page found for query: ${pageArg || filterArg}`);
    console.log(`Available page IDs: ${PAGES.map((p) => p.id).join(', ')}`);
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
