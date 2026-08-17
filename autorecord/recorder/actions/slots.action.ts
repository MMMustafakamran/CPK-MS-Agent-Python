import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler } from '../types';

export const runSlotsAction: PageActionHandler = async (page: Page) => {
  // 1/3: Level 1 (Tailwind classes)
  console.log(`   [Slots] 1/3: Demonstrating Level 1 (Tailwind classes)...`);
  const inputLocator1 = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator1.waitFor({ timeout: 8000 });
  const inputBox1 = await inputLocator1.boundingBox();
  if (inputBox1) {
    await humanGlide(page, inputBox1.x + 80, inputBox1.y + inputBox1.height / 2, 20);
    await humanClick(page);
  }
  const prompt1 = 'Hello from customized slots level 1!';
  for (const c of prompt1) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');
  console.log(`   Waiting for Level 1 response...`);
  await sleep(6500);

  // 2/3: Level 2 (Props override)
  console.log(`   [Slots] 2/3: Switching to Level 2 (Props override)...`);
  const tab2 = page.locator('button:has-text("2 · Props override")');
  const t2Box = await tab2.boundingBox();
  if (t2Box) {
    await humanGlide(page, t2Box.x + t2Box.width / 2, t2Box.y + t2Box.height / 2, 20);
    await humanClick(page);
  }
  await sleep(1500);
  const inputLocator2 = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator2.waitFor({ timeout: 6000 }).catch(() => {});
  const inputBox2 = await inputLocator2.boundingBox();
  if (inputBox2) {
    await humanGlide(page, inputBox2.x + 80, inputBox2.y + inputBox2.height / 2, 20);
    await humanClick(page);
  }
  const prompt2 = 'Hello from slot level 2 props override!';
  for (const c of prompt2) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');
  console.log(`   Waiting for Level 2 response...`);
  await sleep(6500);

  // 3/3: Level 3 (Custom component)
  console.log(`   [Slots] 3/3: Switching to Level 3 (Custom component)...`);
  const tab3 = page.locator('button:has-text("3 · Custom component")');
  const t3Box = await tab3.boundingBox();
  if (t3Box) {
    await humanGlide(page, t3Box.x + t3Box.width / 2, t3Box.y + t3Box.height / 2, 20);
    await humanClick(page);
  }
  await sleep(1500);
  const inputLocator3 = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator3.waitFor({ timeout: 6000 }).catch(() => {});
  const inputBox3 = await inputLocator3.boundingBox();
  if (inputBox3) {
    await humanGlide(page, inputBox3.x + 80, inputBox3.y + inputBox3.height / 2, 20);
    await humanClick(page);
  }
  const prompt3 = 'Hello from slot level 3 custom component!';
  for (const c of prompt3) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');
  console.log(`   Waiting for Level 3 response...`);
  await sleep(7000);
};
