import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt } from '../core/actions';

export const runInspectorAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Inspector] Sending message to populate dev console...`);
  await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  console.log(`   Waiting for initial agent response...`);
  await sleep(4500);

  // Look for CopilotKit Inspector trigger (both in shadowRoot and main document)
  console.log(`   Opening CopilotKit Inspector overlay...`);
  const triggerPos = await page.evaluate(() => {
    // 1. Check all elements with shadowRoot
    for (const el of Array.from(document.querySelectorAll('*'))) {
      if (el.shadowRoot) {
        const btn = el.shadowRoot.querySelector(
          'button, [role="button"], #trigger, .trigger, [aria-label*="Inspector"], [aria-label*="dev"], [aria-label*="Console"]',
        ) as HTMLElement;
        if (btn) {
          const r = btn.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
          }
        }
      }
    }
    // 2. Check main document
    const mainBtn = document.querySelector(
      'button[aria-label*="Inspector"], button[aria-label*="dev"], button[aria-label*="Console"], .copilotKitDevConsole, [class*="inspector"], button:has-text("Inspector")',
    ) as HTMLElement;
    if (mainBtn) {
      const r = mainBtn.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
    return null;
  });

  if (triggerPos) {
    await humanGlide(page, triggerPos.x, triggerPos.y, 22);
    await humanClick(page);
    // Also trigger inside shadow root if click needed
    await page.evaluate(() => {
      for (const el of Array.from(document.querySelectorAll('*'))) {
        if (el.shadowRoot) {
          const btn = el.shadowRoot.querySelector(
            'button, [role="button"], #trigger, .trigger, [aria-label*="Inspector"]',
          ) as HTMLElement;
          if (btn) btn.click();
        }
      }
    });
    await sleep(2500);
  }

  // After inspector is opened, locate and click on "AG-UI Events" tab
  console.log(`   Clicking on "AG-UI Events" tab in Inspector...`);
  const eventsPos = await page.evaluate(() => {
    // 1. Search inside shadow roots
    for (const el of Array.from(document.querySelectorAll('*'))) {
      if (el.shadowRoot) {
        const items = Array.from(
          el.shadowRoot.querySelectorAll('button, a, [role="tab"], div, span, p'),
        );
        const tab = items.find((e) => {
          const t = (e.textContent || '').trim().toLowerCase();
          return (
            t === 'ag-ui events' ||
            t === 'ag ui events' ||
            t.includes('ag-ui events') ||
            t.includes('ag ui events') ||
            t === 'events'
          );
        }) as HTMLElement;
        if (tab) {
          tab.click();
          const r = tab.getBoundingClientRect();
          return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
      }
    }
    // 2. Search main document
    const docTab = Array.from(
      document.querySelectorAll('button, a, [role="tab"], span, div'),
    ).find((e) => {
      const t = (e.textContent || '').trim().toLowerCase();
      return (
        t === 'ag-ui events' ||
        t === 'ag ui events' ||
        t.includes('ag-ui events') ||
        t.includes('ag ui events') ||
        t === 'events'
      );
    }) as HTMLElement;
    if (docTab) {
      docTab.click();
      const r = docTab.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return null;
  });

  if (eventsPos && eventsPos.x > 0 && eventsPos.y > 0) {
    console.log(
      `   🎯 Detected AG-UI Events tab at (${Math.round(eventsPos.x)}, ${Math.round(eventsPos.y)})`,
    );
    await humanGlide(page, eventsPos.x, eventsPos.y, 20);
    await humanClick(page);
    console.log(`   ✓ Switched to AG-UI Events tab in Inspector!`);
    await sleep(4000);
  } else {
    // Fallback: search via Playwright locator
    const eventsTab = page
      .locator(
        'button:has-text("AG-UI Events"), [role="tab"]:has-text("AG-UI Events"), span:has-text("AG-UI Events"), button:has-text("Events"), [role="tab"]:has-text("Events")',
      )
      .first();
    if (await eventsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      const atBox = await eventsTab.boundingBox();
      if (atBox) {
        await humanGlide(page, atBox.x + atBox.width / 2, atBox.y + atBox.height / 2, 20);
        await humanClick(page);
        console.log(`   ✓ Switched to AG-UI Events tab in Inspector via fallback!`);
        await sleep(3500);
      }
    }
  }

  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 4000);
};
