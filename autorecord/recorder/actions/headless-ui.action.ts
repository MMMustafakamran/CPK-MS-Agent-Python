import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runHeadlessUiAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Headless UI] Waiting for custom headless interface to settle...`);
  await page.waitForSelector('input[placeholder="Type a message..."], input', {
    state: 'visible',
    timeout: 15000,
  });
  await sleep(800);

  const inputLocator = page
    .locator('input[placeholder="Type a message..."], input')
    .first();
  await inputLocator.scrollIntoViewIfNeeded();

  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(page, inputBox.x + 80, inputBox.y + inputBox.height / 2, 20);
    await humanClick(page);
  } else {
    await inputLocator.click();
  }
  await sleep(400);

  // Type the prompt visibly
  console.log(`   [Headless UI] Typing prompt: "${config.prompt}"...`);
  for (const c of config.prompt) await page.keyboard.type(c, { delay: 45 });
  await sleep(500);

  // Ensure input state is populated
  const val = await inputLocator.inputValue().catch(() => '');
  if (!val && config.prompt) {
    await inputLocator.fill(config.prompt);
    await sleep(200);
  }

  // Click the Send button
  const sendBtn = page
    .locator('button:has-text("Send"), button[type="submit"]')
    .first();
  if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    const sbBox = await sendBtn.boundingBox();
    if (sbBox) {
      await humanGlide(page, sbBox.x + sbBox.width / 2, sbBox.y + sbBox.height / 2, 18);
      await humanClick(page);
    } else {
      await sendBtn.click();
    }
  } else {
    await page.keyboard.press('Enter');
  }

  // Double check if submit went through
  await sleep(800);
  const remaining = await inputLocator.inputValue().catch(() => '');
  if (remaining.trim().length > 0) {
    await page.keyboard.press('Enter');
  }

  console.log(`   ⏳ Actively detecting Headless UI assistant response bubble...`);
  await page
    .waitForFunction(
      () => {
        const bubbles = document.querySelectorAll('.max-w-md, p');
        const text = document.body.innerText;
        return (
          bubbles.length >= 2 ||
          text.includes('London') ||
          text.includes('weather') ||
          text.includes('degrees') ||
          text.includes('temperature')
        );
      },
      { timeout: 18000 },
    )
    .catch(() => {});

  await sleep(4000);

  // Glide cursor over the rendered assistant message
  const assistantBubble = page.locator('.max-w-md:not(:first-child)').last();
  if (await assistantBubble.isVisible({ timeout: 4000 }).catch(() => false)) {
    const abBox = await assistantBubble.boundingBox();
    if (abBox) {
      console.log(
        `   🎯 Detected Headless UI assistant message at (${Math.round(abBox.x)}, ${Math.round(abBox.y)})`,
      );
      await humanGlide(page, abBox.x + abBox.width / 2, abBox.y + 25, 22);
    }
  } else {
    await humanGlide(page, 960, 400, 25);
  }

  await sleep(config.waitAfterPromptMs ?? 6000);
};
