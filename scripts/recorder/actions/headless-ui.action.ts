import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runHeadlessUiAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Headless UI] Demonstrating custom headless chat form...`);
  const inputLocator = page.locator('input[placeholder="Type a message..."]').first();
  await inputLocator.waitFor({ timeout: 8000 });
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(page, inputBox.x + 80, inputBox.y + inputBox.height / 2, 20);
    await humanClick(page);
  } else {
    await inputLocator.click();
  }

  for (const c of config.prompt) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);

  // Click Send button
  const sendBtn = page.locator('button:has-text("Send")').first();
  const btnBox = await sendBtn.boundingBox();
  if (btnBox) {
    await humanGlide(page, btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2, 20);
    await humanClick(page);
  } else {
    await page.keyboard.press('Enter');
  }

  console.log(`   Waiting for Headless UI response...`);
  await humanGlide(page, 960, 450, 25);
  await sleep(config.waitAfterPromptMs ?? 8000);
};
