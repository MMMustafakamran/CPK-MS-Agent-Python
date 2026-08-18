import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { waitForAgentResponseCompletion } from './index';

export const runHitlAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Human in the Loop] Typing prompt to trigger approval gate...`);
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator.waitFor({ state: 'visible', timeout: 12000 });
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(page, inputBox.x + 80, inputBox.y + inputBox.height / 2, 20);
    await humanClick(page);
  }
  for (const c of config.prompt) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');

  console.log(`   Waiting for Approval Required card to render in stream...`);
  const approveBtn = page.locator('button:has-text("Approve")').first();
  await approveBtn.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await sleep(1500);

  // Locate and click the Approve button
  if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    const abBox = await approveBtn.boundingBox();
    if (abBox) {
      console.log(`   🎯 Detected Approve button at (${Math.round(abBox.x)}, ${Math.round(abBox.y)})`);
      await humanGlide(page, abBox.x + abBox.width / 2, abBox.y + abBox.height / 2, 20);
      await sleep(600);
      await humanClick(page);
      console.log(`   ✓ Clicked Approve button!`);
    }
  }

  // Actively wait for final streaming response after approval
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 6000);
};

