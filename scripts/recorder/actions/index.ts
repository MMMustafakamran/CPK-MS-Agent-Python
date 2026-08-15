import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { runFrontendToolsAction } from './frontend-tools.action';
import { runHeadlessUiAction } from './headless-ui.action';
import { runInspectorAction } from './inspector.action';
import { runInteractiveAction } from './interactive.action';
import { runPrebuiltAction } from './prebuilt.action';
import { runProgrammaticAction } from './programmatic.action';
import { runAgUiAction, runRuntimeAction } from './runtime-agui.action';
import { runSharedStateAction } from './shared-state.action';
import { runSlotsAction } from './slots.action';

export const runStandardAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator.waitFor({ timeout: 8000 });

  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(
      page,
      inputBox.x + 80,
      inputBox.y + inputBox.height / 2,
      25,
    );
    await humanClick(page);
  } else {
    await inputLocator.click();
  }
  await sleep(400);

  for (const char of config.prompt) {
    await page.keyboard.type(char, { delay: 45 });
  }
  await sleep(600);

  try {
    const sendBtn = page
      .locator(
        'button[type="submit"], button:has-text("Send"), .copilotKitSendButton, button[aria-label*="Send"]',
      )
      .first();
    if (await sendBtn.isVisible()) {
      const btnBox = await sendBtn.boundingBox();
      if (btnBox) {
        await humanGlide(
          page,
          btnBox.x + btnBox.width / 2,
          btnBox.y + btnBox.height / 2,
          20,
        );
        await humanClick(page);
      } else {
        await sendBtn.click();
      }
    } else {
      await page.keyboard.press('Enter');
    }
  } catch {
    await page.keyboard.press('Enter');
  }

  console.log(`⏳ Waiting for AI agent response / tool rendering...`);
  await humanGlide(page, 960, 500, 30);
  await sleep(config.waitAfterPromptMs ?? 8500);
};

const ACTION_MAP: Record<string, PageActionHandler> = {
  'prebuilt-components': runPrebuiltAction,
  slots: runSlotsAction,
  'headless-ui': runHeadlessUiAction,
  'programmatic-control': runProgrammaticAction,
  inspector: runInspectorAction,
  interactive: runInteractiveAction,
  'frontend-tools': runFrontendToolsAction,
  'in-app-agent-read': runSharedStateAction,
  'in-app-agent-write': runSharedStateAction,
  'copilot-runtime': runRuntimeAction,
  'ag-ui': runAgUiAction,
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
): Promise<void> {
  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath);
}
