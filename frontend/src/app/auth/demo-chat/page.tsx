import { DemoFrame } from "@/components/demo-frame";
import { getHealth } from "@/lib/health";

import { AuthDemoChat } from "./auth-demo-chat";

/**
 * Server component: whether the agent demands a bearer token can only be
 * answered by asking the agent, and the browser has no route to it. The chat
 * itself lives in a client child.
 */
export default async function Page() {
  const { authRequired } = await getHealth();
  const tokenConfigured = Boolean(process.env.NEXT_PUBLIC_AUTH_BEARER_TOKEN);

  return (
    <DemoFrame
      parentPath="/auth"
      subtitle={
        authRequired
          ? "bearer token required by the agent"
          : "endpoints currently open"
      }
    >
      <AuthDemoChat
        authRequired={authRequired}
        tokenConfigured={tokenConfigured}
      />
    </DemoFrame>
  );
}
