import { type Page } from 'playwright';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { sendPrompt, waitForAgentResponseCompletion } from './index';

export const runFrontendToolsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Frontend Tools] Sending prompt to trigger browser sayHello tool...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // Actively wait for browser tool execution and assistant confirmation
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
};
