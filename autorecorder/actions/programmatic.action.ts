import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt } from '../core/actions';

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
  // The draft box arrives pre-populated and submitting means clicking "Run agent",
  // which is the whole point of the page -- copilotkit.runAgent, not a chat submit.
  await sendPrompt(page, config.prompt, {
    inputSelector: 'input[placeholder="Message to send"]',
    submitSelector: 'button:has-text("Run agent")',
    clearFirst: true,
    timeoutMs: 12000,
  });

  console.log(`   Waiting for Programmatic Control run to complete...`);
  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 1500);
};
