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
  error?: string;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const pageArg = args.find((a) => a.startsWith('--page='))?.split('=')[1];

  const targetPages = pageArg
    ? PAGES.filter((p) => p.id.toLowerCase() === pageArg.toLowerCase())
    : PAGES;

  if (targetPages.length === 0) {
    console.error(`❌ No matching page found for: ${pageArg}`);
    console.log(`Available pages: ${PAGES.map((p) => p.id).join(', ')}`);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(
    `🎬 STARTING AUTOMATED RECORDING FOR ${targetPages.length} PAGE(S)`,
  );
  console.log(`======================================================\n`);

  const engine = new RecordingEngine(ROOT);
  const results: PageResult[] = [];

  for (const pageConfig of targetPages) {
    const res = await engine.recordPage(pageConfig);
    results.push({
      id: pageConfig.id,
      name: pageConfig.name,
      filename: res.filename,
      success: res.success,
      error: res.error,
    });
  }

  console.log(`\n======================================================`);
  console.log(`📊 RECORDING SUITE SUMMARY`);
  console.log(`======================================================`);
  for (const r of results) {
    if (r.success) {
      console.log(`   ✅ [PASS] ${r.name} -> ${r.filename}`);
    } else {
      console.log(
        `   ❌ [FAIL] ${r.name} -> ${r.filename} (${r.error || 'Error captured'})`,
      );
    }
  }
  console.log(`======================================================`);
  console.log(`📁 Video files saved to: ${join(ROOT, 'autorecord', 'videos')}\n`);
}

main().catch((err) => {
  console.error('Fatal recording error:', err);
  process.exit(1);
});
