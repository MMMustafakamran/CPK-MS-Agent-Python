import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runProgrammaticAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Programmatic Control] 1/2: Toggling Dark Mode in agent.state...`);
  const darkModeBtn = page.locator('button:has-text("Dark Mode")').first();
  if (await darkModeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    const dmBox = await darkModeBtn.boundingBox();
    if (dmBox) {
      await humanGlide(page, dmBox.x + dmBox.width / 2, dmBox.y + dmBox.height / 2, 20);
      await humanClick(page);
      console.log(`   Clicked Dark Mode!`);
      await sleep(1500);
    }
  }

  console.log(`   [Programmatic Control] 2/2: Sending draft message and running agent explicitly...`);
  const inputLocator = page.locator('input[placeholder="Message to send"]').first();
  if (await inputLocator.isVisible()) {
    const inBox = await inputLocator.boundingBox();
    if (inBox) {
      await humanGlide(page, inBox.x + 80, inBox.y + inBox.height / 2, 20);
      await humanClick(page);
    }
    // Clear and type
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    for (const c of config.prompt) await page.keyboard.type(c, { delay: 45 });
    await sleep(400);
  }

  const runBtn = page.locator('button:has-text("Run agent")').first();
  const rbBox = await runBtn.boundingBox();
  if (rbBox) {
    await humanGlide(page, rbBox.x + rbBox.width / 2, rbBox.y + rbBox.height / 2, 18);
    await humanClick(page);
  } else {
    await page.keyboard.press('Enter');
  }

  console.log(`   Waiting for Programmatic Control run to complete...`);
  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 8000);
};
