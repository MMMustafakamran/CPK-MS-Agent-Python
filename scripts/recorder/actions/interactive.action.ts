import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runInteractiveAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Interactive HITL] Typing risky command prompt...`);
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator.waitFor({ timeout: 8000 });
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(page, inputBox.x + 80, inputBox.y + inputBox.height / 2, 20);
    await humanClick(page);
  }
  for (const c of config.prompt) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');

  console.log(`   Waiting for Approval Required card to render...`);
  await sleep(5000);

  // Locate and click Approve button
  const approveBtn = page.locator('button:has-text("Approve")').first();
  if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    const abBox = await approveBtn.boundingBox();
    if (abBox) {
      await humanGlide(page, abBox.x + abBox.width / 2, abBox.y + abBox.height / 2, 20);
      await humanClick(page);
      console.log(`   Clicked Approve on Decision Card!`);
      await sleep(2000);
    }
  }

  console.log(`   Waiting for agent confirmation...`);
  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 6000);
};
