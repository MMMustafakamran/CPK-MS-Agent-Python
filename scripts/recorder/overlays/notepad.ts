import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from './cursor';

/** Injects an authentic Windows 11 Notepad window and types unformatted developer notes with human cadence */
export async function showNotepadNote(
  page: Page,
  title: string,
  textLines: string[],
): Promise<void> {
  console.log(`📝 Opening Notepad: ${title}...`);
  await sleep(1000);

  // Glide down to taskbar Notepad icon and click it
  await humanGlide(page, 1038, 1055, 25);
  await humanClick(page);
  await sleep(200);

  // Activate taskbar indicator and animate window opening
  await page.evaluate(`
    (function() {
      var ind = document.getElementById('win11-notepad-indicator');
      if (ind) ind.style.background = '#60a5fa';

      var existing = document.getElementById('win11-notepad-overlay');
      if (existing) existing.remove();

      var np = document.createElement('div');
      np.id = 'win11-notepad-overlay';
      np.style.cssText = 'position:fixed!important;top:140px!important;left:50%!important;transform:translateX(-50%) scale(0.96)!important;opacity:0!important;width:760px!important;height:360px!important;background:#202020!important;border:1px solid rgba(255,255,255,0.15)!important;border-radius:8px!important;box-shadow:0 24px 60px rgba(0,0,0,0.85),0 0 0 1px rgba(255,255,255,0.08)!important;z-index:2147483640!important;display:flex!important;flex-direction:column!important;font-family:Segoe UI,sans-serif!important;overflow:hidden!important;transition:all 0.4s cubic-bezier(0.16,1,0.3,1)!important;';

      np.innerHTML = [
        // Titlebar
        '<div style="height:38px;background:#2b2b2b;display:flex;align-items:center;justify-content:space-between;padding:0 14px;border-bottom:1px solid rgba(255,255,255,0.08);user-select:none;">',
        '  <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#e5e5e5;font-weight:500;">',
        '    <svg width="16" height="16" viewBox="0 0 24 24" fill="#60a5fa"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>',
        '    <span>' + ${JSON.stringify(title)} + ' - Notepad</span>',
        '  </div>',
        '  <div style="display:flex;align-items:center;gap:12px;color:#a3a3a3;font-size:11px;">',
        '    <span>&#x2500;</span><span>&#x25A1;</span><span style="color:#ef4444;font-size:13px;font-weight:bold;">&#x2715;</span>',
        '  </div>',
        '</div>',
        // Menu Bar
        '<div style="height:26px;background:#202020;display:flex;align-items:center;gap:16px;padding:0 14px;font-size:11px;color:#a3a3a3;border-bottom:1px solid rgba(255,255,255,0.06);user-select:none;">',
        '  <span>File</span><span>Edit</span><span>View</span>',
        '</div>',
        // Text Content Area
        '<div id="notepad-content-body" style="flex:1;padding:18px;background:#1e1e1e;color:#f3f3f3;font-family:Consolas,Courier New,monospace;font-size:14px;line-height:1.7;white-space:pre-wrap;overflow-y:auto;"></div>'
      ].join('');

      document.documentElement.appendChild(np);

      // Trigger smooth transition
      setTimeout(function() {
        np.style.opacity = '1';
        np.style.transform = 'translateX(-50%) scale(1)';
      }, 30);
    })()
  `);

  await sleep(600);

  // Move mouse up into Notepad text area and click to place cursor
  await humanGlide(page, 960, 260, 22);
  await humanClick(page);
  await sleep(400);

  // Type plain unformatted text with human cadence
  const fullText = textLines.join('\n');
  for (let i = 0; i < fullText.length; i++) {
    const char = fullText[i];
    await page.evaluate(`
      (function() {
        var el = document.getElementById('notepad-content-body');
        if (el) {
          el.textContent = ${JSON.stringify(fullText.slice(0, i + 1))} + ' |';
        }
      })()
    `);

    // Natural variable delay based on character type and human rhythm
    let delay = 60 + Math.floor(Math.random() * 45); // 60ms - 105ms base keystroke

    if (char === '\n') {
      delay = 380 + Math.floor(Math.random() * 140); // Newline thought pause: 380-520ms
    } else if (char === '.' || char === ':' || char === '!' || char === '?') {
      delay = 280 + Math.floor(Math.random() * 120); // Sentence boundary pause: 280-400ms
    } else if (char === ',' || char === ';') {
      delay = 180 + Math.floor(Math.random() * 80); // Clause pause: 180-260ms
    } else if (char === ' ') {
      delay = 85 + Math.floor(Math.random() * 35); // Word boundary: 85-120ms
    } else if (Math.random() < 0.035) {
      delay = 240 + Math.floor(Math.random() * 160); // Occasional thinking hesitation
    }

    await sleep(delay);
  }

  // Remove blinking caret at the end
  await page.evaluate(`
    (function() {
      var el = document.getElementById('notepad-content-body');
      if (el) {
        el.textContent = ${JSON.stringify(fullText)};
      }
    })()
  `);

  await sleep(4500);
}
