import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import {
  closeNotepad,
  openNotepad,
  typeInNotepad,
} from '../core/overlays/notepad';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { formatCopilotKitVersionLine } from '../core/versions';

/**
 * The defect this page records: the colleagues list is registered and goes out
 * on run_started, but the agent answers as if it has no context. Written out in
 * Notepad at the end of the take so the video carries the report with it.
 *
 * Built per run, not as a module constant, so the version line reflects the
 * packages this recording actually exercised.
 */
function buildIssueNote(): string {
  const versionLine = formatCopilotKitVersionLine();

  return [
    'Readables - ms-agent-framework-python',
    '',
    'Using the exact useAgentContext example from the docs. The colleagues list',
    'is registered and gets sent on run_started, but the agent still asks which',
    'colleagues I mean - it does not know Jane Smith is one of them.',
    // Dropped rather than guessed at when the versions cannot be read.
    ...(versionLine ? ['', versionLine] : []),
  ].join('\n');
}

export const runReadablesAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Readables] Sending prompt "${config.prompt}"...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // Glide cursor over the shared context list on the left
  await sleep(1500);
  const contextList = page.locator('ul, li:has-text("John Doe")').first();
  if (await contextList.isVisible({ timeout: 4000 }).catch(() => false)) {
    const clBox = await contextList.boundingBox();
    if (clBox) {
      console.log(`   🎯 Highlighted shared context list at (${Math.round(clBox.x)}, ${Math.round(clBox.y)})`);
      await humanGlide(page, clBox.x + 120, clBox.y + 40, 22);
      await sleep(2000);
    }
  }

  // Actively wait for assistant response citing colleagues context
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);

  console.log(`   [Readables] Writing the issue note in Notepad...`);
  await sleep(1200);
  await openNotepad(page, 'readables-issue.txt');
  await typeInNotepad(page, buildIssueNote());
  await closeNotepad(page);
};
