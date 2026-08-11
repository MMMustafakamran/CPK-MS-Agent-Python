# CopilotKit CLI test

Run this from this folder. The CLI opens browser authentication when needed.

```bash
npx copilotkit@latest create
```

Complete these prompts:

1. Choose an app name.
2. Choose a framework.
3. Finish browser sign-in.
4. Select or create the Enterprise Intelligence project.

The generated project should contain:

- `.copilotkit/project.json`
- `.env` with the hosted platform URLs and `INTELLIGENCE_API_KEY`
- `npm run dev` for the local app and runtime

## Quick checks

```bash
npx copilotkit@latest whoami
npx copilotkit@latest project select
npm run dev
```

Keep the generated `.env` and `.copilotkit/` files private. Do not move the
`INTELLIGENCE_API_KEY` into frontend code.

