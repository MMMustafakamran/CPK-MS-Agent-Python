import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler } from '../types';

export const runSlotsAction: PageActionHandler = async (page: Page) => {
  // 1/3: Level 1 (Tailwind classes)
  console.log(`   [Slots] 1/3: Demonstrating Level 1 (Tailwind classes)...`);
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator.waitFor({ timeout: 8000 });
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(page, inputBox.x + 80, inputBox.y + inputBox.height / 2, 20);
    await humanClick(page);
  }
  const prompt1 = 'Hello from Slot customization!';
  for (const c of prompt1) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');
  console.log(`   Waiting for Level 1 response...`);
  await sleep(7000);

  // 2/3: Level 2 (Props override)
  console.log(`   [Slots] 2/3: Switching to Level 2 (Props override)...`);
  const tab2 = page.locator('button:has-text("2 · Props override")');
  const t2Box = await tab2.boundingBox();
  if (t2Box) {
    await humanGlide(page, t2Box.x + t2Box.width / 2, t2Box.y + t2Box.height / 2, 20);
    await humanClick(page);
  }
  await sleep(1500);
  await humanGlide(page, 960, 500, 20);
  await sleep(2500);

  // 3/3: Level 3 (Custom component)
  console.log(`   [Slots] 3/3: Switching to Level 3 (Custom component)...`);
  const tab3 = page.locator('button:has-text("3 · Custom component")');
  const t3Box = await tab3.boundingBox();
  if (t3Box) {
    await humanGlide(page, t3Box.x + t3Box.width / 2, t3Box.y + t3Box.height / 2, 20);
    await humanClick(page);
  }
  await sleep(1500);
  await humanGlide(page, 960, 400, 20);
  await sleep(3500);
};
