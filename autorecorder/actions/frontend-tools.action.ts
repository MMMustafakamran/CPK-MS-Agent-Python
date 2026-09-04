import { type Page } from 'playwright';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import {
  dismissAlertOverlay,
  installAlertOverlay,
} from '../core/overlays/alert-dialog';

export const runFrontendToolsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath,
  ctx,
) => {
  // The sayHello handler proves browser execution with window.alert, which a
  // native dialog hides from the video. Swap in a visible replica first.
  await installAlertOverlay(page);

  console.log(`   [Frontend Tools] Sending prompt to trigger browser sayHello tool...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  const shown = await dismissAlertOverlay(page);
  if (shown) {
    console.log(`   [Frontend Tools] Browser alert captured and dismissed.`);
  } else {
    ctx.warn(`[Frontend Tools] No browser alert fired -- the sayHello tool may not have run in the browser.`);
  }

  // Actively wait for browser tool execution and assistant confirmation
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
};
