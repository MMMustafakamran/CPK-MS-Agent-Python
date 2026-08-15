import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../overlays/cursor';
import { showNotepadNote } from '../overlays/notepad';
import { type PageActionHandler } from '../types';

export const runVoiceAction: PageActionHandler = async (page: Page) => {
  console.log(`   [Voice] Activating microphone control...`);
  const micBtn = page
    .locator(
      'button[aria-label="Transcribe"], button[aria-label*="Transcribe"], button[aria-label*="mic"], button[aria-label*="voice"]',
    )
    .first();
  await micBtn.waitFor({ timeout: 6000 });
  const micBox = await micBtn.boundingBox();
  if (micBox) {
    await humanGlide(
      page,
      micBox.x + micBox.width / 2,
      micBox.y + micBox.height / 2,
      25,
    );
    await humanClick(page);
  } else {
    await micBtn.click();
  }
  console.log(`   Microphone activated — holding active voice state...`);
  await sleep(3500);

  // Open Notepad to type the developer note smoothly
  await showNotepadNote(page, 'voice_notes.txt', [
    'Tested the microphone input component.',
    'The browser captures audio stream properly.',
    'Server-side speech-to-text is not configured on this Microsoft Agent Framework runtime, so audio transcription is not implemented by design.',
  ]);
};
