import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runHitlAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Human in the Loop] Typing prompt to trigger approval gate...`);
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

  console.log(`   Waiting for Approval Required card to render in stream...`);
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          text.includes('Approval required') ||
          text.includes('rm -rf') ||
          document.querySelectorAll('button:has-text("Approve"), button:has-text("Deny")').length > 0
        );
      },
      { timeout: 18000 },
    )
    .catch(() => {});

  await sleep(3500);

  // Locate the Approve button
  const approveBtn = page.locator('button:has-text("Approve")').first();
  if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    const abBox = await approveBtn.boundingBox();
    if (abBox) {
      console.log(`   🎯 Detected Approve button at (${Math.round(abBox.x)}, ${Math.round(abBox.y)})`);
      await humanGlide(page, abBox.x + abBox.width / 2, abBox.y + abBox.height / 2, 20);
      await sleep(600);
      await humanClick(page);
      console.log(`   ✓ Clicked Approve button!`);
      await sleep(4000);
    }
  }

  // Detect and glide over the final assistant response
  const assistantLocator = page
    .locator('.copilotKitAssistantMessage, [data-message-role="assistant"]')
    .last();
  if (await assistantLocator.isVisible({ timeout: 4000 }).catch(() => false)) {
    const respBox = await assistantLocator.boundingBox();
    if (respBox) {
      await humanGlide(page, respBox.x + Math.min(respBox.width / 2, 250), respBox.y + 30, 22);
    }
  }

  await sleep(config.waitAfterPromptMs ?? 6000);
};
