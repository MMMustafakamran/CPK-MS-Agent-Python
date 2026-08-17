import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runAgUiAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [AG-UI] Sending message to capture live SSE event stream...`);
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

  console.log(`   Showcasing live AG-UI event log stream (RUN_STARTED -> TEXT_MESSAGE_CONTENT -> TOOL_CALL -> RUN_FINISHED)...`);
  // Move cursor over event log panel on the left
  await sleep(2500);
  await humanGlide(page, 450, 300, 25);
  await sleep(3000);
  await humanGlide(page, 450, 600, 25);
  await sleep(config.waitAfterPromptMs ?? 8000);
};
