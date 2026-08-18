import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { waitForAgentResponseCompletion } from './index';

export const runFrontendToolsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Frontend Tools] Sending prompt to trigger browser sayHello tool...`);
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

  // Actively wait for browser tool execution and assistant confirmation
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000);
};

