import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runDisplayOnlyAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Display Only Component] Prompting agent to render WeatherCard component...`);
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

  console.log(`   Waiting for generative WeatherCard to render inline in chat...`);
  const weatherCard = page.locator('div:has-text("Tokyo"), div:has-text("77°F")').last();
  await weatherCard.waitFor({ state: 'visible', timeout: 25000 }).catch(() => {});
  await sleep(1500);

  // Look for rendered WeatherCard and highlight
  if (await weatherCard.isVisible({ timeout: 5000 }).catch(() => false)) {
    const wcBox = await weatherCard.boundingBox();
    if (wcBox) {
      console.log(`   🎯 Detected rendered WeatherCard at (${Math.round(wcBox.x)}, ${Math.round(wcBox.y)})`);
      await humanGlide(page, wcBox.x + wcBox.width / 2, wcBox.y + wcBox.height / 2, 22);
      await sleep(3500);
    }
  }

  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 6000);
};

