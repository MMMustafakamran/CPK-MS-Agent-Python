import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';

export const runSharedStateReadAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Shared State Read] Sending prompt to switch language in agent.state...`);
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

  console.log(`   Waiting for state to stream into left panel...`);
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          text.includes('spanish') ||
          text.includes('Spanish') ||
          document.querySelectorAll('.copilotKitAssistantMessage').length > 0
        );
      },
      { timeout: 18000 },
    )
    .catch(() => {});

  await sleep(3500);

  // Move cursor over the Language panel on the left
  const langElement = page.locator('strong:has-text("spanish"), strong:has-text("english"), h1:has-text("Your main content")').first();
  if (await langElement.isVisible({ timeout: 4000 }).catch(() => false)) {
    const leBox = await langElement.boundingBox();
    if (leBox) {
      console.log(`   🎯 Detected updated Language state at (${Math.round(leBox.x)}, ${Math.round(leBox.y)})`);
      await humanGlide(page, leBox.x + 100, leBox.y + 15, 22);
      await sleep(2000);
    }
  }

  // Move cursor over raw JSON state
  const rawStateBox = page.locator('pre').first();
  if (await rawStateBox.isVisible({ timeout: 3000 }).catch(() => false)) {
    const rsBox = await rawStateBox.boundingBox();
    if (rsBox) {
      await humanGlide(page, rsBox.x + rsBox.width / 2, rsBox.y + rsBox.height / 2, 22);
      await sleep(2500);
    }
  }

  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 5000);
};

export const runSharedStateWriteAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Shared State Write] Clicking "Toggle + re-run agent" button on the left...`);
  await sleep(1500);

  const rerunBtn = page.locator('button:has-text("Toggle + re-run agent")').first();
  if (await rerunBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    const btnBox = await rerunBtn.boundingBox();
    if (btnBox) {
      await humanGlide(page, btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2, 20);
      await sleep(400);
      await humanClick(page);
      console.log(`   ✓ Clicked "Toggle + re-run agent"!`);
    }
  }

  console.log(`   Waiting for sample_agent response to stream in chat...`);
  await page
    .waitForFunction(
      () => {
        const text = document.body.innerText;
        return (
          text.includes('spanish') ||
          text.includes('language') ||
          document.querySelectorAll('.copilotKitAssistantMessage').length > 0
        );
      },
      { timeout: 18000 },
    )
    .catch(() => {});

  await sleep(4000);

  // Glide cursor over the raw JSON state on the left
  const rawPre = page.locator('pre').first();
  if (await rawPre.isVisible({ timeout: 4000 }).catch(() => false)) {
    const preBox = await rawPre.boundingBox();
    if (preBox) {
      await humanGlide(page, preBox.x + preBox.width / 2, preBox.y + preBox.height / 2, 22);
      await sleep(2500);
    }
  }

  // Glide cursor over the assistant's response on the right
  const assistantLocator = page
    .locator('.copilotKitAssistantMessage, [data-message-role="assistant"]')
    .last();
  if (await assistantLocator.isVisible({ timeout: 4000 }).catch(() => false)) {
    const respBox = await assistantLocator.boundingBox();
    if (respBox) {
      await humanGlide(page, respBox.x + Math.min(respBox.width / 2, 200), respBox.y + 30, 22);
    }
  }

  await sleep(config.waitAfterPromptMs ?? 5000);
};
