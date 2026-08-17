import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runAgentAppContextAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Agent App Context] Sending prompt "Who are my colleagues?"...`);
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

  // Glide cursor over the shared context list on the left
  await sleep(1500);
  const contextList = page.locator('ul, li:has-text("John Doe")').first();
  if (await contextList.isVisible({ timeout: 4000 }).catch(() => false)) {
    const clBox = await contextList.boundingBox();
    if (clBox) {
      console.log(`   🎯 Highlighted shared context list at (${Math.round(clBox.x)}, ${Math.round(clBox.y)})`);
      await humanGlide(page, clBox.x + 120, clBox.y + 40, 22);
      await sleep(2500);
    }
  }

  console.log(`   Waiting for assistant response citing colleagues context...`);
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          text.includes('John') ||
          text.includes('Jane') ||
          text.includes('Wilson') ||
          document.querySelectorAll('.copilotKitAssistantMessage').length > 0
        );
      },
      { timeout: 18000 },
    )
    .catch(() => {});

  await sleep(4000);

  // Glide cursor over the rendered assistant response
  const assistantLocator = page
    .locator('.copilotKitAssistantMessage, [data-message-role="assistant"]')
    .last();
  if (await assistantLocator.isVisible({ timeout: 4000 }).catch(() => false)) {
    const respBox = await assistantLocator.boundingBox();
    if (respBox) {
      await humanGlide(page, respBox.x + Math.min(respBox.width / 2, 200), respBox.y + 30, 22);
    }
  }

  await sleep(config.waitAfterPromptMs ?? 5000);
};
