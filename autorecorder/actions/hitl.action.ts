import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

export const runHitlAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Human in the Loop] Typing prompt to trigger approval gate...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  console.log(`   Waiting for Approval Required card to render in stream...`);
  const approveBtn = page.locator('button:has-text("Approve")').first();
  await approveBtn.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await sleep(1500);

  // Locate and click the Approve button
  if (await approveBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    const abBox = await approveBtn.boundingBox();
    if (abBox) {
      console.log(`   🎯 Detected Approve button at (${Math.round(abBox.x)}, ${Math.round(abBox.y)})`);
      await humanGlide(page, abBox.x + abBox.width / 2, abBox.y + abBox.height / 2, 20);
      await sleep(600);
      await humanClick(page);
      console.log(`   ✓ Clicked Approve button!`);
    }
  }

  // Actively wait for final streaming response after approval
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
};
