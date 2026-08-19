import { type Page } from 'playwright';
import { humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { sendPrompt, waitForAgentResponseCompletion } from './index';

export const runAgentAppContextAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Agent App Context] Sending prompt "${config.prompt}"...`);
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
};
