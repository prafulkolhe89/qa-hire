# QAHire — Project Context Document

> **Purpose:** This file is the single source of memory for the QAHire project. Read this first before making any changes. Keep it updated as the project evolves.

---

## Table of Contents

1. [What Is This Project?](#1-what-is-this-project)
2. [Current State vs Vision](#2-current-state-vs-vision)
3. [Repository Layout](#3-repository-layout)
4. [Tech Stack](#4-tech-stack)
5. [Architecture Decisions (Rules to Follow)](#5-architecture-decisions-rules-to-follow)
6. [Database Schema](#6-database-schema)
7. [API Endpoints](#7-api-endpoints)
8. [Authentication](#8-authentication)
9. [Environment Variables](#9-environment-variables)
10. [Frontend Pages & Routing](#10-frontend-pages--routing)
11. [External Integrations](#11-external-integrations)
12. [Deployment & Dev Commands](#12-deployment--dev-commands)
13. [Implemented Features](#13-implemented-features)
14. [Pending Features (Roadmap)](#14-pending-features-roadmap)
15. [Known Issues & TODOs](#15-known-issues--todos)
16. [Monetization Model](#16-monetization-model)
17. [Source Documents](#17-source-documents)

---

## 1. What Is This Project?

**QAHire** is a B2C SaaS web application — an **AI-powered job curation platform** for **Indian QA/testing professionals**.

- **Niche:** QA/software-testing jobs only (MVP scope)
- **Target market:** Indian QA engineers in cities like Pune, Mumbai, Bangalore, Hyderabad; also Remote
- **Core value:** Users set their QA profile once; the system finds matching jobs daily from LinkedIn, Naukri, Indeed, Hirist, Wellfound, company career pages — AI-scores them — and delivers the best ones straight to **Telegram**
- **Stage:** Working MVP scaffold (auth, profile, job listing, dashboard, Telegram connect) is live on Replit. Core automation (job scraping, AI matching, daily cron, monetization) is **not yet implemented**
- **Platform:** Replit multi-artifact autoscale deployment

---

## 2. Current State vs Vision

| Layer | Built? |
|-------|--------|
| Auth (Clerk email + Google) | ✅ |
| Job preference profile CRUD | ✅ |
| Job listing with filters & status actions | ✅ |
| Dashboard analytics (counts, charts) | ✅ |
| Telegram connect / test message | ✅ |
| Feedback API (backend only) | ✅ (no UI) |
| Settings page with subscription/usage | ✅ |
| OpenAPI contract + manually extended client | ✅ |
| Resume upload (PDF/DOCX, text extraction) | ✅ |
| Keyword extraction from resume (OpenAI) | ✅ |
| Keywords editor (add/edit/delete) | ✅ |
| Cover letter generator (OpenAI) | ✅ |
| Apply guidance generator (OpenAI) | ✅ |
| LinkedIn recruiter message generator | ✅ |
| Profile versioning (on criteria changes) | ✅ |
| Subscription/usage quota enforcement | ✅ |
| Job detail page (`/jobs/:id`) | ✅ |
| Matched/missing skills on job cards | ✅ |
| Daily job scraping / ingestion | ❌ |
| AI matching / scoring engine | ❌ (DB fields exist, no generation) |
| Daily Telegram briefing (cron) | ❌ |
| Admin dashboard | ❌ |
| Feedback learning loop | ❌ |
| Stripe payment integration | ❌ (upgrade CTA is UI-only) |
| Test suite | ❌ |

---

## 3. Repository Layout

```
Attached-Assets/                    ← git root / pnpm workspace root
├── attached_assets/                ← original product requirement docs (do not edit)
│   ├── Pasted-Act-as-a-senior-product-architect-...txt   ← original blueprint
│   └── Pasted-You-are-a-senior-full-stack-SaaS-engineer-...txt  ← enhancement spec (12 features)
├── artifacts/
│   ├── api-server/                 ← Express 5 REST API  (port 8080)
│   │   └── src/
│   │       ├── app.ts / index.ts
│   │       ├── routes/             ← health, profile, jobs, feedback, telegram, stats
│   │       ├── middlewares/clerkProxyMiddleware.ts
│   │       └── lib/logger.ts       ← Pino
│   ├── qa-hire/                    ← React 19 + Vite 7 frontend (port 23258)
│   │   └── src/
│   │       ├── pages/              ← home, dashboard, jobs, profile, telegram, settings, not-found
│   │       └── components/         ← layout, job-card, ui/* (shadcn/Radix)
│   └── mockup-sandbox/             ← isolated UI component preview (not QAHire product logic)
├── lib/
│   ├── api-spec/                   ← openapi.yaml (SOURCE OF TRUTH for API contract)
│   ├── api-client-react/           ← Orval-generated React Query hooks  ← import from here
│   ├── api-zod/                    ← Orval-generated Zod validators
│   └── db/                         ← Drizzle ORM + PostgreSQL schema
├── scripts/
│   └── post-merge.sh               ← pnpm install + db push
├── CONTEXT.md                      ← THIS FILE
├── replit.md                       ← Replit operational notes
├── .replit                         ← Replit deployment config
└── pnpm-workspace.yaml             ← workspace + dependency catalog
```

---

## 4. Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces, TypeScript 5.9 |
| Runtime | Node.js 24 |
| API | Express 5, esbuild bundle (CJS → `dist/index.mjs`) |
| Logging | Pino |
| Frontend | React 19, Vite 7, Wouter (routing), Tailwind CSS v4 |
| UI components | shadcn/ui + Radix UI primitives, Lucide icons, Recharts |
| Forms | react-hook-form |
| Auth | Clerk (`@clerk/react`, `@clerk/express`) |
| Database | PostgreSQL 16 + Drizzle ORM + drizzle-zod |
| Validation | Zod v4 |
| API contract | OpenAPI 3.1 → Orval codegen → React Query v5 hooks + Zod schemas |
| State/fetch | TanStack React Query v5 |
| Notifications | Telegram Bot API |

### Planned (not yet in code)

- OpenAI / Gemini API (AI matching, extraction, generation)
- Job scheduler / cron / GitHub Actions
- Stripe (billing/subscriptions)

---

## 5. Architecture Decisions (Rules to Follow)

1. **Contract-first API** — `lib/api-spec/openapi.yaml` is the single source of truth. Never hand-write API calls in the frontend. Run codegen when the spec changes:
   ```bash
   pnpm --filter @workspace/api-spec run codegen
   ```

2. **Barrel import rule** — Frontend must always import from `@workspace/api-client-react`. Never import from deep paths like `src/generated/`.

3. **Clerk on Replit** — `clerkProxyMiddleware` proxies `/api/__clerk` to `frontend-api.clerk.dev` in production for custom `.replit.app` domains (no CNAME needed). Auth must be configured via the Replit Auth pane, not the external Clerk dashboard.

4. **Multi-artifact Replit deployment** — API (port 8080) and frontend (port 23258, static SPA with `/*` rewrites) are separate artifacts. Keep them separate.

5. **JobStatus type** — Use the TypeScript union `"new" | "interested" | "applied" | "not_relevant" | "duplicate"`. Do NOT use runtime enums.

6. **Stats routes** — Dashboard data lives under `/api/stats/*`, NOT `/api/dashboard/*`.

7. **Per-user job rows** — The `jobs` table is user-scoped (`userId` column). There is no shared global job catalog; each user has their own rows.

8. **Supply-chain hardening** — `pnpm-workspace.yaml` enforces `minimumReleaseAge: 1440` (1-day npm package age minimum). Respect this.

9. **Post-merge automation** — `scripts/post-merge.sh` runs `pnpm install` + `pnpm --filter db push` automatically after merges. No need to run manually after a pull.

---

## 6. Database Schema

All tables in `lib/db/src/schema/`. ORM: Drizzle. DB: PostgreSQL 16.

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | text PK | Clerk user ID |
| email | text | |
| first_name | text | |
| last_name | text | |
| created_at | timestamp | |
| updated_at | timestamp | |

> Table defined but **not actively used** in API routes — Clerk is auth source of truth.

### `profiles` (one per user)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| user_id | text unique | |
| skills | text[] | |
| years_of_experience | int | |
| preferred_locations | text[] | |
| notice_period | text | |
| job_types | text[] | full-time, remote, hybrid, contract |
| include_keywords | text[] | |
| exclude_keywords | text[] | |
| expected_salary_min | int nullable | |
| expected_salary_max | int nullable | |
| is_active | bool | |
| subscription_plan | text | `free` or `pro`, default `free` |
| profile_version | int | increments when matching criteria change |
| monthly_profile_edit_count | int | reset via quotaResetDate logic |
| daily_job_match_count | int | reset daily |
| daily_cover_letter_count | int | reset daily |
| last_profile_changed_at | timestamp nullable | |
| search_quota_used | int | |
| quota_reset_date | date nullable | |
| created_at / updated_at | timestamp | |

### `jobs`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| user_id | text | |
| title, company, location, source | text | |
| apply_url | text | |
| posted_at | timestamp | |
| match_score | int 0-100 | AI-generated (not yet implemented) |
| match_reason | text | AI-generated (not yet implemented) |
| status | text | new \| interested \| applied \| not_relevant \| duplicate |
| skills | text[] | |
| experience_required | text nullable | |
| salary_range | text nullable | |
| job_type | text nullable | |
| description | text nullable | |
| external_id | text nullable | for deduplication |
| matched_skills | text[] | Skills from candidate that match the job |
| missing_skills | text[] | Skills required but absent in candidate |
| profile_version_id | int nullable | Version of profile that generated this match |
| created_at | timestamp | |

### `feedback`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| user_id | text | |
| job_id | int | FK to jobs |
| rating | int 1-5 | |
| comment | text nullable | |
| created_at | timestamp | |

### `telegram_connections`
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| user_id | text unique | |
| chat_id | text | |
| username | text nullable | |
| is_active | bool | |
| created_at / updated_at | timestamp | |

### New Tables (implemented)

| Table | File | Purpose |
|-------|------|---------|
| `resumes` | `lib/db/src/schema/resumes.ts` | File reference, extracted text, status (`pending\|processing\|ready\|failed`) |
| `keywords` | `lib/db/src/schema/keywords.ts` | Per-user keywords with source (`resume_generated\|user_added\|user_edited\|system_suggested`) and category |
| `profile_versions` | `lib/db/src/schema/profile-versions.ts` | JSON snapshot of profile on every matching-criteria change |
| `cover_letters` | `lib/db/src/schema/cover-letters.ts` | Per-job generated cover letter, editable |
| `recruiter_messages` | `lib/db/src/schema/recruiter-messages.ts` | Per-job <700 char LinkedIn messages |
| `apply_guidance` | `lib/db/src/schema/apply-guidance.ts` | Apply method, action steps, links per job |

---

## 7. API Endpoints

Base path: `/api` (port 8080)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| GET | `/api/profile` | Get current user's profile |
| POST | `/api/profile` | Create profile |
| PATCH | `/api/profile` | Update profile |
| GET | `/api/jobs` | List jobs (query: `status`, `minScore`, `source`, `location`, `page`, `limit`) |
| GET | `/api/jobs/:id` | Single job detail |
| PATCH | `/api/jobs/:id/status` | Update job status |
| POST | `/api/feedback` | Submit feedback (rating 1-5 + optional comment) |
| GET | `/api/telegram/status` | Telegram connection status |
| POST | `/api/telegram/connect` | Connect with chat ID |
| POST | `/api/telegram/disconnect` | Disconnect |
| POST | `/api/telegram/test` | Send test message |
| GET | `/api/stats/dashboard` | Overview counts + avg score |
| GET | `/api/stats/recent-jobs` | Top 5 recent high-scoring jobs |
| GET | `/api/stats/sources` | Jobs grouped by source |
| GET | `/api/stats/score-distribution` | Score histogram (5 buckets) |

All routes (except healthz) require a valid Clerk session. Returns 401 if unauthenticated.

### New Endpoints (Feature 1–8 additions)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/resume` | Get current resume metadata |
| POST | `/api/resume/upload` | Upload PDF or DOCX resume (multipart/form-data, field name `resume`) |
| DELETE | `/api/resume` | Delete active resume |
| POST | `/api/resume/extract-keywords` | Trigger AI keyword extraction from resume text (requires OPENAI_API_KEY) |
| GET | `/api/keywords` | List all user keywords |
| POST | `/api/keywords` | Add a keyword manually |
| PATCH | `/api/keywords/:id` | Edit a keyword |
| DELETE | `/api/keywords/:id` | Delete a keyword |
| GET | `/api/jobs/:id/cover-letter` | Get saved cover letter for a job |
| POST | `/api/jobs/:id/cover-letter` | Generate (or regenerate) cover letter via AI |
| PATCH | `/api/jobs/:id/cover-letter` | Save edited cover letter |
| GET | `/api/jobs/:id/recruiter-message` | Get saved recruiter message |
| POST | `/api/jobs/:id/recruiter-message` | Generate recruiter message via AI |
| GET | `/api/jobs/:id/apply-guidance` | Get saved apply guidance |
| POST | `/api/jobs/:id/apply-guidance` | Generate apply guidance via AI |
| GET | `/api/subscription` | Get plan, profile version, and usage counters |

---

## 8. Authentication

- **Provider:** Clerk (managed via Replit Auth pane)
- **Frontend:** `@clerk/react` — `ClerkProvider`, `SignIn`/`SignUp` pages, `ProtectedRoute` wrapper
- **Backend:** `@clerk/express` — `clerkMiddleware()` + per-route `getAuth(req).userId`
- **Methods:** Email/password + Google OAuth
- **Production proxy:** `/api/__clerk` → `frontend-api.clerk.dev` via `clerkProxyMiddleware`
- **Mobile support:** `custom-fetch.ts` has `setAuthTokenGetter` for bearer token (Expo)
- **Cache:** React Query cache cleared on Clerk user change
- **App name issue:** Clerk dashboard still shows "Attached Assets" — should be updated to "QAHire"

---

## 9. Environment Variables

| Variable | Required? | Used by |
|----------|-----------|---------|
| `DATABASE_URL` | Required | Drizzle DB connection |
| `PORT` | Required | API server port (8080) |
| `CLERK_SECRET_KEY` | Required | Clerk proxy + API auth |
| `CLERK_PUBLISHABLE_KEY` | Required | API Clerk middleware |
| `VITE_CLERK_PUBLISHABLE_KEY` | Required | Frontend Clerk |
| `VITE_CLERK_PROXY_URL` | Required | Frontend Clerk proxy |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram test messages (503 if missing) |
| `NODE_ENV` | Optional | Activates Clerk proxy in production |
| `OPENAI_API_KEY` | Optional* | Required for AI features: keyword extraction, cover letter, recruiter message, apply guidance. Returns 503 if missing. |
| `UPLOAD_DIR` | Optional | Directory for resume file uploads (default: `/tmp/qahire-uploads`) |

---

## 10. Frontend Pages & Routing

Router: Wouter (not React Router).

| Route | Page | Notes |
|-------|------|-------|
| `/` | Home (landing) | Marketing hero, sign-in/sign-up CTAs |
| `/dashboard` | Dashboard | Counts, avg score, charts — protected |
| `/jobs` | Jobs list | Filters, job cards, status actions — protected |
| `/jobs/:id` | Job detail | Full detail: AI analysis, cover letter, recruiter message, apply guidance — protected |
| `/profile` | Profile form | Skills, resume upload, keywords editor, usage display — protected |
| `/telegram` | Telegram setup | Connect/disconnect/test — protected |
| `/settings` | Settings + Billing | Account info, subscription plan, usage meters, upgrade CTA — protected |
| `*` | Not found | 404 page |

---

## 11. External Integrations

| Service | Status | Notes |
|---------|--------|-------|
| **Clerk** | ✅ Integrated | Email + Google OAuth |
| **PostgreSQL 16** | ✅ Integrated | Replit-managed |
| **Telegram Bot API** | ⚠️ Partial | Connect/test only; `TELEGRAM_BOT_TOKEN` not set; no daily automation |
| **LinkedIn** | ❌ Not integrated | Job source (planned) |
| **Naukri** | ❌ Not integrated | Job source (planned) |
| **Indeed** | ❌ Not integrated | Job source (planned) |
| **Hirist** | ❌ Not integrated | Job source (planned) |
| **Wellfound** | ❌ Not integrated | Job source (planned) |
| **OpenAI** | ✅ Integrated | Keyword extraction, cover letter, recruiter message, apply guidance (requires `OPENAI_API_KEY`) |
| **Stripe** | ❌ Not integrated | Billing (mentioned in workspace config only) |

---

## 12. Deployment & Dev Commands

### Replit setup
- Modules: `nodejs-24`, `postgresql-16`
- Target: `autoscale`
- API artifact: kind=`api`, paths `/api`, port 8080
- Frontend artifact: kind=`web`, static SPA from `artifacts/qa-hire/dist/public`, port 23258, `/*` → `/index.html` rewrite

### Common commands

```bash
# Development
pnpm --filter @workspace/api-server run dev      # API server on :8080
pnpm --filter @workspace/qa-hire run dev          # Frontend on :23258

# Build
pnpm run build                                    # Typecheck + build all
pnpm run typecheck                                # Full workspace typecheck

# API codegen (run after editing openapi.yaml)
pnpm --filter @workspace/api-spec run codegen

# Database
pnpm --filter @workspace/db run push              # Push schema to DB
pnpm --filter @workspace/db run generate          # Generate Drizzle migration files
```

---

## 13. Implemented Features

1. **Landing page** — Marketing hero, sign-up/sign-in CTAs, responsive layout
2. **Authentication** — Clerk email + Google OAuth, protected routes, session management
3. **Job preference profile** — Skills, years of experience, preferred locations, notice period, job types (full-time/remote/hybrid/contract), include/exclude keywords, salary range (min/max)
4. **Jobs list** — Filter by status, min match score, source, location; paginated API response; job cards with match score badge, AI insight snippet, skills badges
5. **Job status actions** — Mark as Interested / Applied / Not Relevant directly from card
6. **External apply link** — Open job URL in new tab from card
7. **Dashboard analytics** — Total jobs, new jobs, interested count, applied count, avg match score, score distribution bar chart, source breakdown pie chart, recent top 5 jobs
8. **Telegram integration** — Enter chat ID to connect, disconnect, send test message via Bot API
9. **Feedback API** — `POST /api/feedback` accepts rating + comment (no UI surface yet)
10. **Settings page shell** — Account info display, notification prefs link, deactivate/delete placeholders (no backend)
11. **Health check** — `GET /api/healthz`

---

## 14. Pending Features (Roadmap)

These come from the two product spec documents in `attached_assets/`.

### Phase 1 — Core Automation (from original blueprint)

- [ ] **Job scraping / ingestion** — Search LinkedIn, Naukri, Indeed, Hirist, Wellfound, company career pages for QA roles matching user profile
- [ ] **Daily cron scheduler** — Run every morning per-user
- [ ] **AI matching & scoring** — Score 0-100, generate `matchReason`, rank by relevance
- [ ] **Deduplication** — Via `external_id`; avoid sending same job twice
- [ ] **Daily Telegram briefing** — Send top-N matches each morning automatically
- [ ] **Feedback learning loop** — Use Interested/Applied/Not Relevant signals to improve future matches
- [ ] **Admin dashboard** — Job counts, user counts, source stats

### Phase 2 — Enhancement Spec (12 features from second spec doc)

- [ ] **1. Resume Upload** — PDF/DOCX, text extraction, secure storage, status tracking (processing/ready/failed), replace/delete
- [ ] **2. Auto Keyword Extraction** — AI extracts: role, QA skills, tools (Selenium, Appium, etc.), languages, frameworks, certifications; auto-fills profile fields; tracks keyword source (`resume_generated | user_added | user_edited | system_suggested`)
- [ ] **3. Resume-Based Job Matching** — Enhanced match score using resume + keywords; show matched skills vs missing skills; explain why job is/isn't relevant; use exclusion keywords; incorporate historical feedback
- [ ] **4. Cover Letter Generator** — Per-job personalized letters from resume + profile + job description; editable in UI; saved in DB; copy-to-clipboard + PDF/DOCX download
- [ ] **5. Easy Apply Guidance** — Per-job: apply method (Easy Apply / portal / email), action steps, which resume/cover letter to use; no scraping private emails; LinkedIn-safe
- [ ] **6. LinkedIn Recruiter Message** — Personalized <700 char message per job; copy-only (no auto-send)
- [ ] **7. Monetization / Usage Limits** — Free vs paid tiers; enforce: profile edits/month, job matches/day, cover letters/day, etc.
- [ ] **8. Profile Versioning** — Snapshot profile on every criteria change; link job matches to profile version at time of match
- [ ] **9. New DB tables** — `resumes`, `keywords`, `profile_versions`, `cover_letters`, `recruiter_messages`, `apply_guidance`, subscription/quota fields
- [ ] **10. UI updates** — Profile page (resume section, keywords), job card (matched/missing skills), job detail page, settings/billing page
- [ ] **11. AI prompts** — Reusable, versioned prompts for: keyword extraction, job matching, cover letter, recruiter message, apply guidance
- [ ] **12. Test suite** — At least basic integration/unit tests

---

## 15. Known Issues & TODOs

| Issue | Location | Priority |
|-------|----------|----------|
| `TELEGRAM_BOT_TOKEN` not set → `/api/telegram/test` returns 503 | Replit env vars | Medium |
| Clerk app name shows "Attached Assets" not "QAHire" | Clerk dashboard | Low |
| Deactivate Profile / Delete Account buttons are UI-only | `artifacts/qa-hire/src/pages/settings.tsx` | Medium |
| Feedback API exists but has no UI surface | jobs page | Medium |
| `users` DB table defined but not synced with Clerk | `lib/db/src/schema/users.ts` | Low |
| No job detail page (`/jobs/:id`) | Frontend | High |
| API artifact preview path TODO | `artifacts/api-server/.replit-artifact/artifact.toml` | Low |

---

## 16. Monetization Model

Planned subscription tiers (not yet implemented):

| Feature | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Profile edits/month | Limited | Unlimited |
| Job matches/day | Limited | Unlimited |
| Cover letters/day | Limited | Unlimited |
| Resume uploads | 1 | Multiple versions |
| Telegram briefings | Daily | Daily + on-demand |

Implementation requires: Stripe integration, `subscription_plan` field on profiles, quota counters, and middleware to enforce limits before expensive AI calls.

---

## 17. Source Documents

| Document | Path | Summary |
|----------|------|---------|
| Original product blueprint | `attached_assets/Pasted-Act-as-a-senior-product-architect-and-full-stack-AI-Saa_1781581893657.txt` | Full SaaS design spec — concept, MVP features, DB schema, matching logic, Telegram flow, architecture, monetization |
| Enhancement spec (12 features) | `attached_assets/Pasted-You-are-a-senior-full-stack-SaaS-engineer-working-on-an_1781592280038.txt` | Incremental feature additions for the existing Replit app — resume, AI tools, billing, versioning |
| Replit operational docs | `replit.md` | Run commands, env vars, gotchas, deployment notes |
| OpenAPI contract | `lib/api-spec/openapi.yaml` | All endpoint schemas — source of truth |
| DB schema files | `lib/db/src/schema/` | Drizzle table definitions |

---

---

## New Backend Files Added (Features 1–8)

| File | Purpose |
|------|---------|
| `artifacts/api-server/src/routes/resume.ts` | Resume upload, text extraction, delete |
| `artifacts/api-server/src/routes/keywords.ts` | CRUD for extracted/user keywords |
| `artifacts/api-server/src/routes/ai-features.ts` | Cover letter, recruiter message, apply guidance generation |
| `artifacts/api-server/src/routes/subscription.ts` | Usage counters + plan info |
| `artifacts/api-server/src/lib/prompts.ts` | Reusable AI prompt templates |
| `artifacts/api-server/src/lib/openai.ts` | OpenAI client wrapper + `chatComplete()` helper |
| `artifacts/api-server/src/lib/quota.ts` | Quota check + increment helpers |

## New Frontend Files Added

| File | Purpose |
|------|---------|
| `artifacts/qa-hire/src/pages/job-detail.tsx` | Full job detail page with tabs: Overview, Cover Letter, Message, Apply Guide |

## Key Implementation Notes

- **Profile versioning** triggers when matching fields change: `skills`, `yearsOfExperience`, `preferredLocations`, `jobTypes`, `includeKeywords`, `excludeKeywords`, `expectedSalaryMin`, `expectedSalaryMax`. Non-matching fields like `noticePeriod` do NOT trigger a version bump.
- **Keyword preservation**: `POST /api/resume/extract-keywords` only replaces `resume_generated` keywords, never `user_added` or `user_edited` ones.
- **Quota resets**: Daily quotas (`dailyJobMatchCount`, `dailyCoverLetterCount`) reset when `quotaResetDate` is not today. Monthly quota currently increments but does not auto-reset on the 1st (future work).
- **AI errors graceful**: All AI endpoints return `503` with a clear message when `OPENAI_API_KEY` is missing, not a 500.
- **File uploads**: `multer` stores files to `UPLOAD_DIR` (default `/tmp/qahire-uploads`). Text extraction is async — resume status shows `processing` immediately, then updates to `ready` or `failed`.
- **Cover letter editing**: User can edit the generated text in-browser; the edited version is saved back via `PATCH /api/jobs/:id/cover-letter`.
- **Recruiter messages**: No auto-send. Copy-only. A UI warning explicitly tells users to send manually.
- **api-zod + api-client-react**: New types and hooks were appended manually to the generated files (no Orval re-codegen needed). New types are in `api.schemas.ts`; hooks are at the bottom of `api.ts`.

*Last updated: Jun 17, 2026 — Features 1–12 implemented.*
