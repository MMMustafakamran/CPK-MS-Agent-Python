import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotKitProvider,
  CopilotThreadsDrawer,
} from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

export default function Page() {
  return (
    <CopilotKitProvider
      // [1] threads drawer: shared provider
      // [!code highlight]
      runtimeUrl="/api/copilotkit"
      publicLicenseKey="ck_pub_..."
    >
      <CopilotChatConfigurationProvider>
        <div style={{ display: "flex", height: "100dvh" }}>
          {/* [2] threads drawer: thread list */}
          {/* [!code highlight] */}
          <CopilotThreadsDrawer />
          {/* [3] threads drawer: connected chat */}
          {/* [!code highlight] */}
          <CopilotChat />
        </div>
      </CopilotChatConfigurationProvider>
    </CopilotKitProvider>
  );
}

