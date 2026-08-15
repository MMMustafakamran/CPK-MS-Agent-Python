import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { showNotepadNote } from '../overlays/notepad';
import { type PageActionHandler } from '../types';

export const runA2uiAction: PageActionHandler = async (page: Page, config) => {
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
  }
  for (const char of config.prompt)
    await page.keyboard.type(char, { delay: 45 });
  await sleep(600);
  await page.keyboard.press('Enter');
  await sleep(6000);

  await showNotepadNote(page, 'a2ui_notes.txt', [
    'A2UI Middleware is enabled in server.ts (a2ui: {}).',
    'Recovery thresholds configured in app.config.ts (showAfterMs: 2000).',
    'A2UI catalog styling classes are loaded in styles.css.',
  ]);
};

export const runThreadsAction: PageActionHandler = async (page: Page) => {
  await humanGlide(page, 450, 250, 25);
  await sleep(1500);
  await humanGlide(page, 1200, 450, 25);
  await sleep(2000);

  await showNotepadNote(page, 'threads_notes.txt', [
    'Threads Management Surface Test.',
    'Headless list (injectThreads) and CopilotThreadsDrawer are mounted.',
    'Thread endpoints require Enterprise Intelligence Platform license; drawer displays locked state as expected.',
  ]);
};

export const runMemoryAction: PageActionHandler = async (
  page: Page,
  config,
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
  }
  for (const char of config.prompt)
    await page.keyboard.type(char, { delay: 45 });
  await sleep(600);
  await page.keyboard.press('Enter');
  await sleep(6000);

  await showNotepadNote(page, 'memory_notes.txt', [
    'Agent Memories Surface Test.',
    'injectMemories isAvailable() gate verified.',
    'Enterprise memory routes are not active on local runtime; fallback messaging renders per guide specification.',
  ]);
};
