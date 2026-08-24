import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import {
  closeNotepad,
  openNotepad,
  typeInNotepad,
} from '../core/overlays/notepad';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

/**
 * The defect this page records: the colleagues list is registered and goes out
 * on run_started, but the agent answers as if it has no context. Written out in
 * Notepad at the end of the take so the video carries the report with it.
 */
const ISSUE_NOTE = [
  'Readables - ms-agent-framework-python',
  '',
  'Using the exact useAgentContext example from the docs. The colleagues list',
  'is registered and gets senton run_started, but the agent still asks which',
  'colleagues I meanit does not know Jane Smith is one of them.',
  '',
  'copilotkit 1.66.2 (react-core, react-ui, runtime,shared',
].join('\n');

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
  await typeInNotepad(page, ISSUE_NOTE);
  await closeNotepad(page);
};
