import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler } from '../types';

export const runChatUiAction: PageActionHandler = async (page: Page) => {
  // 1/4: Demonstrating Inline Chat tab
  console.log(`   [Chat UI] 1/4: Demonstrating Inline Chat tab...`);
  const inputLocator1 = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator1.waitFor({ timeout: 8000 });
  const inputBox1 = await inputLocator1.boundingBox();
  if (inputBox1) {
    await humanGlide(
      page,
      inputBox1.x + 80,
      inputBox1.y + inputBox1.height / 2,
      20,
    );
    await humanClick(page);
  }
  const prompt1 = 'Hello! How can you help me today?';
  for (const c of prompt1) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');
  console.log(`   Waiting for Inline Chat response...`);
  await sleep(8000);

  // 2/4: Demonstrating Custom Assistant Message tab
  console.log(`   [Chat UI] 2/4: Demonstrating Custom Assistant Message tab...`);
  const tab2 = page.locator('button:has-text("Custom assistant message")');
  const t2Box = await tab2.boundingBox();
  if (t2Box) {
    await humanGlide(
      page,
      t2Box.x + t2Box.width / 2,
      t2Box.y + t2Box.height / 2,
      20,
    );
    await humanClick(page);
  }
  await sleep(1200);
  const inputLocator2 = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  const inputBox2 = await inputLocator2.boundingBox();
  if (inputBox2) {
    await humanGlide(
      page,
      inputBox2.x + 80,
      inputBox2.y + inputBox2.height / 2,
      20,
    );
    await humanClick(page);
  }
  const prompt2 = 'Tell me a fun fact about programming in 1 sentence.';
  for (const c of prompt2) await page.keyboard.type(c, { delay: 45 });
  await sleep(400);
  await page.keyboard.press('Enter');
  console.log(`   Waiting for Custom Assistant Message response...`);
  await sleep(8000);

  // 3/4: Demonstrating Popup surface
  console.log(`   [Chat UI] 3/4: Demonstrating Popup surface...`);
  const tab3 = page.locator('button:has-text("Popup")');
  const t3Box = await tab3.boundingBox();
  if (t3Box) {
    await humanGlide(
      page,
      t3Box.x + t3Box.width / 2,
      t3Box.y + t3Box.height / 2,
      20,
    );
    await humanClick(page);
  }
  await sleep(1000);
  const openPopupBtn = page.locator('button:has-text("Open popup")').first();
  if (await openPopupBtn.isVisible()) {
    const opBox = await openPopupBtn.boundingBox();
    if (opBox) {
      await humanGlide(
        page,
        opBox.x + opBox.width / 2,
        opBox.y + opBox.height / 2,
        15,
      );
      await humanClick(page);
    }
  }
  await sleep(1500);
  await humanGlide(page, 1600, 700, 25);
  console.log(`   Popup open — showcasing floating chat surface...`);
  await sleep(4000);

  // 4/4: Demonstrating Sidebar surface
  console.log(`   [Chat UI] 4/4: Demonstrating Sidebar surface...`);
  const tab4 = page.locator('button:has-text("Sidebar")');
  const t4Box = await tab4.boundingBox();
  if (t4Box) {
    await humanGlide(
      page,
      t4Box.x + t4Box.width / 2,
      t4Box.y + t4Box.height / 2,
      20,
    );
    // 1st click: closes the open popup via clickOutsideToClose
    await humanClick(page);
    console.log(`   1st click on Sidebar tab (closes open popup)...`);
    await sleep(400);
    // 2nd click: activates the Sidebar tab
    await humanClick(page);
    console.log(`   2nd click on Sidebar tab (switches to Sidebar view)...`);
  }
  await sleep(1200);

  // Click 'Open sidebar' button
  const openSidebarBtn = page
    .locator('button:has-text("Open sidebar")')
    .first();
  if (await openSidebarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    const osBox = await openSidebarBtn.boundingBox();
    if (osBox) {
      await humanGlide(
        page,
        osBox.x + osBox.width / 2,
        osBox.y + osBox.height / 2,
        15,
      );
      await humanClick(page);
      console.log(`   Clicked 'Open sidebar' button...`);
    }
  }
  await sleep(1500);

  // Glide mouse to center of the opened docked sidebar
  await humanGlide(page, 1680, 500, 25);
  console.log(`   Sidebar open — showcasing 480px docked panel...`);
  await sleep(4000);
};
