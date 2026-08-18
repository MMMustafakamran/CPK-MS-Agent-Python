import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { chromium, type Page } from 'playwright';
import { executePageAction } from './actions';
import { checkServicesHealth, diagnoseError } from './diagnostics';
import { generateIdeHtml } from './ide/generator';
import { humanClick, humanGlide, humanScrollDown, setGlobalCursorPos, sleep } from './overlays/cursor';
import { clickTaskbarApp, ensureOverlays } from './overlays/taskbar';
import { type PageRecordConfig } from './types';

/**
 * Smoothly and visibly scrolls the simulated VS Code .code-viewport down to the target startLine
 */
async function humanScrollCodeViewport(
  page: Page,
  startLine: number,
): Promise<void> {
  if (startLine <= 14) {
    await sleep(300);
    return;
  }

  // Calculate target scrollTop: each line is 22px in height
  // Center the highlighted range in the editor pane
  const targetScrollTop = Math.max(0, (startLine - 8) * 22);

  await page.evaluate(async (targetY) => {
    const viewport = document.querySelector(
      '.editor-body-view:not([style*="display: none"]) .code-viewport, .code-viewport',
    ) as HTMLElement | null;
    if (!viewport) return;

    const startY = viewport.scrollTop;
    const distance = targetY - startY;
    if (Math.abs(distance) < 15) return;

    const steps = 32;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      // Smooth cubic ease-in-out
      const progress =
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      viewport.scrollTop = startY + distance * progress;
      await new Promise((r) => setTimeout(r, 20));
    }
  }, targetScrollTop);

  await sleep(350);
}

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

    setGlobalCursorPos(960, 540);

    let recordSuccess = false;
    let recordError: string | undefined;
    let finalSavedFilename = '';

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
        msg.includes('Minified React error') ||
        msg.includes('Hydration failed') ||
        msg.includes("server rendered text didn't match")
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
          !txt.includes('.map') &&
          !txt.includes('Hydration failed') &&
          !txt.includes("server rendered text didn't match")
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
        await page.goto(config.docUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 25000,
        });

        // Fast check for doc header / content readiness
        await page
          .waitForSelector('h1, article, main, [class*="content"], pre', {
            state: 'visible',
            timeout: 5000,
          })
          .catch(() => {});
        await ensureOverlays(page, 'chrome');

        // Crisp pause so viewer registers the doc title, then glide straight into reading
        await sleep(500);

        // Move mouse into reading position
        await humanGlide(page, 960, 380, 16);

        // Silky smooth scrolling down doc page (~90% depth at relaxed human reading pace)
        console.log(`   Silky smooth scrolling down doc page (~90%)...`);
        await humanScrollDown(page, 2000, 3600);

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
      // ----------------------------------------------------
      // STEP 2: SHOW PROJECT CODE IN VS CODE IDE WITH SNIPPET SELECTION
      // ----------------------------------------------------
      const hasExtraTabs = config.extraTabs && config.extraTabs.length > 0;
      console.log(
        `\n💻 Step 2: Displaying Project Code in VS Code IDE (${config.ideFile}: lines ${config.startLine}-${config.endLine})...`,
      );
      try {
        const ideHtml = generateIdeHtml(
          this.rootDir,
          config.ideFile,
          config.startLine,
          config.endLine,
          config.extraTabs ?? [],
          0,
        );
        await page.setContent(ideHtml, { waitUntil: 'domcontentloaded' });
        await ensureOverlays(page, 'vscode');
        await sleep(300);

        // Highlight primary file snippet
        await humanScrollCodeViewport(page, config.startLine);
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
        await sleep(hasExtraTabs ? 1500 : 1800);

        // If extra tabs exist, smoothly switch through each extra tab
        if (hasExtraTabs && config.extraTabs) {
          for (let tabIdx = 0; tabIdx < config.extraTabs.length; tabIdx++) {
            const extra = config.extraTabs[tabIdx];
            const targetDomIdx = tabIdx + 1;
            console.log(
              `   🖱️ Switching tab to ${basename(extra.filePath)} in VS Code...`,
            );
            const tabLocator = page.locator(`#ide-tab-${targetDomIdx}`);
            if (await tabLocator.isVisible().catch(() => false)) {
              const tBox = await tabLocator.boundingBox();
              if (tBox) {
                await humanGlide(
                  page,
                  tBox.x + tBox.width / 2,
                  tBox.y + tBox.height / 2,
                  18,
                );
                await humanClick(page);
              } else {
                await page.evaluate(`window.switchIdeTab(${targetDomIdx})`);
              }
            } else {
              await page.evaluate(`window.switchIdeTab(${targetDomIdx})`);
            }
            await sleep(300);

            // Scroll & Highlight extra tab code
            await humanScrollCodeViewport(page, extra.startLine);
            const extraCodeLocator = page
              .locator(
                '.editor-body-view:not([style*="display: none"]) .code-line.highlighted, .code-line.highlighted',
              )
              .first();
            if (await extraCodeLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
              const box = await extraCodeLocator.boundingBox();
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
          }
        }

        // Switch back to Chrome via Windows 11 Taskbar
        console.log(`   🖱️ Switching back to Chrome via Windows 11 Taskbar...`);
        await clickTaskbarApp(page, 'chrome');
      } catch (e) {
        console.warn(`⚠️ IDE view error: ${diagnoseError(e, 'ide-simulation')}`);
        await sleep(600);
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

      recordSuccess = true;
    } catch (err: any) {
      recordSuccess = false;
      recordError = err?.message || String(err);
      console.error(`❌ Recording error for ${config.id}:`, recordError);
    } finally {
      const video = page.video();
      await page.close().catch(() => {});
      await context.close().catch(() => {});

      if (video) {
        const baseFilename = config.filename ?? config.id;
        finalSavedFilename = `${baseFilename}.webm`;

        const finalWebm = join(this.videosDir, finalSavedFilename);
        try {
          if (existsSync(finalWebm)) unlinkSync(finalWebm);
          await video.saveAs(finalWebm);
          await video.delete().catch(() => {});

          if (recordSuccess) {
            console.log(`\n🎥 [RECORDING SUCCESSFUL]: ${finalWebm}\n`);
          }
        } catch (err) {
          console.warn(`Video save note: ${err}`);
        }
      }

      await browser.close().catch(() => {});
    }

    return {
      success: recordSuccess,
      filename: finalSavedFilename,
      error: recordError,
    };
  }
}
