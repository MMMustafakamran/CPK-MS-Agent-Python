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
  for (const c of config.prompt) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');

  console.log(`   Waiting for generative WeatherCard to render inline in chat...`);
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          text.includes('Tokyo') ||
          text.includes('77°F') ||
          text.includes('clear')
        );
      },
      { timeout: 18000 },
    )
    .catch(() => {});

  await sleep(4000);

  // Look for rendered WeatherCard
  const weatherCard = page.locator('div:has-text("Tokyo"), div:has-text("77°F")').last();
  if (await weatherCard.isVisible({ timeout: 5000 }).catch(() => false)) {
    const wcBox = await weatherCard.boundingBox();
    if (wcBox) {
      console.log(`   🎯 Detected rendered WeatherCard at (${Math.round(wcBox.x)}, ${Math.round(wcBox.y)})`);
      await humanGlide(page, wcBox.x + wcBox.width / 2, wcBox.y + wcBox.height / 2, 22);
      await sleep(3000);
    }
  }

  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 5000);
};
