import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

export const runSharedStateReadAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Shared State Read] Sending prompt to switch language in agent.state...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // Move cursor over the Language panel on the left
  await sleep(1500);
  const langElement = page
    .locator('strong:has-text("spanish"), strong:has-text("english"), h1:has-text("Your main content")')
    .first();
  if (await langElement.isVisible({ timeout: 4000 }).catch(() => false)) {
    const leBox = await langElement.boundingBox();
    if (leBox) {
      console.log(`   🎯 Detected updated Language state at (${Math.round(leBox.x)}, ${Math.round(leBox.y)})`);
      await humanGlide(page, leBox.x + 100, leBox.y + 15, 22);
      await sleep(1500);
    }
  }

  // Move cursor over raw JSON state
  const rawStateBox = page.locator('pre').first();
  if (await rawStateBox.isVisible({ timeout: 3000 }).catch(() => false)) {
    const rsBox = await rawStateBox.boundingBox();
    if (rsBox) {
      await humanGlide(page, rsBox.x + rsBox.width / 2, rsBox.y + rsBox.height / 2, 22);
      await sleep(1500);
    }
  }

  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
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

  // Glide cursor over the raw JSON state on the left
  await sleep(1500);
  const rawPre = page.locator('pre').first();
  if (await rawPre.isVisible({ timeout: 4000 }).catch(() => false)) {
    const preBox = await rawPre.boundingBox();
    if (preBox) {
      await humanGlide(page, preBox.x + preBox.width / 2, preBox.y + preBox.height / 2, 22);
      await sleep(1500);
    }
  }

  // This page re-runs the agent from a button, so there is no prompt to send.
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000);
};
