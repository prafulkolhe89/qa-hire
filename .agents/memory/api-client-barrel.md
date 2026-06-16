---
name: API client barrel import rule
description: All imports from the generated API client must go through the barrel, never internal src/ paths.
---

Always import from `@workspace/api-client-react` (the barrel export), never from internal paths like `@workspace/api-client-react/src/generated/api.schemas` or `@workspace/api-client-react/src/custom-fetch`.

**Why:** The package's `exports` field in package.json does not expose sub-paths, so Vite's resolver rejects deep imports with "Missing specifier" errors at build/dev time. The barrel (`lib/api-client-react/src/index.ts`) re-exports everything: generated hooks, all Zod schemas, all TypeScript types, and `setBaseUrl`/`setAuthTokenGetter` from custom-fetch.

**How to apply:** When writing or reviewing frontend code that touches the API client, grep for `/src/generated/` or `/src/custom-fetch` import paths and replace them with the barrel import.
