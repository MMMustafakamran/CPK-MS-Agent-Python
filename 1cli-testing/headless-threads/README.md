# Headless Threads test

Copy these files into the CLI-generated project using the same relative paths.
The CLI project's provider and runtime remain responsible for authentication,
Enterprise Intelligence, and persistence. Update `agentId: "my-agent"` if the
generated project uses a different agent id.

Test:

1. Start the app with `npm run dev`.
2. Open the page.
3. Send a chat message to create a thread.
4. Select another thread to replay its history.
5. Rename or archive a thread.
6. Create enough threads to test Load more pagination.
