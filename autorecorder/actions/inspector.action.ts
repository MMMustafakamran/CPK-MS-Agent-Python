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

  // The inspector is a Lit web component (@copilotkit/web-inspector) that lives
  // behind nested shadow roots, so `document.querySelector` cannot see its
  // sidebar at all. The previous text-scan walked only ONE level of shadow root
  // and matched `div`/`span` on `textContent`, which resolves to whichever
  // ancestor container happens to contain the words "AG-UI Events" — a panel
  // wrapper, not the nav button. Clicking that wrapper's centre is a no-op and
  // the cursor lands in the middle of the panel, which is exactly what the last
  // recording shows.
  //
  // The nav renders `data-inspector-menu-key` on each leaf button, so target
  // that. "ag-ui-events" sits under the collapsible "inspect" group, which has
  // to be open before its leaves exist in the DOM.
  const MENU_KEY = 'ag-ui-events';
  const GROUP_KEY = 'inspect';

  // Serialized and injected, because page.evaluate cannot close over helpers.
  const deepQueryFn = `
    (selector) => {
      const seen = new Set();
      const walk = (root) => {
        if (!root || seen.has(root)) return null;
        seen.add(root);
        const hit = root.querySelector(selector);
        if (hit) return hit;
        for (const el of Array.from(root.querySelectorAll('*'))) {
          if (el.shadowRoot) {
            const nested = walk(el.shadowRoot);
            if (nested) return nested;
          }
        }
        return null;
      };
      return walk(document);
    }`;

  // Open the owning group first; on a fresh panel "inspect" may be collapsed.
  await page.evaluate(
    ([deepQuerySrc, group]) => {
      const deepQuery = eval(deepQuerySrc) as (s: string) => HTMLElement | null;
      const groupBtn = deepQuery(`button[data-inspector-group="${group}"]:not([data-inspector-menu-key])`);
      if (groupBtn) groupBtn.click();
    },
    [deepQueryFn, GROUP_KEY] as const,
  );
  await sleep(800);

  console.log(`   Clicking the "AG-UI Events" nav item in the Inspector...`);
  const eventsPos = await page.evaluate(
    ([deepQuerySrc, menuKey]) => {
      const deepQuery = eval(deepQuerySrc) as (s: string) => HTMLElement | null;
      const tab =
        deepQuery(`button[data-inspector-menu-key="${menuKey}"]`) ??
        // Thread-detail tablist uses a real role=tab with the same label.
        deepQuery('[role="tab"][id*="ag-ui-events"]');
      if (!tab) return null;
      tab.scrollIntoView({ block: 'center', inline: 'center' });
      const r = tab.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return null;
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    },
    [deepQueryFn, MENU_KEY] as const,
  );

  if (!eventsPos) {
    // Loud, not silent. A recording that quietly skips the one interaction the
    // clip exists to show is worse than a failed one — it looks like a pass.
    throw new Error(
      `[Inspector] Could not find the "AG-UI Events" nav item ` +
        `(button[data-inspector-menu-key="${MENU_KEY}"]) in any shadow root. ` +
        `The inspector's nav markup may have changed — check @copilotkit/web-inspector.`,
    );
  }

  console.log(
    `   🎯 AG-UI Events at (${Math.round(eventsPos.x)}, ${Math.round(eventsPos.y)})`,
  );
  // A real mouse click at the coordinates, so the on-screen cursor overlay in
  // the video actually shows the click. No el.click() — that fires the handler
  // without moving the cursor, which is why the old clip looked inert.
  await humanGlide(page, eventsPos.x, eventsPos.y, 20);
  await humanClick(page);
  await sleep(1200);

  const selected = await page.evaluate(
    ([deepQuerySrc, menuKey]) => {
      const deepQuery = eval(deepQuerySrc) as (s: string) => HTMLElement | null;
      const tab = deepQuery(`button[data-inspector-menu-key="${menuKey}"]`);
      return (
        tab?.getAttribute('aria-current') === 'page' ||
        !!tab?.className.includes('inspector-nav-control-active')
      );
    },
    [deepQueryFn, MENU_KEY] as const,
  );

  if (!selected) {
    throw new Error(
      `[Inspector] Clicked the "AG-UI Events" nav item but it did not become ` +
        `active — the panel did not switch.`,
    );
  }
  console.log(`   ✓ AG-UI Events panel is active.`);
  await sleep(4000);

  await humanGlide(page, 960, 500, 25);
  await sleep(config.waitAfterPromptMs ?? 4000);
};
