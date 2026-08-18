import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../types';
import { runAgUiAction } from './ag-ui.action';
import { runAgentAppContextAction } from './agent-app-context.action';
import { runAuthAction } from './auth.action';
import { runDisplayOnlyAction } from './display-only.action';
import { runFrontendToolsAction } from './frontend-tools.action';
import { runHeadlessUiAction } from './headless-ui.action';
import { runHitlAction } from './hitl.action';
import { runInspectorAction } from './inspector.action';
import { runPrebuiltAction } from './prebuilt.action';
import { runProgrammaticAction } from './programmatic.action';
import { runRuntimeAction } from './runtime.action';
import {
  runSharedStateReadAction,
  runSharedStateWriteAction,
} from './shared-state.action';
import { runSlotsAction } from './slots.action';
import { runStateRenderingAction } from './state-rendering.action';
import { runToolRenderingAction } from './tool-rendering.action';

/**
 * Actively waits until:
 * 1. An assistant response message appears with text content.
 * 2. Streaming finishes (text content stops changing for 1.6+ seconds).
 * 3. Glides the mouse over the response and waits postWaitMs (default 4000ms) for reading.
 */
export async function waitForAgentResponseCompletion(
  page: Page,
  postWaitMs = 4000,
): Promise<void> {
  console.log(`   ⏳ Actively detecting AI agent response start & streaming progress...`);

  // Step 1: Wait until assistant message starts receiving content (up to 30s)
  let hasStarted = false;
  const startTime = Date.now();
  while (Date.now() - startTime < 30000) {
    const text = await page
      .evaluate(() => {
        const msgs = document.querySelectorAll(
          '.copilotKitAssistantMessage, [data-message-role="assistant"], .copilotKitMessage:not(:first-child), [class*="assistant"]',
        );
        if (msgs.length === 0) return '';
        const lastMsg = msgs[msgs.length - 1];
        return (lastMsg.textContent || '').trim();
      })
      .catch(() => '');

    if (text.length > 2) {
      hasStarted = true;
      break;
    }
    await sleep(300);
  }

  // Step 2: Stream completion detection — poll until text length stabilizes
  if (hasStarted) {
    console.log(`   🌊 AI agent is streaming response tokens...`);
    let previousText = '';
    let stableCount = 0;
    const streamStart = Date.now();

    while (Date.now() - streamStart < 45000) {
      const currentText = await page
        .evaluate(() => {
          const msgs = document.querySelectorAll(
            '.copilotKitAssistantMessage, [data-message-role="assistant"], .copilotKitMessage:not(:first-child), [class*="assistant"]',
          );
          if (msgs.length === 0) return '';
          const lastMsg = msgs[msgs.length - 1];
          return (lastMsg.textContent || '').trim();
        })
        .catch(() => '');

      if (currentText.length > 0 && currentText === previousText) {
        stableCount++;
        // If text is stable for 4 consecutive checks (1.6s), streaming has finished
        if (stableCount >= 4) {
          console.log(
            `   ✅ AI agent response completed (${currentText.length} characters).`,
          );
          break;
        }
      } else {
        stableCount = 0;
        previousText = currentText;
      }
      await sleep(400);
    }
  } else {
    console.warn(`   ⚠️ AI agent response timeout (waiting fallback)...`);
    await sleep(3000);
  }

  // Step 3: Glide cursor smoothly to the finished response message
  const assistantLocator = page
    .locator(
      '.copilotKitAssistantMessage, [data-message-role="assistant"], .copilotKitMessage:not(:first-child)',
    )
    .last();

  if (await assistantLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
    const abBox = await assistantLocator.boundingBox();
    if (abBox) {
      console.log(
        `   🎯 Focusing cursor on response at (${Math.round(abBox.x)}, ${Math.round(abBox.y)})`,
      );
      await humanGlide(
        page,
        abBox.x + Math.min(abBox.width / 2, 220),
        abBox.y + Math.min(abBox.height / 2, 60),
        20,
      );
    }
  } else {
    await humanGlide(page, 960, 500, 20);
  }

  // Step 4: 7-second reading pause after response completes
  console.log(`   📖 Reading completed response (pausing ${postWaitMs / 1000}s)...`);
  await sleep(postWaitMs);
}

export const runStandardAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  // 1. Detect that the demo page & chat interface are fully rendered
  console.log(`   🔍 Detecting demo page & chat component rendering...`);
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  await inputLocator.waitFor({ state: 'visible', timeout: 15000 });
  await sleep(300);

  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(
      page,
      inputBox.x + 80,
      inputBox.y + inputBox.height / 2,
      18,
    );
    await humanClick(page);
  } else {
    await inputLocator.click();
  }
  await sleep(200);

  for (const char of config.prompt) {
    await page.keyboard.type(char, { delay: 30 });
  }
  await sleep(300);

  // If text was wiped during typing by a sudden React re-render, re-fill
  const currentVal = await inputLocator.inputValue().catch(() => '');
  if (!currentVal && config.prompt) {
    await inputLocator.fill(config.prompt);
    await sleep(200);
  }

  // Attempt to submit prompt via button click or Enter key
  const sendBtn = page
    .locator(
      'button[type="submit"], button:has-text("Send"), .copilotKitSendButton, button[aria-label*="Send"]',
    )
    .first();

  if (await sendBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    const btnBox = await sendBtn.boundingBox();
    if (btnBox) {
      await humanGlide(
        page,
        btnBox.x + btnBox.width / 2,
        btnBox.y + btnBox.height / 2,
        16,
      );
      await humanClick(page);
    } else {
      await sendBtn.click();
    }
  } else {
    await page.keyboard.press('Enter');
  }

  // Double-check after 800ms if input is still populated (swallowed submit), re-trigger Enter
  await sleep(800);
  const remainingVal = await inputLocator.inputValue().catch(() => '');
  if (remainingVal.trim().length > 0) {
    await page.keyboard.press('Enter');
  }

  // 2. Actively wait for the response to stream completely and pause for reading
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000);
};

const ACTION_MAP: Record<string, PageActionHandler> = {
  quickstart: runStandardAction,
  'prebuilt-components': runPrebuiltAction,
  slots: runSlotsAction,
  'headless-ui': runHeadlessUiAction,
  'programmatic-control': runProgrammaticAction,
  inspector: runInspectorAction,
  'display-only': runDisplayOnlyAction,
  interactive: runHitlAction,
  'tool-rendering': runToolRenderingAction,
  'state-rendering': runStateRenderingAction,
  'frontend-tools': runFrontendToolsAction,
  'in-app-agent-read': runSharedStateReadAction,
  'in-app-agent-write': runSharedStateWriteAction,
  'agent-app-context': runAgentAppContextAction,
  auth: runAuthAction,
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
