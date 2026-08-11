# Threads Drawer test

Use this file in the CLI-generated project's `app/page.tsx`. It implements the
documented shared provider, drawer, and chat structure with minimal layout.

Requirements:

- The CLI project must be connected to Enterprise Intelligence.
- Replace `ck_pub_...` with the public key from the generated project and keep
  its runtime URL if it differs from `/api/copilotkit`.
- If the generated project already owns `CopilotKitProvider` in its layout,
  keep one provider and move only the drawer/chat children into the page.

Test:

1. Start the generated app with `npm run dev`.
2. Open the page.
3. Create a conversation and send a message.
4. Select the conversation from the drawer.
5. Use New Conversation, archive, and delete.
