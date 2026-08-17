import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runSharedStateAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  // If we are on the in-app-agent-write page, demonstrate clicking the toggle & rerun button
  if (config.id === 'in-app-agent-write') {
    console.log(`   [Shared State Write] Clicking Toggle + re-run agent button...`);
    const toggleRerunBtn = page.locator('button:has-text("Toggle + re-run agent")').first();
    if (await toggleRerunBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      const tbBox = await toggleRerunBtn.boundingBox();
      if (tbBox) {
        await humanGlide(page, tbBox.x + tbBox.width / 2, tbBox.y + tbBox.height / 2, 20);
        await humanClick(page);
        console.log(`   Clicked 'Toggle + re-run agent'!`);
        await sleep(6000);
      }
    }
  }

  // Next, type prompt into chat
  console.log(`   [Shared State] Prompting agent in chat...`);
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

  console.log(`   Waiting for State Synchronization response...`);
  await humanGlide(page, 450, 300, 25);
  await sleep(config.waitAfterPromptMs ?? 8000);
};
