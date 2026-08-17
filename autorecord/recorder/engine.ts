import { exec } from 'node:child_process';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { executePageAction } from './actions';
import { checkServicesHealth, diagnoseError } from './diagnostics';
import { generateIdeHtml } from './ide/generator';
import { humanGlide, humanScrollDown, sleep } from './overlays/cursor';
import { clickTaskbarApp, ensureOverlays } from './overlays/taskbar';
import { type PageRecordConfig } from './types';

export class RecordingEngine {
  private readonly videosDir: string;
  private readonly rootDir: string;
  private readonly tempVideoDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.videosDir = join(rootDir, 'autorecord', 'videos');
    this.tempVideoDir = join(this.videosDir, '.temp_chunks');
    if (!existsSync(this.videosDir)) {
      mkdirSync(this.videosDir, { recursive: true });
    }
    if (!existsSync(this.tempVideoDir)) {
      mkdirSync(this.tempVideoDir, { recursive: true });
    }
  }

  async recordPage(
    config: PageRecordConfig,
  ): Promise<{ success: boolean; filename: string; error?: string }> {
    console.log(`\n======================================================`);
    console.log(`🎬 RECORDING: ${config.name} (${config.id})`);
    console.log(`======================================================`);

    // 0. Automatic Pre-flight Health Check (Informational only)
    const health = await checkServicesHealth();
    if (!health.frontendOk || !health.backendOk) {
      console.warn(`\n🔍 [Pre-flight Service Diagnostics]:`);
      if (!health.backendOk) {
        console.warn(
          `   🔴 Microsoft Agent Framework Backend (port 8000) is unreachable: ${health.backendError}`,
        );
        console.warn(
          `      👉 Make sure to run: cd backend && uv run --prerelease=allow main.py\n`,
        );
      }
      if (!health.frontendOk) {
        console.warn(
          `   🔴 Next.js Frontend (port 3000) is unreachable: ${health.frontendError}`,
        );
        console.warn(`      👉 Make sure to run: cd frontend && npm run dev\n`);
      }
    }

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

    // Attach informational console & request listeners (error detection disabled)
    page.on('pageerror', (err) => {
      const msg = err.message || '';
      if (
        msg.includes('reo.dev') ||
        msg.includes('removeChild') ||
        msg.includes('Minified React error')
      ) {
        return;
      }
      console.warn(
        `   ⚠️ [Browser Page Error]: ${msg}\n   ${diagnoseError(err, 'browser-runtime')}`,
      );
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (
          !txt.includes('favicon.ico') &&
          !txt.includes('reo.dev') &&
          !txt.includes('analytics')
        ) {
          console.warn(`   ⚠️ [Browser Console Error]: ${txt}`);
        }
      }
    });

    page.on('requestfailed', (req) => {
      const url = req.url();
      if (
        url.includes('/api/copilotkit') ||
        url.includes(':8000') ||
        url.includes(':3000')
      ) {
        console.warn(
          `   ⚠️ [Network Request Notice]: ${req.method()} ${url} (${req.failure()?.errorText || 'Failed'})`,
        );
      }
    });

    // Attach global dialog handler so unexpected alerts don't stall recordings
    page.on('dialog', async (dialog) => {
      console.log(`   [Dialog Event] "${dialog.message()}"`);
      await sleep(800);
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
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        });
        await page.waitForSelector('body', { timeout: 10000 }).catch(() => {});
        await ensureOverlays(page, 'chrome');
        await sleep(400);

        // Move mouse into reading position
        await humanGlide(page, 960, 450, 22);
        await sleep(200);

        // Natural smooth scrolling down the doc page
        console.log(`   Human-like scrolling down doc page...`);
        await humanScrollDown(page, 500, 45);
        await sleep(300);

        // Move mouse over the code snippet
        const hasCode = await page.$('pre, code, div[class*="code"]');
        if (hasCode) {
          const box = await hasCode.boundingBox();
          if (box) {
            await humanGlide(page, box.x + box.width / 2, box.y + 40, 20);
          }
        }
        await sleep(2000);

        // Switch to VS Code via Windows 11 Taskbar
        console.log(`   🖱️ Switching to VS Code via Windows 11 Taskbar...`);
        await clickTaskbarApp(page, 'vscode');
      } catch (e) {
        console.warn(`⚠️ Doc navigation notice (${config.docUrl}): ${diagnoseError(e, 'doc-page')}`);
        await sleep(1000);
      }

      // ----------------------------------------------------
      // STEP 2: SHOW PROJECT CODE IN VS CODE IDE WITH SNIPPET SELECTION
      // ----------------------------------------------------
      if (config.id === 'quickstart') {
        console.log(
          `\n💻 Step 2a: Displaying CopilotKit & AG-UI Versions in package.json (lines 12-22)...`,
        );
        try {
          const pkgHtml = generateIdeHtml(
            this.rootDir,
            'frontend/package.json',
            12,
            22,
          );
          await page.setContent(pkgHtml, { waitUntil: 'domcontentloaded' });
          await ensureOverlays(page, 'vscode');
          await sleep(400);
          await humanGlide(page, 520, 380, 22);
          await sleep(200);
          await humanGlide(page, 720, 480, 25);
          await sleep(2500);
        } catch (e) {
          console.warn(`⚠️ Package.json IDE view notice: ${diagnoseError(e, 'ide-simulation')}`);
        }
      }

      console.log(
        `\n💻 Step 2: Displaying Project Code in VS Code IDE (${config.ideFile}: lines ${config.startLine}-${config.endLine})...`,
      );
      try {
        const ideHtml = generateIdeHtml(
          this.rootDir,
          config.ideFile,
          config.startLine,
          config.endLine,
        );
        await page.setContent(ideHtml, { waitUntil: 'domcontentloaded' });
        await ensureOverlays(page, 'vscode');
        await sleep(400);

        // Move mouse over the Explorer header
        await humanGlide(page, 120, 70, 18);
        await sleep(200);

        // Glide mouse into the code editor at the start of the snippet
        await humanGlide(page, 520, 380, 22);
        await sleep(200);

        // Smoothly glide cursor down across the highlighted snippet block
        await humanGlide(page, 720, 540, 25);

        // Non-blocking fire-and-forget local VS Code desktop focus if available
        try {
          exec(`code -r -g "${config.ideFile}:${config.startLine}"`);
        } catch {}

        await sleep(2500);

        // Switch back to Chrome via Windows 11 Taskbar
        console.log(`   🖱️ Switching back to Chrome via Windows 11 Taskbar...`);
        await clickTaskbarApp(page, 'chrome');
      } catch (e) {
        console.warn(`⚠️ IDE view error: ${diagnoseError(e, 'ide-simulation')}`);
        await sleep(1000);
      }

      // ----------------------------------------------------
      // STEP 3: FRONTEND DEMO PAGE & TAILORED ACTION EXECUTION
      // ----------------------------------------------------
      console.log(`\n🚀 Step 3: Opening Demo (${config.demoUrl})...`);
      try {
        await page.goto(config.demoUrl, {
          waitUntil: 'commit',
          timeout: 45000,
        });
        await ensureOverlays(page, 'chrome');

        // Wait for page body and chat element readiness
        console.log(`   ⏳ Waiting for Next.js compilation & React hydration to settle...`);
        await page.waitForSelector('body', { timeout: 10000 }).catch(() => {});
        await page
          .waitForSelector(
            'textarea, input[type="text"], input, [contenteditable="true"], .copilotKitChat, [class*="copilotKit"]',
            { state: 'visible', timeout: 15000 },
          )
          .catch(() => {});
        await sleep(1500);

        // Dispatch specific demo actions
        await executePageAction(page, config, this.rootDir);

        console.log(`✅ Demo execution completed for ${config.id}.`);
        await sleep(2000);
      } catch (e) {
        console.warn(
          `\n⚠️ [Demo Action Notice on ${config.id}]:\n${diagnoseError(e, config.demoUrl)}\n`,
        );
        await sleep(1000);
      }
    } finally {
      const video = page.video();
      await page.close();
      await context.close();

      let finalSavedFilename = '';
      if (video) {
        const baseFilename = config.filename ?? config.id;
        finalSavedFilename = `${baseFilename}.webm`;

        const finalWebm = join(this.videosDir, finalSavedFilename);
        try {
          if (existsSync(finalWebm)) unlinkSync(finalWebm);
          await video.saveAs(finalWebm);
          await video.delete().catch(() => {});

          console.log(`\n🎥 [RECORDING SUCCESSFUL]: ${finalWebm}\n`);
        } catch (err) {
          console.warn(`Video save note: ${err}`);
        }
      }

      await browser.close();

      return {
        success: true,
        filename: finalSavedFilename,
      };
    }
  }
}
