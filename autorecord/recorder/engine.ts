import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { chromium } from 'playwright';
import { executePageAction } from './actions';
import { checkServicesHealth, diagnoseError } from './diagnostics';
import { generateIdeHtml } from './ide/generator';
import { humanClick, humanGlide, humanScrollDown, sleep } from './overlays/cursor';
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
          !txt.includes('analytics') &&
          !txt.includes('Failed to load resource') &&
          !txt.includes('404 (Not Found)') &&
          !txt.includes('webpack-hmr') &&
          !txt.includes('.map')
        ) {
          console.warn(`   ⚠️ [Browser Console Error]: ${txt}`);
        }
      }
    });

    page.on('requestfailed', (req) => {
      const url = req.url();
      if (
        (url.includes('/api/copilotkit') || url.includes(':8000')) &&
        !url.includes('favicon.ico') &&
        !url.includes('.map')
      ) {
        console.warn(
          `   ⚠️ [Network Request Notice]: ${req.method()} ${url} (${req.failure()?.errorText || 'Failed'})`,
        );
      }
    });

    // Attach global dialog handler so unexpected alerts don't stall recordings
    page.on('dialog', async (dialog) => {
      console.log(`   [Dialog Event] "${dialog.message()}"`);
      await sleep(400);
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
        try {
          await page.goto(config.docUrl, {
            waitUntil: 'load',
            timeout: 20000,
          });
        } catch {
          await page.goto(config.docUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 15000,
          });
        }

        // Wait for main doc content or header to render
        await page
          .waitForSelector('h1, article, main, [class*="content"], pre', {
            state: 'visible',
            timeout: 10000,
          })
          .catch(() => {});
        await ensureOverlays(page, 'chrome');

        // Let the viewer clearly see the official documentation page
        await sleep(1500);

        // Move mouse into reading position
        await humanGlide(page, 960, 420, 18);

        // Smooth continuous scrolling down the doc page (Phase 1: Intro & setup)
        console.log(`   Human-like scrolling down doc page (Phase 1)...`);
        await humanScrollDown(page, 800, 35);
        await sleep(350);

        // Smooth continuous scrolling further down into code examples (Phase 2: Code implementation)
        console.log(`   Human-like scrolling down doc page (Phase 2)...`);
        await humanScrollDown(page, 950, 35);
        await sleep(400);

        // Find the visible code block on screen and glide cursor over it
        const visibleCodePos = (await page.evaluate(`
          (function() {
            var pres = document.querySelectorAll('pre, div[class*="code"], code');
            for (var i = pres.length - 1; i >= 0; i--) {
              var r = pres[i].getBoundingClientRect();
              if (r.height > 60 && r.top >= 80 && r.top <= window.innerHeight - 100) {
                return {
                  x: r.left + Math.min(r.width / 2, 400),
                  y: r.top + Math.min(r.height / 3, 70),
                };
              }
            }
            return null;
          })()
        `)) as { x: number; y: number } | null;

        if (visibleCodePos) {
          await humanGlide(page, visibleCodePos.x, visibleCodePos.y, 20);
        } else {
          await humanGlide(page, 650, 450, 18);
        }

        // Reading pause on the doc code snippet
        await sleep(2000);

        // Switch to VS Code via Windows 11 Taskbar
        console.log(`   🖱️ Switching to VS Code via Windows 11 Taskbar...`);
        await clickTaskbarApp(page, 'vscode');
      } catch (e) {
        console.warn(`⚠️ Doc navigation notice (${config.docUrl}): ${diagnoseError(e, 'doc-page')}`);
        await sleep(600);
      }

      // ----------------------------------------------------
      // STEP 2: SHOW PROJECT CODE IN VS CODE IDE WITH SNIPPET SELECTION
      // ----------------------------------------------------
      if (config.id === 'quickstart') {
        console.log(
          `\n💻 Step 2: Displaying package.json & Project Code in VS Code IDE...`,
        );
        try {
          const ideHtml = generateIdeHtml(
            this.rootDir,
            'frontend/package.json',
            12,
            22,
            [
              {
                filePath: config.ideFile,
                startLine: config.startLine,
                endLine: config.endLine,
              },
            ],
            0,
          );
          await page.setContent(ideHtml, { waitUntil: 'domcontentloaded' });
          await ensureOverlays(page, 'vscode');
          await sleep(300);

          // 1. Highlight dependencies in package.json
          console.log(
            `   Displaying CopilotKit & AG-UI Versions in package.json (lines 12-22)...`,
          );
          await page.evaluate(`
            (function() {
              var highlighted = document.querySelector('.editor-body-view:not([style*="display: none"]) .code-line.highlighted, .code-line.highlighted');
              if (highlighted) {
                highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            })()
          `);
          await sleep(300);
          await humanGlide(page, 520, 360, 18);
          await sleep(1500);

          // 2. Smoothly glide cursor up to page.tsx tab in the tabs bar and click it
          console.log(
            `   🖱️ Switching tab to ${basename(config.ideFile)} in VS Code...`,
          );
          const tab1Locator = page.locator('#ide-tab-1');
          if (await tab1Locator.isVisible().catch(() => false)) {
            const tBox = await tab1Locator.boundingBox();
            if (tBox) {
              await humanGlide(
                page,
                tBox.x + tBox.width / 2,
                tBox.y + tBox.height / 2,
                18,
              );
              await humanClick(page);
            } else {
              await page.evaluate(`window.switchIdeTab(1)`);
            }
          } else {
            await page.evaluate(`window.switchIdeTab(1)`);
          }
          await sleep(300);

          // 3. Highlight project code in page.tsx (auto-scrolling code if below viewport)
          console.log(
            `   Displaying Project Code in VS Code IDE (${config.ideFile}: lines ${config.startLine}-${config.endLine})...`,
          );
          await page.evaluate(`
            (function() {
              var highlighted = document.querySelector('.editor-body-view:not([style*="display: none"]) .code-line.highlighted, .code-line.highlighted');
              if (highlighted) {
                highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            })()
          `);
          await sleep(400);

          const codeLocator = page
            .locator(
              '.editor-body-view:not([style*="display: none"]) .code-line.highlighted, .code-line.highlighted',
            )
            .first();
          if (await codeLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
            const box = await codeLocator.boundingBox();
            if (box) {
              await humanGlide(
                page,
                box.x + Math.min(box.width / 2, 420),
                box.y + Math.min(box.height / 2, 30),
                18,
              );
            }
          } else {
            await humanGlide(page, 520, 360, 18);
          }
          await sleep(1800);

          // Switch back to Chrome via Windows 11 Taskbar
          console.log(`   🖱️ Switching back to Chrome via Windows 11 Taskbar...`);
          await clickTaskbarApp(page, 'chrome');
        } catch (e) {
          console.warn(`⚠️ IDE view error: ${diagnoseError(e, 'ide-simulation')}`);
          await sleep(600);
        }
      } else {
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
          await sleep(300);

          // Smoothly scroll code-viewport so highlighted block is centered
          await page.evaluate(`
            (function() {
              var highlighted = document.querySelector('.editor-body-view:not([style*="display: none"]) .code-line.highlighted, .code-line.highlighted');
              if (highlighted) {
                highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            })()
          `);
          await sleep(400);

          const codeLocator = page
            .locator(
              '.editor-body-view:not([style*="display: none"]) .code-line.highlighted, .code-line.highlighted',
            )
            .first();
          if (await codeLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
            const box = await codeLocator.boundingBox();
            if (box) {
              await humanGlide(
                page,
                box.x + Math.min(box.width / 2, 420),
                box.y + Math.min(box.height / 2, 30),
                18,
              );
            }
          } else {
            await humanGlide(page, 520, 360, 18);
          }
          await sleep(1800);

          // Switch back to Chrome via Windows 11 Taskbar
          console.log(`   🖱️ Switching back to Chrome via Windows 11 Taskbar...`);
          await clickTaskbarApp(page, 'chrome');
        } catch (e) {
          console.warn(`⚠️ IDE view error: ${diagnoseError(e, 'ide-simulation')}`);
          await sleep(600);
        }
      }

      // ----------------------------------------------------
      // STEP 3: FRONTEND DEMO PAGE & TAILORED ACTION EXECUTION
      // ----------------------------------------------------
      console.log(`\n🚀 Step 3: Opening Demo (${config.demoUrl})...`);
      try {
        // Prevent doc page flash during cross-origin transition:
        // Set dark background on current page before navigating to demoUrl
        await page.evaluate(`
          (function() {
            document.body.style.backgroundColor = '#0f172a';
            document.body.style.transition = 'none';
          })()
        `).catch(() => {});

        await page.goto(config.demoUrl, {
          waitUntil: 'domcontentloaded',
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
        await sleep(1000);

        // Dispatch specific demo actions
        await executePageAction(page, config, this.rootDir);

        console.log(`✅ Demo execution completed for ${config.id}.`);
        await sleep(1500);
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
