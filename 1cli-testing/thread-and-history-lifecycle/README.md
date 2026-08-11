# Thread and History Lifecycle test

This test uses the v2 configuration hook to switch between threads and start a
new one. Update `agentId="my-agent"` if the generated project uses a different
agent id. The CLI-generated runtime must have Enterprise Intelligence enabled
for an existing thread's history to replay.

Test:

1. Start the app with `npm run dev`.
2. Send a message to create a persisted thread.
3. Paste that thread id into the input and choose Open conversation.
4. Confirm the previous history is restored.
5. Choose New chat and confirm the view is fresh.

`components/ExplicitThreadChat.tsx` is the separate prop-controlled example
from the lifecycle doc. Use it when you already own the thread id; do not mix
it with the configuration setters in the same chat.
