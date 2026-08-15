import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runFrontendToolsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Frontend Tools] Attaching browser dialog listener...`);
  page.once('dialog', async (dialog) => {
    console.log(`   📢 Browser Alert Triggered: "${dialog.message()}"`);
    await sleep(1500);
    await dialog.accept();
    console.log(`   ✓ Alert accepted by user simulation.`);
  });

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

  console.log(`   Waiting for browser tool execution and agent confirmation...`);
  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 7000);
};
