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

  for (const pageConfig of targetPages) {
    await engine.recordPage(pageConfig);
  }

  console.log(
    `\n🎉 ALL RECORDINGS FINISHED! Output files in: ${join(ROOT, 'recordings')}`,
  );
}

main().catch((err) => {
  console.error('Fatal recording error:', err);
  process.exit(1);
});
