import { type Page } from 'playwright';
import { join } from 'node:path';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { type PageActionHandler } from '../types';

export const runAttachmentsAction: PageActionHandler = async (
  page: Page,
  _config,
  rootPath: string,
) => {
  console.log(`   [Attachments] Uploading sample document and prompting...`);
  const sampleFilePath = join(rootPath, 'sample_report.pdf');

  // Locate the (+) attachment trigger button
  const attachBtn = page
    .locator(
      'button[aria-label="Add photos or files"], button[tooltipposition="below"].cdk-menu-trigger, .copilotKitInput button:first-of-type',
    )
    .first();
  await attachBtn.waitFor({ timeout: 6000 });
  const attachBox = await attachBtn.boundingBox();
  if (attachBox) {
    await humanGlide(
      page,
      attachBox.x + attachBox.width / 2,
      attachBox.y + attachBox.height / 2,
      20,
    );
    await humanClick(page);
  }
  await sleep(600);

  // Check if a CDK menu appeared (e.g. Upload file / Upload photo)
  try {
    const menuItem = page
      .locator(
        '[role="menuitem"], .cdk-menu-item, button:has-text("Upload"), button:has-text("file"), button:has-text("Photo")',
      )
      .first();
    if (await menuItem.isVisible({ timeout: 1000 }).catch(() => false)) {
      const mBox = await menuItem.boundingBox();
      if (mBox) {
        await humanGlide(
          page,
          mBox.x + mBox.width / 2,
          mBox.y + mBox.height / 2,
          15,
        );
        await humanClick(page);
      }
    }
  } catch {}

  // Set files on file input
  try {
    const fileInput = page.locator('input[type="file"]').first();
    if ((await fileInput.count()) > 0) {
      await fileInput.setInputFiles(sampleFilePath);
    }
  } catch {}
  await sleep(2000);

  // Focus input, type prompt, and send
  const inputLocator = page
    .locator('textarea, input[type="text"], [contenteditable="true"]')
    .first();
  const inputBox = await inputLocator.boundingBox();
  if (inputBox) {
    await humanGlide(
      page,
      inputBox.x + 80,
      inputBox.y + inputBox.height / 2,
      20,
    );
    await humanClick(page);
  }
  const prompt = 'Please review and summarize this attached document.';
  for (const c of prompt) await page.keyboard.type(c, { delay: 45 });
  console.log(
    `   Prompt entered — holding 4s to showcase attached document and text...`,
  );
  await sleep(4000);

  // Glide mouse to Send button and click
  try {
    const sendBtn = page
      .locator(
        'button[type="submit"], button[aria-label="Send message"], button:has-text("Send")',
      )
      .first();
    const btnBox = await sendBtn.boundingBox().catch(() => null);
    if (btnBox) {
      await humanGlide(
        page,
        btnBox.x + btnBox.width / 2,
        btnBox.y + btnBox.height / 2,
        20,
      );
      await humanClick(page);
    } else {
      await page.keyboard.press('Enter');
    }
  } catch {
    await page.keyboard.press('Enter');
  }

  console.log(`   Waiting for Attachments AI response...`);
  await sleep(10000);
};
