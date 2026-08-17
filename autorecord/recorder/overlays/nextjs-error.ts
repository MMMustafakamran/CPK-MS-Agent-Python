import { type Page } from 'playwright';
import { humanClick, humanGlide, sleep } from './cursor';

export interface NextjsErrorCheckResult {
  hasError: boolean;
  errorMessage?: string;
}

/** Injects the authentic Next.js 15 Error Overlay modal onto the page */
async function showNextjsErrorOverlay(
  page: Page,
  errorDetail: string,
): Promise<void> {
  await page.evaluate((detail) => {
    // 1. Turn Next.js badge red if present in shadow DOM
    var portals = document.querySelectorAll('nextjs-portal');
    for (var i = 0; i < portals.length; i++) {
      var p = portals[i];
      if (p.shadowRoot) {
        var badge = p.shadowRoot.querySelector(
          '[data-next-badge], #next-logo, #devtools-indicator',
        ) as HTMLElement;
        if (badge) {
          badge.style.backgroundColor = '#ca2a30';
          badge.setAttribute('data-error', 'true');
        }
      }
    }

    // 2. Remove existing overlay if any
    var existing = document.getElementById('custom-nextjs-error-dialog');
    if (existing) existing.remove();

    // 3. Construct authentic Next.js 15 Error Overlay Window
    var overlay = document.createElement('div');
    overlay.id = 'custom-nextjs-error-dialog';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0, 0, 0, 0.7) !important;
      backdrop-filter: blur(12px) !important;
      -webkit-backdrop-filter: blur(12px) !important;
      z-index: 2147483644 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      animation: nextErrorFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards !important;
    `;

    var currentUrl = window.location.href;
    var currentPath = window.location.pathname;

    overlay.innerHTML = `
      <style>
        @keyframes nextErrorFadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
      <div style="
        width: 860px;
        max-width: 90vw;
        max-height: 85vh;
        background: #121212;
        border: 1px solid #2a2a2a;
        border-radius: 12px;
        box-shadow: 0 24px 48px -12px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.06);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        color: #ededed;
      ">
        <!-- Header Bar -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #222222;
          background: #181818;
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: rgba(229, 72, 77, 0.15);
              color: #ff6369;
              border: 1px solid rgba(229, 72, 77, 0.3);
              padding: 3px 10px;
              border-radius: 9999px;
              font-size: 12px;
              font-weight: 600;
              letter-spacing: 0.02em;
            ">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: #ff6369;"></span>
              Runtime Error
            </span>
            <span style="font-size: 13px; color: #888888; font-family: monospace;">${currentPath}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 12px; color: #666666;">Next.js App Router (Dev Mode)</span>
          </div>
        </div>

        <!-- Body -->
        <div style="padding: 24px; overflow-y: auto; display: flex; flex-direction: column; gap: 16px;">
          <!-- Error Title -->
          <div style="
            font-size: 17px;
            font-weight: 600;
            color: #ff6369;
            line-height: 1.4;
            font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
            background: rgba(229, 72, 77, 0.08);
            border-left: 3px solid #ff6369;
            padding: 12px 16px;
            border-radius: 0 6px 6px 0;
            word-break: break-word;
          ">
            ${detail}
          </div>

          <!-- File Source Context -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="font-size: 12px; color: #999999; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
              Origin Endpoint & Route
            </div>
            <div style="
              background: #181818;
              border: 1px solid #282828;
              border-radius: 8px;
              padding: 12px 16px;
              font-family: monospace;
              font-size: 13px;
              color: #a1a1aa;
              display: flex;
              align-items: center;
              gap: 8px;
            ">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
              <span>${currentUrl}</span>
            </div>
          </div>

          <!-- Stack Trace Terminal Box -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: #999999; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">Call Stack / Diagnostics</span>
              <span style="font-size: 11px; color: #666666;">CopilotKit + Agno Stream Handler</span>
            </div>
            <div style="
              background: #09090b;
              border: 1px solid #27272a;
              border-radius: 8px;
              padding: 14px 16px;
              font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace;
              font-size: 12px;
              line-height: 1.6;
              color: #d4d4d8;
              overflow-x: auto;
            ">
              <div style="color: #ff6369; margin-bottom: 6px;">▶ ${detail.split('\n')[0]}</div>
              <div style="color: #71717a;">  at Object.onRunErrorEvent (@copilotkit/core:2911:48)</div>
              <div style="color: #71717a;">  at AGUIClient.stream (@ag-ui/client:620:73)</div>
              <div style="color: #71717a;">  at async handleStreamEvents (frontend/src/app${currentPath}/page.tsx)</div>
              <div style="color: #52525b; margin-top: 8px; font-style: italic;">  Note: Verify backend server is listening on http://localhost:8000/api/copilotkit</div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="
          padding: 12px 20px;
          background: #181818;
          border-top: 1px solid #222222;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: #71717a;
        ">
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>Learn more about <a href="https://docs.copilotkit.ai/agno" target="_blank" style="color: #60a5fa; text-decoration: none;">CopilotKit + Agno Error Handling</a></span>
          </div>
          <span style="color: #52525b;">Press ESC or click Next.js icon to dismiss</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
  }, errorDetail);
}

/**
 * Error detection and expanding the Next.js error overlay modal is disabled for all pages.
 */
export async function checkAndExpandNextjsError(
  _page: Page,
  _knownError?: boolean,
  _errorHint?: string,
): Promise<NextjsErrorCheckResult> {
  // Disabled: do not detect errors, do not click dev badge, do not show error overlay
  return { hasError: false };
}
