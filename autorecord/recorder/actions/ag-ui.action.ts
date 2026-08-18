import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { getAssistantMessageCount, waitForAgentResponseCompletion } from './index';

export const runAgUiAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [AG-UI] Sending message to capture live SSE event stream...`);
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator.waitFor({ timeout: 8000 });
  const msgCount = await getAssistantMessageCount(page);
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(page, inputBox.x + 80, inputBox.y + inputBox.height / 2, 20);
    await humanClick(page);
  }
  await page.keyboard.type(config.prompt, { delay: 35 });
  await sleep(300);
  await page.keyboard.press('Enter');

  console.log(`   Showcasing live AG-UI event log stream (RUN_STARTED -> TEXT_MESSAGE_CONTENT -> TOOL_CALL -> RUN_FINISHED)...`);
  // Move cursor over event log panel on the left while events stream
  await sleep(1500);
  await humanGlide(page, 450, 300, 22);
  await sleep(1500);
  await humanGlide(page, 450, 550, 22);

  // Complete waiting for agent response
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
};
