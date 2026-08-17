export interface HealthCheckResult {
  frontendOk: boolean;
  backendOk: boolean;
  frontendError?: string;
  backendError?: string;
}

/** Pre-flight check to verify if Next.js (port 3000) and Microsoft Agent Framework (port 8000) are running */
export async function checkServicesHealth(): Promise<HealthCheckResult> {
  const result: HealthCheckResult = {
    frontendOk: false,
    backendOk: false,
  };

  // Check Frontend (port 3000)
  try {
    const res = await fetch('http://localhost:3000/', {
      signal: AbortSignal.timeout(3000),
    });
    result.frontendOk = res.ok || res.status < 500;
  } catch (err: any) {
    result.frontendError = err.message || 'Connection refused on port 3000';
  }

  // Check Backend (port 8000)
  try {
    const res = await fetch('http://localhost:8000/health', {
      signal: AbortSignal.timeout(3000),
    });
    result.backendOk = res.ok || res.status < 500;
  } catch (err: any) {
    // Fallback check to /docs or root
    try {
      const resDocs = await fetch('http://localhost:8000/docs', {
        signal: AbortSignal.timeout(2000),
      });
      result.backendOk = resDocs.ok || resDocs.status < 500;
    } catch {
      result.backendError = err.message || 'Connection refused on port 8000';
    }
  }

  return result;
}

/** Automatically analyzes error messages and produces actionable diagnostic guidance */
export function diagnoseError(error: unknown, context?: string): string {
  const errStr =
    error instanceof Error ? error.message : String(error ?? 'Unknown error');

  if (errStr.includes('ECONNREFUSED') || errStr.includes('Failed to fetch')) {
    if (errStr.includes('8000') || context?.includes('backend')) {
      return (
        '🔴 [Microsoft Agent Framework Backend Offline]: The Python backend on port 8000 is not reachable.\n' +
        '   👉 Fix: Open a terminal, run: `cd backend && uv run --prerelease=allow main.py`'
      );
    }
    if (errStr.includes('3000') || context?.includes('frontend')) {
      return (
        '🔴 [Next.js Frontend Offline]: The Next.js dev server on port 3000 is not reachable.\n' +
        '   👉 Fix: Open a terminal, run: `cd frontend && npm run dev`'
      );
    }
  }

  if (errStr.includes('Timeout') && errStr.includes('waitFor')) {
    return (
      '⚠️ [UI Selector Timeout]: Playwright timed out waiting for an expected element on screen.\n' +
      '   👉 Fix: Verify that the route loaded correctly and the button/input exists in the DOM.'
    );
  }

  if (
    errStr.includes('CopilotKit core not attached') ||
    errStr.includes('CopilotKitProvider')
  ) {
    return (
      '⚠️ [CopilotKit Provider Issue]: CopilotKit components require a wrapping CopilotKitProvider.\n' +
      '   👉 Fix: Check `frontend/src/components/providers.tsx`.'
    );
  }

  if (errStr.includes('404') || errStr.includes('Not Found')) {
    return (
      `⚠️ [Route Not Found (404)]: The requested URL could not be found.\n` +
      `   👉 Fix: Ensure the page route exists in \`frontend/src/app/\`.`
    );
  }

  return `ℹ️ [Diagnostic Note]: ${errStr}`;
}
