import { type Page } from 'playwright';

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Practiced human mouse glide:
 * - Natural cubic Bézier curves (smooth organic arcs, never robotic straight lines).
 * - Variable dynamic velocity (fast acceleration, smooth momentum, subtle target ease).
 * - High event density (dense 60fps stream of mousemove events for fluid video playback).
 * - No sluggish overshoots or artificial hesitation pauses.
 */
export async function humanGlide(
  page: Page,
  targetX: number,
  targetY: number,
  customSteps?: number,
): Promise<void> {
  const currentPos = (await page.evaluate(`
    (function() {
      var c = document.getElementById('playwright-virtual-mouse');
      if (c) {
        return { x: parseFloat(c.style.left) || 960, y: parseFloat(c.style.top) || 540 };
      }
      return { x: 960, y: 540 };
    })()
  `)) as { x: number; y: number };

  const startX = currentPos.x;
  const startY = currentPos.y;
  const distance = Math.hypot(targetX - startX, targetY - startY);

  if (distance < 2) return;

  // Step count proportional to distance, tuned for 200ms - 350ms practiced speed
  const steps = customSteps ?? Math.min(26, Math.max(12, Math.floor(distance / 28)));

  // Compute organic curve control points
  const midX = (startX + targetX) / 2;
  const midY = (startY + targetY) / 2;
  const normalX = -(targetY - startY) / (distance || 1);
  const normalY = (targetX - startX) / (distance || 1);

  // Subtle natural arc (5% to 15% curvature perpendicular to motion vector)
  const maxCurvature = Math.min(30, distance * 0.12);
  const arcDirection = (targetX + targetY) % 2 === 0 ? 1 : -1;
  const curvature = arcDirection * (8 + Math.random() * maxCurvature);

  const cp1X = startX + (midX - startX) * 0.45 + normalX * curvature;
  const cp1Y = startY + (midY - startY) * 0.45 + normalY * curvature;
  const cp2X = midX + (targetX - midX) * 0.55 + normalX * (curvature * 0.6);
  const cp2Y = midY + (targetY - midY) * 0.55 + normalY * (curvature * 0.6);

  for (let i = 1; i <= steps; i++) {
    const rawT = i / steps;

    // Smooth cubic ease-out (fast start, natural deceleration at target)
    const t = 1 - Math.pow(1 - rawT, 2.5);

    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    let cx = uuu * startX + 3 * uu * t * cp1X + 3 * u * tt * cp2X + ttt * targetX;
    let cy = uuu * startY + 3 * uu * t * cp1Y + 3 * u * tt * cp2Y + ttt * targetY;

    // Subtle microscopic hand tremor (±0.25px)
    if (i > 1 && i < steps) {
      cx += (Math.random() - 0.5) * 0.35;
      cy += (Math.random() - 0.5) * 0.35;
    }

    await page.evaluate(`
      (function() {
        var c = document.getElementById('playwright-virtual-mouse');
        if (c) {
          c.style.left = "${cx.toFixed(1)}px";
          c.style.top = "${cy.toFixed(1)}px";
        }
      })()
    `);

    await page.mouse.move(cx, cy);

    // High refresh rate: 10ms - 14ms per frame (approx 60fps)
    await sleep(10 + Math.floor(Math.random() * 4));
  }

  // Exact target anchor
  await page.evaluate(`
    (function() {
      var c = document.getElementById('playwright-virtual-mouse');
      if (c) {
        c.style.left = "${targetX}px";
        c.style.top = "${targetY}px";
      }
    })()
  `);
  await page.mouse.move(targetX, targetY);
  await sleep(40);
}

/** Practiced human click with crisp, snappy press & release */
export async function humanClick(page: Page): Promise<void> {
  await sleep(30);

  await page.evaluate(`
    (function() {
      var c = document.getElementById('playwright-virtual-mouse');
      if (c) c.style.transform = 'translate(-2px, -2px) scale(0.85)';
    })()
  `);
  await page.mouse.down();
  await sleep(55);

  await page.evaluate(`
    (function() {
      var c = document.getElementById('playwright-virtual-mouse');
      if (c) c.style.transform = 'translate(-2px, -2px) scale(1)';
    })()
  `);
  await page.mouse.up();
  await sleep(40);
}

/** Swift smooth scroll down to code content without sluggish stutter */
export async function humanScrollDown(
  page: Page,
  totalPixels: number = 420,
  stepChunk: number = 60,
): Promise<void> {
  let scrolled = 0;
  while (scrolled < totalPixels) {
    const chunk = Math.min(totalPixels - scrolled, stepChunk);
    scrolled += chunk;

    await page.mouse.wheel(0, chunk);
    await page.evaluate(`
      (function() {
        window.scrollBy({ top: ${chunk}, behavior: 'smooth' });
        var main = document.querySelector('main, article, [class*="overflow-y-auto"]');
        if (main) main.scrollBy({ top: ${chunk}, behavior: 'smooth' });
      })()
    `);

    await sleep(22);
  }
}

