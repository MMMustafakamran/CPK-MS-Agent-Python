import { exec } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { executePageAction } from './actions';
import { humanGlide, humanScrollDown, sleep } from './overlays/cursor';
import { ensureOverlays } from './overlays/taskbar';
import { type PageRecordConfig } from './types';

export class RecordingEngine {
  private readonly recordingsDir: string;
  private readonly rootDir: string;
  private readonly tempVideoDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.recordingsDir = join(rootDir, 'recordings');
    this.tempVideoDir = join(this.recordingsDir, '.temp_chunks');
    if (!existsSync(this.recordingsDir)) {
      mkdirSync(this.recordingsDir, { recursive: true });
    }
    if (!existsSync(this.tempVideoDir)) {
      mkdirSync(this.tempVideoDir, { recursive: true });
    }
  }

  async recordPage(config: PageRecordConfig): Promise<void> {
    console.log(`\n======================================================`);
    console.log(`🎬 RECORDING: ${config.name} (${config.id})`);
    console.log(`======================================================`);

    const browser = await chromium.launch({
      headless: false,
      args: [
        '--start-maximized',
        '--force-dark-mode',
        '--background-color=#1e1e1e',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      colorScheme: 'dark',
      recordVideo: {
        dir: this.tempVideoDir,
        size: { width: 1920, height: 1080 },
      },
    });

    const page = await context.newPage();

    // Attach global dialog handler so unexpected alerts don't stall recordings
    page.on('dialog', async (dialog) => {
      console.log(`   [Dialog Event] "${dialog.message()}"`);
      await sleep(1200);
      try {
        await dialog.accept();
      } catch {}
    });

    try {
      // ----------------------------------------------------
      // STEP 1: OFFICIAL DOC PAGE & HUMAN READING SCROLL
      // ----------------------------------------------------
      console.log(`\n📖 Step 1: Navigating to Official Doc (${config.docUrl})...`);
      try {
        await page.goto(config.docUrl, {
          waitUntil: 'commit',
          timeout: 30000,
        });
        await page.waitForSelector('body', { timeout: 8000 }).catch(() => {});
        await ensureOverlays(page, 'chrome');
        await sleep(1500);

        // Move mouse into reading position
        await humanGlide(page, 960, 450, 25);
        await sleep(300);

        // Natural smooth scrolling down the doc page
        console.log(`   Human-like scrolling down doc page...`);
        await humanScrollDown(page, 500, 50);
        await sleep(500);

        // Move mouse over the code snippet
        const hasCode = await page.$('pre, code, div[class*="code"]');
        if (hasCode) {
          const box = await hasCode.boundingBox();
          if (box) {
            await humanGlide(page, box.x + box.width / 2, box.y + 40, 22);
          }
        }
        await sleep(3000);
      } catch (e) {
        console.warn(`⚠️ Doc navigation notice (${config.docUrl}): ${e}`);
        await sleep(1500);
      }

      // ----------------------------------------------------
      // STEP 2: SHOW PROJECT CODE IN VS CODE IDE WITH SNIPPET SELECTION
      // ----------------------------------------------------
      console.log(
        `\n💻 Step 2: Displaying Project Code in VS Code IDE (${config.ideFile}: lines ${config.startLine}-${config.endLine})...`,
      );
      const ideUrl = `http://localhost:3000/ide?file=${encodeURIComponent(config.ideFile)}&startLine=${config.startLine}&endLine=${config.endLine}`;
      try {
        await page.goto(ideUrl, {
          waitUntil: 'commit',
          timeout: 60000,
        });
        await ensureOverlays(page, 'vscode');
        await sleep(1200);

        // Move mouse over the Explorer header
        await humanGlide(page, 120, 70, 18);
        await sleep(300);

        // Glide mouse into the code editor at the start of the snippet
        await humanGlide(page, 520, 380, 22);
        await sleep(300);

        // Smoothly glide cursor down across the highlighted snippet block
        await humanGlide(page, 720, 540, 25);

        // Non-blocking fire-and-forget local VS Code desktop focus if available
        try {
          exec(`code -r -g "${config.ideFile}:${config.startLine}"`);
        } catch {}

        await sleep(3500);
      } catch (e) {
        console.warn(`⚠️ IDE view notice: Make sure Next.js is running on http://localhost:3000. Error: ${e}`);
        await sleep(1500);
      }

      // ----------------------------------------------------
      // STEP 3: FRONTEND DEMO PAGE & TAILORED ACTION EXECUTION
      // ----------------------------------------------------
      console.log(`\n🚀 Step 3: Opening Demo (${config.demoUrl})...`);
      try {
        await page.goto(config.demoUrl, {
          waitUntil: 'commit',
          timeout: 60000,
        });
        await ensureOverlays(page, 'chrome');
        await sleep(1500);

        // Dispatch specific demo actions
        await executePageAction(page, config, this.rootDir);

        console.log(`✅ Demo execution completed for ${config.id}.`);
        await sleep(3000);
      } catch (e) {
        console.warn(`⚠️ Demo view notice: Make sure frontend (port 3000) and backend (port 8000) are running. Error: ${e}`);
        await sleep(1500);
      }
    } finally {
      const video = page.video();
      await page.close();
      await context.close();

      if (video) {
        const finalWebm = join(this.recordingsDir, `${config.id}.webm`);
        try {
          if (existsSync(finalWebm)) unlinkSync(finalWebm);
          await video.saveAs(finalWebm);
          await video.delete().catch(() => {});
          console.log(`🎥 WebM Video saved: ${finalWebm}`);
        } catch (err) {
          console.warn(`Video save note: ${err}`);
        }
      }

      await browser.close();
    }
  }
}
