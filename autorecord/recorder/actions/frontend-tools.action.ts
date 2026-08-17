import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

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
  for (const c of config.prompt) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');

  console.log(`   Waiting for browser tool execution and assistant confirmation...`);
  await page
    .waitForFunction(
      () => {
        const assistantMsgs = document.querySelectorAll(
          '.copilotKitAssistantMessage, [data-message-role="assistant"]',
        );
        return assistantMsgs.length > 0;
      },
      { timeout: 18000 },
    )
    .catch(() => {});

  await sleep(4000);

  // Glide cursor over the rendered assistant confirmation message
  const assistantLocator = page
    .locator('.copilotKitAssistantMessage, [data-message-role="assistant"]')
    .last();
  if (await assistantLocator.isVisible({ timeout: 4000 }).catch(() => false)) {
    const abBox = await assistantLocator.boundingBox();
    if (abBox) {
      console.log(
        `   🎯 Detected assistant tool confirmation at (${Math.round(abBox.x)}, ${Math.round(abBox.y)})`,
      );
      await humanGlide(
        page,
        abBox.x + Math.min(abBox.width / 2, 200),
        abBox.y + 30,
        25,
      );
    }
  } else {
    await humanGlide(page, 960, 500, 25);
  }

  await sleep(config.waitAfterPromptMs ?? 5000);
};
