import { type Page } from 'playwright';

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * High-fidelity human mouse glide using multi-phase paths (ballistic + correction),
 * Fitts's Law timing, heavy Bézier curves for arcs/S-shapes, and variable jitter.
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

  let startX = currentPos.x;
  let startY = currentPos.y;
  const totalDistance = Math.hypot(targetX - startX, targetY - startY);

  if (totalDistance < 2) return;

  // Decide if we should overshoot (simulating human inaccuracy on fast/long moves)
  const willOvershoot = totalDistance > 100 && Math.random() > 0.3; // 70% chance to overshoot on long moves
  
  let waypoints: { x: number; y: number }[] = [];
  
  if (willOvershoot) {
    // Calculate overshoot target (5 to 30 pixels past/around the target)
    const overshootDistance = 5 + Math.random() * 25;
    const angle = Math.atan2(targetY - startY, targetX - startX);
    
    // Add slight angle deviation to the overshoot
    const overshootAngle = angle + (Math.random() - 0.5) * 0.4;
    
    const overshootX = targetX + Math.cos(overshootAngle) * overshootDistance;
    const overshootY = targetY + Math.sin(overshootAngle) * overshootDistance;
    
    waypoints.push({ x: overshootX, y: overshootY });
  }
  
  waypoints.push({ x: targetX, y: targetY });
  
  // Execute paths to each waypoint
  for (let w = 0; w < waypoints.length; w++) {
    const wp = waypoints[w];
    const isOvershootPhase = w === 0 && willOvershoot;
    const distance = Math.hypot(wp.x - startX, wp.y - startY);
    
    if (distance < 1) continue;

    // Dynamic steps based on distance
    let baseSteps = Math.min(60, Math.max(15, Math.floor(distance / (isOvershootPhase ? 12 : 4))));
    if (customSteps) baseSteps = customSteps;
    
    const steps = baseSteps;

    // Control points for Bézier curve
    const midX = (startX + wp.x) / 2;
    const midY = (startY + wp.y) / 2;
    const normalX = -(wp.y - startY) / (distance || 1);
    const normalY = (wp.x - startX) / (distance || 1);

    // Natural arc deviation (more for ballistic, less for correction)
    let maxCurvature = isOvershootPhase ? Math.min(180, distance * 0.4) : Math.min(25, distance * 0.15);
    const curvature = (Math.random() - 0.5) * maxCurvature;
    
    // Randomize control points heavily for a non-straight line
    const cp1X = startX + (midX - startX) * (0.2 + Math.random() * 0.6) + normalX * curvature;
    const cp1Y = startY + (midY - startY) * (0.2 + Math.random() * 0.6) + normalY * curvature;
    
    // Second control point can have opposite curvature for an 'S' shape, or same for a 'C' arc
    const curvature2 = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * maxCurvature);
    const cp2X = midX + (wp.x - midX) * (0.2 + Math.random() * 0.6) + normalX * curvature2;
    const cp2Y = midY + (wp.y - midY) * (0.2 + Math.random() * 0.6) + normalY * curvature2;

    for (let i = 1; i <= steps; i++) {
      const rawT = i / steps;

      // Custom easing function based on phase
      let t: number;
      if (isOvershootPhase) {
        // Ballistic: Fast start, slow down at the end
        t = 1 - Math.pow(1 - rawT, 3);
      } else {
        // Correction: slower, deliberate (Ease out)
        t = 1 - Math.pow(1 - rawT, 2);
      }

      // Cubic Bézier formula
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;

      let cx = uuu * startX + 3 * uu * t * cp1X + 3 * u * tt * cp2X + ttt * wp.x;
      let cy = uuu * startY + 3 * uu * t * cp1Y + 3 * u * tt * cp2Y + ttt * wp.y;

      // Jitter / micro-tremor
      if (i > 1 && i < steps) {
        // More jitter when moving slowly (rawT close to 1 in ballistic, or during correction)
        const jitterAmount = isOvershootPhase ? (rawT > 0.7 ? 1.8 : 0.6) : 1.2;
        cx += (Math.random() - 0.5) * jitterAmount;
        cy += (Math.random() - 0.5) * jitterAmount;
      }

      await page.evaluate(`
        (function() {
          var c = document.getElementById('playwright-virtual-mouse');
          if (c) {
            c.style.left = "${cx}px";
            c.style.top = "${cy}px";
          }
        })()
      `);

      await page.mouse.move(cx, cy);

      // Variable delay based on Fitts's Law phases
      let stepDelay: number;
      if (isOvershootPhase) {
        if (rawT < 0.2) stepDelay = 8 + Math.random() * 8; // accelerating
        else if (rawT < 0.7) stepDelay = 2 + Math.random() * 4; // top speed
        else stepDelay = 12 + Math.random() * 15; // decelerating
      } else {
        stepDelay = 15 + Math.random() * 20; // slow correction
      }
      
      await sleep(stepDelay);
    }
    
    startX = wp.x;
    startY = wp.y;
    
    // Pause slightly between overshoot and correction (reaction time to realize overshoot)
    if (isOvershootPhase) {
      await sleep(40 + Math.random() * 80);
    }
  }

  // Settle at the exact target
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
  await sleep(60 + Math.floor(Math.random() * 40));
}

/** Human mouse click with realistic pre-click hesitation and depression duration */
export async function humanClick(page: Page): Promise<void> {
  await sleep(50 + Math.floor(Math.random() * 40));

  await page.evaluate(`
    (function() {
      var c = document.getElementById('playwright-virtual-mouse');
      if (c) c.style.transform = 'translate(-2px, -2px) scale(0.84)';
    })()
  `);
  await page.mouse.down();
  await sleep(90 + Math.floor(Math.random() * 50));

  await page.evaluate(`
    (function() {
      var c = document.getElementById('playwright-virtual-mouse');
      if (c) c.style.transform = 'translate(-2px, -2px) scale(1)';
    })()
  `);
  await page.mouse.up();
  await sleep(70 + Math.floor(Math.random() * 40));
}

/** Human scroll down using variable chunk sizes and deceleration easing */
export async function humanScrollDown(
  page: Page,
  totalPixels: number = 550,
  baseSpeedMs: number = 50,
): Promise<void> {
  let scrolled = 0;
  while (scrolled < totalPixels) {
    const chunk = Math.min(
      totalPixels - scrolled,
      35 + Math.floor(Math.random() * 25),
    );
    scrolled += chunk;

    await page.mouse.wheel(0, chunk);
    await page.evaluate(`
      (function() {
        window.scrollBy({ top: ${chunk}, behavior: 'smooth' });
        var main = document.querySelector('main, article, [class*="overflow-y-auto"]');
        if (main) main.scrollBy({ top: ${chunk}, behavior: 'smooth' });
      })()
    `);

    const progress = scrolled / totalPixels;
    const delay =
      progress > 0.8
        ? baseSpeedMs + 30
        : baseSpeedMs + Math.floor(Math.random() * 20);
    await sleep(delay);
  }
}
