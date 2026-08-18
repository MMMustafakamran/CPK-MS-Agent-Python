import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { waitForAgentResponseCompletion } from './index';

export const runRuntimeAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  // 1. Send message to my_agent
  console.log(`   [Copilot Runtime] 1/3: Testing 'my_agent' routing...`);
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
  console.log(`   Waiting for 'my_agent' response...`);
  await waitForAgentResponseCompletion(page, 3000);

  // 2. Switch to sample_agent tab
  console.log(`   [Copilot Runtime] 2/3: Switching to 'sample_agent' tab...`);
  const sampleTab = page.locator('button:has-text("sample_agent")').first();
  if (await sampleTab.isVisible().catch(() => false)) {
    const sBox = await sampleTab.boundingBox();
    if (sBox) {
      await humanGlide(page, sBox.x + sBox.width / 2, sBox.y + sBox.height / 2, 20);
      await humanClick(page);
      await sleep(1500);
    }
  }

  // Type a short prompt to sample_agent
  const sampleInput = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  if (await sampleInput.isVisible().catch(() => false)) {
    const siBox = await sampleInput.boundingBox();
    if (siBox) {
      await humanGlide(page, siBox.x + 80, siBox.y + siBox.height / 2, 20);
      await humanClick(page);
      const prompt2 = 'Switch to Spanish';
      for (const c of prompt2) await page.keyboard.type(c, { delay: 45 });
      await sleep(400);
      await page.keyboard.press('Enter');
      await waitForAgentResponseCompletion(page, 3000);
    }
  }

  // 3. Switch to search_agent tab
  console.log(`   [Copilot Runtime] 3/3: Switching to 'search_agent' tab...`);
  const searchTab = page.locator('button:has-text("search_agent")').first();
  if (await searchTab.isVisible().catch(() => false)) {
    const stBox = await searchTab.boundingBox();
    if (stBox) {
      await humanGlide(page, stBox.x + stBox.width / 2, stBox.y + stBox.height / 2, 20);
      await humanClick(page);
      await sleep(1500);
    }
  }

  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 3500);
};

