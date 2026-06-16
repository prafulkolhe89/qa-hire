# QAHire

AI-powered job curator that scores and delivers the best QA/testing jobs in India directly to your Telegram.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/qa-hire run dev` — run the React frontend (port from env)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (`artifacts/api-server`)
- Frontend: React + Vite + Tailwind v4 + Clerk auth (`artifacts/qa-hire`)
- DB: PostgreSQL + Drizzle ORM (`lib/db`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle for API)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/api-client-react/src/index.ts` — barrel export for generated hooks + types (always import from here, never from internal paths)
- `lib/db/src/schema/` — Drizzle ORM schema files (users, profiles, jobs, feedback, telegram_connections)
- `artifacts/api-server/src/routes/` — Express route handlers (profile, jobs, feedback, telegram, stats)
- `artifacts/qa-hire/src/pages/` — React pages (home, dashboard, jobs, profile, telegram, settings)
- `artifacts/qa-hire/src/components/` — Shared components (layout, job-card, ui/*)
- `artifacts/qa-hire/src/index.css` — Teal/slate color palette (CSS vars for light/dark mode)

## Architecture decisions

- Contract-first: OpenAPI spec → Orval codegen → typed React Query hooks. Never write API calls by hand.
- All frontend API imports must come from `@workspace/api-client-react` barrel, never from internal `src/generated/` paths (Vite will reject deep imports).
- Clerk auth is Replit-managed. The API uses `clerkProxyMiddleware` to verify tokens server-side.
- `JobStatus` and similar enum types are plain TypeScript union types (not runtime enums) — use string literals like `"interested"` not `JobStatus.interested`.
- Stats/dashboard routes live under `/api/stats/*` (not `/api/dashboard/*`).

## Product

- Job preference profile: skills, experience, desired roles, locations, salary range, include/exclude keywords
- Daily AI-curated job matching with match scores and reasons
- Dashboard: new matches count, interested/applied counts, avg score, score distribution chart, source breakdown chart
- Jobs list: filterable by status, minimum score, location
- Status management per job: New → Interested / Applied / Not Relevant / Duplicate
- Telegram integration: connect chat ID, receive daily briefings
- Clerk auth: email + Google sign-in

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Never import from `@workspace/api-client-react/src/...` — use the barrel `@workspace/api-client-react` only.
- After any `lib/db` schema change, run `pnpm --filter @workspace/db run push` then `pnpm run typecheck:libs`.
- After any `lib/api-spec/openapi.yaml` change, run codegen: `pnpm --filter @workspace/api-spec run codegen`.
- `TELEGRAM_BOT_TOKEN` is not yet set — the `/api/telegram/test` route returns 503 gracefully when missing.
- Clerk sign-in page shows "Attached Assets" as the app name — update via Clerk Dashboard → Customization → Application Name.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk customization (branding, OAuth providers, etc.)
