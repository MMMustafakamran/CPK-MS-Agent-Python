import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from './cursor';

/** Injects or re-attaches the Windows 11 Taskbar & Virtual Mouse overlay onto the current page */
export async function ensureOverlays(
  page: Page,
  activeApp: 'chrome' | 'vscode' = 'chrome',
): Promise<void> {
  const chromeInd = activeApp === 'chrome' ? '#60a5fa' : 'transparent';
  const vscodeInd = activeApp === 'vscode' ? '#60a5fa' : 'transparent';

  const code = `
    (function() {
      // 0. Ensure Next.js dev indicator sits cleanly above the 48px Windows 11 taskbar
      var elevateBadges = function() {
        var portals = document.querySelectorAll('nextjs-portal');
        for (var i = 0; i < portals.length; i++) {
          var p = portals[i];
          if (p.shadowRoot) {
            var ind = p.shadowRoot.querySelector('#devtools-indicator, [data-nextjs-toast]');
            if (ind) ind.style.bottom = '56px';
          }
        }
      };
      elevateBadges();
      setTimeout(elevateBadges, 500);
      setTimeout(elevateBadges, 1500);

      // 1. Windows 11 Taskbar
      var bar = document.getElementById('win11-taskbar-overlay');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'win11-taskbar-overlay';
        bar.style.cssText = 'position:fixed!important;bottom:0!important;left:0!important;width:100vw!important;height:48px!important;background-color:rgba(28,28,28,0.95)!important;backdrop-filter:blur(24px)!important;-webkit-backdrop-filter:blur(24px)!important;border-top:1px solid rgba(255,255,255,0.08)!important;z-index:2147483645!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:0 12px!important;box-sizing:border-box!important;font-family:Segoe UI,-apple-system,BlinkMacSystemFont,Roboto,sans-serif!important;user-select:none!important;pointer-events:none!important;';

        bar.innerHTML = [
          '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#e4e4e4;width:140px;">',
          '  <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/></svg>',
          '  <span style="font-size:11px;font-weight:500;">78°F Sunny</span>',
          '</div>',
          '<div id="win11-taskbar-center-icons" style="display:flex;align-items:center;gap:6px;position:absolute;left:50%;transform:translateX(-50%);">',
          '  <div id="win11-taskbar-start" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:4px;"><svg width="20" height="20" viewBox="0 0 88 88" fill="#0078d4"><path d="M0 12.48 35.68 7.6v33.4H0V12.48zM0 45.48h35.68v33.4L0 74.01V45.48zM41.48 6.78 88 0v41H41.48V6.78zM88 45.48v41L41.48 80V45.48H88z"/></svg></div>',
          '  <div id="win11-taskbar-search" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e4e4e4" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>',
          '  <div id="win11-taskbar-taskview" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:4px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e4e4e4" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg></div>',
          '  <div id="win11-taskbar-explorer" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:4px;"><svg width="22" height="22" viewBox="0 0 24 24"><path fill="#facc15" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg></div>',
          '  <div id="win11-taskbar-chrome" style="width:40px;height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;border-radius:4px;transition:background 0.2s;"><svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#3b82f6"/><circle cx="12" cy="12" r="4" fill="#ffffff"/></svg><div id="win11-chrome-indicator" style="position:absolute;bottom:2px;width:14px;height:3px;background:${chromeInd};border-radius:2px;transition:background 0.2s;"></div></div>',
          '  <div id="win11-taskbar-vscode" style="width:40px;height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;border-radius:4px;transition:background 0.2s;"><svg width="22" height="22" viewBox="0 0 24 24"><path fill="#007acc" d="M18.5 2.5 12 8.5 7 4.5 3.5 6v12L7 19.5l5-4 6.5 6 3-1.5V4l-3-1.5z"/></svg><div id="win11-vscode-indicator" style="position:absolute;bottom:2px;width:14px;height:3px;background:${vscodeInd};border-radius:2px;transition:background 0.2s;"></div></div>',
          '  <div id="win11-taskbar-notepad" style="width:40px;height:40px;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;border-radius:4px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="#60a5fa"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg><div id="win11-notepad-indicator" style="position:absolute;bottom:2px;width:14px;height:3px;background:transparent;border-radius:2px;"></div></div>',
          '  <div id="win11-taskbar-terminal" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:4px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="#1e1e1e" stroke="#e4e4e4" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m6 9 4 3-4 3m6 0h4"/></svg></div>',
          '</div>',
          '<div style="display:flex;align-items:center;gap:12px;font-size:12px;color:#e4e4e4;">',
          '  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e4e4e4" stroke-width="2"><path d="m18 15-6-6-6 6"/></svg>',
          '  <span style="font-weight:500;font-size:11px;">ENG</span>',
          '  <svg width="16" height="16" viewBox="0 0 24 24" fill="#e4e4e4"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/></svg>',
          '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e4e4e4" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
          '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e4e4e4" stroke-width="2"><rect x="2" y="7" width="16" height="10" rx="2"/><path d="M22 11v2"/></svg>',
          '  <div style="display:flex;flex-direction:column;align-items:flex-end;line-height:1.15;font-size:11px;padding:2px 4px;">',
          '    <span id="win11-time" style="font-weight:500;"></span>',
          '    <span id="win11-date" style="font-size:10px;color:#a1a1aa;"></span>',
          '  </div>',
          '  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e4e4e4" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
          '  <div style="width:2px;height:16px;background:rgba(255,255,255,0.2);"></div>',
          '</div>'
        ].join('');

        document.documentElement.appendChild(bar);

        var tick = function() {
          var now = new Date();
          var timeEl = document.getElementById('win11-time');
          var dateEl = document.getElementById('win11-date');
          if (timeEl) timeEl.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
          if (dateEl) dateEl.textContent = now.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: 'numeric' });
        };
        tick();
        setInterval(tick, 1000);
      } else {
        // Update indicators if already present
        var cInd = document.getElementById('win11-chrome-indicator');
        var vInd = document.getElementById('win11-vscode-indicator');
        if (cInd) cInd.style.background = '${chromeInd}';
        if (vInd) vInd.style.background = '${vscodeInd}';
      }

      // 2. Virtual Mouse Cursor
      var cursor = document.getElementById('playwright-virtual-mouse');
      if (!cursor) {
        cursor = document.createElement('div');
        cursor.id = 'playwright-virtual-mouse';
        cursor.style.cssText = 'position:fixed!important;top:300px!important;left:500px!important;width:24px!important;height:24px!important;z-index:2147483647!important;pointer-events:none!important;transform:translate(-2px,-2px)!important;transition:transform 0.04s ease-out!important;';
        cursor.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" style="filter:drop-shadow(0 2px 6px rgba(0,0,0,0.6));"><path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" fill="#ffffff" stroke="#111111" stroke-width="1.5"/></svg>';
        document.documentElement.appendChild(cursor);
      }
    })();
  `;

  await page.evaluate(code);
}

/** Glides virtual mouse down to Taskbar icon, clicks it, and illuminates active glow indicator */
export async function clickTaskbarApp(
  page: Page,
  targetApp: 'vscode' | 'chrome',
): Promise<void> {
  const targetId =
    targetApp === 'vscode' ? 'win11-taskbar-vscode' : 'win11-taskbar-chrome';

  // Get taskbar icon coordinates
  const coords = (await page.evaluate(`
    (function() {
      var el = document.getElementById('${targetId}');
      if (el) {
        var rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      }
      return { x: ${targetApp === 'vscode' ? 1029 : 983}, y: 1056 };
    })()
  `)) as { x: number; y: number };

  // Glide cursor down to taskbar icon
  await humanGlide(page, coords.x, coords.y, 22);

  // Hover visual effect
  await page.evaluate(`
    (function() {
      var el = document.getElementById('${targetId}');
      if (el) el.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
    })()
  `);
  await sleep(150);

  // Click taskbar icon
  await humanClick(page);

  // Illuminate active indicator bar
  await page.evaluate(`
    (function() {
      var cInd = document.getElementById('win11-chrome-indicator');
      var vInd = document.getElementById('win11-vscode-indicator');
      var el = document.getElementById('${targetId}');
      if (el) el.style.backgroundColor = 'transparent';
      if ('${targetApp}' === 'vscode') {
        if (vInd) vInd.style.background = '#60a5fa';
        if (cInd) cInd.style.background = 'transparent';
      } else {
        if (cInd) cInd.style.background = '#60a5fa';
        if (vInd) vInd.style.background = 'transparent';
      }
    })()
  `);

  await sleep(400);
}
