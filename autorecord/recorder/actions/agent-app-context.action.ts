import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { waitForAgentResponseCompletion } from './index';

export const runAgentAppContextAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Agent App Context] Sending prompt "Who are my colleagues?"...`);
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator.waitFor({ state: 'visible', timeout: 12000 });
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(page, inputBox.x + 80, inputBox.y + inputBox.height / 2, 20);
    await humanClick(page);
  }
  await page.keyboard.type(config.prompt, { delay: 35 });
  await sleep(300);
  await page.keyboard.press('Enter');

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
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000);
};

