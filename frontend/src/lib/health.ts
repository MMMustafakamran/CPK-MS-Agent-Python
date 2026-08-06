import "server-only";

/**
 * Reachability + configuration snapshot for the connection panel.
 *
 * Server-side by necessity: the browser has no route to the agent process (and
 * should not have one), so a client-side probe would report a failure even on a
 * correctly configured install.
 */

export interface HealthReport {
  agent: { ok: boolean; detail: string };
  agentUrl: string;
  authRequired: boolean;
  licenseKeySet: boolean;
}

export const AGENT_URL = process.env.MS_AGENT_URL ?? "http://localhost:8000";

export async function getHealth(): Promise<HealthReport> {
  const statusUrl = `${AGENT_URL}/health`;

  let agent: HealthReport["agent"];
  let authRequired = false;

  try {
    const res = await fetch(statusUrl, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (res.ok) {
      const body = (await res.json()) as { authRequired?: boolean };
      authRequired = Boolean(body.authRequired);
      agent = { ok: true, detail: `200 from ${statusUrl}` };
    } else {
      agent = { ok: false, detail: `${statusUrl} returned ${res.status}` };
    }
  } catch (error) {
    agent = {
      ok: false,
      detail:
        error instanceof Error
          ? `${statusUrl} unreachable — ${error.message}`
          : `${statusUrl} unreachable`,
    };
  }

  return {
    agent,
    agentUrl: AGENT_URL,
    authRequired,
    licenseKeySet: Boolean(process.env.NEXT_PUBLIC_COPILOTKIT_LICENSE_KEY),
  };
}
