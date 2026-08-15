import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runRuntimeAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  // 1. Send message to current agent (my_agent)
  console.log(`   [Copilot Runtime] 1/2: Testing my_agent...`);
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
  console.log(`   Waiting for my_agent response...`);
  await sleep(7000);

  // 2. Switch to sample_agent tab
  console.log(`   [Copilot Runtime] 2/2: Switching to sample_agent...`);
  const sampleTab = page.locator('button:has-text("sample_agent")').first();
  if (await sampleTab.isVisible().catch(() => false)) {
    const sBox = await sampleTab.boundingBox();
    if (sBox) {
      await humanGlide(page, sBox.x + sBox.width / 2, sBox.y + sBox.height / 2, 20);
      await humanClick(page);
      await sleep(2000);
    }
  }

  await humanGlide(page, 960, 500, 25);
  await sleep(3000);
};

export const runAgUiAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [AG-UI] Sending message to capture live event stream...`);
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

  console.log(`   Showcasing live AG-UI event log stream...`);
  // Move cursor over event log panel on the left
  await humanGlide(page, 450, 400, 25);
  await sleep(config.waitAfterPromptMs ?? 8000);
};
