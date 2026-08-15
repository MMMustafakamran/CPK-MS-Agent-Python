import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler } from '../types';

export const runHitlAction: PageActionHandler = async (page: Page, config) => {
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator.waitFor({ timeout: 8000 });
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(
      page,
      inputBox.x + 80,
      inputBox.y + inputBox.height / 2,
      25,
    );
    await humanClick(page);
  }
  for (const char of config.prompt)
    await page.keyboard.type(char, { delay: 45 });
  await sleep(600);
  await page.keyboard.press('Enter');

  console.log(`⏳ Waiting for HITL approval card or response...`);
  await sleep(8000);

  try {
    const approveBtn = page.locator('button:has-text("Approve")').first();
    if (await approveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      const abBox = await approveBtn.boundingBox();
      if (abBox) {
        await humanGlide(
          page,
          abBox.x + abBox.width / 2,
          abBox.y + abBox.height / 2,
          20,
        );
        await humanClick(page);
        console.log(`   Clicked Approve on Decision Card!`);
        await sleep(4000);
      }
    }
  } catch {}
};
