import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { waitForAgentResponseCompletion } from './index';

export const runStateRenderingAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [State Rendering] Sending prompt to stream searches state...`);
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

  // Glide cursor over the rendered searches list on the left as it streams
  await sleep(2000);
  const searchesList = page.locator('div:has-text("Searches (rendered outside the chat)") + div, h2:has-text("Searches")').first();
  if (await searchesList.isVisible({ timeout: 4000 }).catch(() => false)) {
    const slBox = await searchesList.boundingBox();
    if (slBox) {
      console.log(`   🎯 Detected streamed Searches UI at (${Math.round(slBox.x)}, ${Math.round(slBox.y)})`);
      await humanGlide(page, slBox.x + 120, slBox.y + 40, 22);
      await sleep(1500);
    }
  }

  // Glide cursor over the raw agent.state JSON pre block
  const rawPre = page.locator('pre').first();
  if (await rawPre.isVisible({ timeout: 3000 }).catch(() => false)) {
    const preBox = await rawPre.boundingBox();
    if (preBox) {
      await humanGlide(page, preBox.x + preBox.width / 2, preBox.y + preBox.height / 2, 22);
      await sleep(1500);
    }
  }

  // Actively wait for search_agent response and state streaming to complete
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000);
};

