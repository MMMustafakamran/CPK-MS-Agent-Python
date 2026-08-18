import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { waitForAgentResponseCompletion } from './index';

export const runToolRenderingAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Tool Rendering] Prompting for weather to trigger custom renderer...`);
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

  console.log(`   ⏳ Actively detecting AI agent response & custom tool rendering...`);
  // Look for custom weather tool rendered element and glide cursor over it
  const weatherElement = page
    .locator('p:has-text("weather API"), div:has-text("Tokyo"), .copilotKitAssistantMessage')
    .first();
  await weatherElement.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await sleep(1500);

  if (await weatherElement.isVisible({ timeout: 5000 }).catch(() => false)) {
    const weBox = await weatherElement.boundingBox();
    if (weBox) {
      console.log(`   🎯 Detected rendered weather tool call at (${Math.round(weBox.x)}, ${Math.round(weBox.y)})`);
      await humanGlide(page, weBox.x + Math.min(weBox.width / 2, 250), weBox.y + weBox.height / 2, 22);
      await sleep(2500);
    }
  }

  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000);
};

