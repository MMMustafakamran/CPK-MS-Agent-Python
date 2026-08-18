import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { waitForAgentResponseCompletion } from './index';

export const runAuthAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Authentication] Highlighting auth configuration panel...`);
  await sleep(1500);

  // Glide cursor over the auth verdict card on the left
  const verdictCard = page
    .locator(
      'div[class*="border-emerald"], div[class*="border-amber"], div[class*="border-rose"], h2:has-text("Current configuration")',
    )
    .first();
  if (await verdictCard.isVisible({ timeout: 4000 }).catch(() => false)) {
    const vcBox = await verdictCard.boundingBox();
    if (vcBox) {
      console.log(
        `   🎯 Detected Auth configuration card at (${Math.round(vcBox.x)}, ${Math.round(vcBox.y)})`,
      );
      await humanGlide(page, vcBox.x + 100, vcBox.y + 40, 22);
      await sleep(2500);
    }
  }

  // Type message in chat on the right
  console.log(`   Sending test chat message through auth pipeline...`);
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator.waitFor({ state: 'visible', timeout: 12000 });
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(
      page,
      inputBox.x + 80,
      inputBox.y + inputBox.height / 2,
      20,
    );
    await humanClick(page);
  }
  for (const c of config.prompt) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');

  // Actively wait for streaming response to stabilize and finish
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 6000);
};

