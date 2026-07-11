# MedlineWebApp — Project Documentation & Plan

MedlineWebApp is a web reimplementation of the **MedlineMobile** React Native/Expo app. It lets
people organize personal medical history as **timelines** ("lines"), each holding chronological
**events** (appointments, tests, surgeries, occurrences, other) with attached **documents**.

This document is the single source of truth for the plan, architecture, and conventions.

---

## 1. Goals

- Full **feature parity** with MedlineMobile (lines, events, documents, auth, search).
- **Migrate the backend from Firebase to Supabase** (Postgres, Auth, Storage).
- **Modern, professional UI** using shadcn/ui on Tailwind v4 — a clear step up from the mobile app.
- **Security-first**, because the app manages sensitive health data.
- **Functional-first** code, with OOP reserved for the data provider only.
- Documented, reusable components showcased in **Storybook**.

---

## 2. Technology Choices

| Concern | Choice | Why |
|---|---|---|
| Framework | TanStack Start (React 19, SSR) | File-based routing, server functions, first-class Query integration |
| Data / Auth / Files | Supabase | Postgres + RLS, email/password auth, private storage |
| UI | shadcn/ui + Tailwind CSS v4 + Radix | Accessible, composable, themeable design system |
| Forms | react-hook-form + zod | Type-safe validation shared client/server |
| State/data fetching | TanStack Query | Caching, invalidation, optimistic flows |
| Tooling | Biome, Vitest, Storybook | Fast lint/format, unit tests, component docs |
| Language | TypeScript (strict) | Safety across the stack |

---

## 3. Firebase → Supabase Migration Map

| MedlineMobile (Firebase) | MedlineWebApp (Supabase) |
|---|---|
| Firebase Auth | Supabase Auth (email/password, cookie sessions via `@supabase/ssr`) |
| Firestore `lines` | Postgres `lines` table (RLS owner-scoped) |
| Firestore `events` | Postgres `events` table (FK → `lines`) |
| Firestore document refs | Postgres `documents` table (FK → `events`) + Storage objects |
| Firebase Storage | Supabase Storage private `documents` bucket + signed URLs |
| Client SDK calls in `services/*` | Repositories + `createServerFn` server functions |
| `EXPO_PUBLIC_*` env | `VITE_*` env (+ server-only `SUPABASE_SECRET_KEY`) |

Event type codes (`MA`, `O`, `MT`, `S`, `other`) are preserved for data compatibility.

---

## 4. Architecture

Strict layering (never skip a layer):

```
Routes / Components  →  Query hooks (*.queries.ts)  →  Server functions (*.api.ts)  →  Repositories  →  Supabase
     (presentational)        (React Query)              (auth + zod validation)      (OOP data provider)
```

- **Functional-first**: components, hooks, server functions, utilities are functions.
- **OOP only** in `src/lib/supabase/` (`SupabaseProvider`, `*Repository`).
- **Server function files must be `*.api.ts`** (client-importable via RPC). The `*.server.ts`
  suffix is reserved for hard server-only modules and is blocked from the client bundle.

### Key directories

```
src/
  components/ui/        shadcn primitives
  components/app/       composed app widgets (shell, header, brand, theme, ...)
  features/<f>/         schema.ts, api.ts, queries.ts, components/  (auth, lines, events, documents, search)
  lib/domain/           domain types + event-type metadata
  lib/supabase/         SupabaseProvider, server client, repositories  (the only Supabase access)
  lib/server/           server-only helpers: context (requireUser), rate-limit, security-headers
  routes/               file-based routes (_authenticated guard, auth routes)
  start.ts              global Start instance → registers security-headers middleware
supabase/migrations/    SQL schema + storage policies (source of truth)
.storybook/             Storybook config (own Vite config, a11y addon)
.cursor/rules/          agent guidance
```

---

## 5. Data Model

- `lines(id, user_id, title, description, color, created_at, updated_at)`
- `events(id, line_id, title, description, type event_type, occurred_at, created_at, updated_at)`
- `documents(id, event_id, name, storage_path, mime_type, size_bytes, created_at)`
- `audit_log(...)` — append-only change tracking via `security definer` triggers.

All tables have **RLS enabled and forced**, owner-scoped through `lines.user_id`. Storage objects
are stored as `{user_id}/{event_id}/{file}` in a private bucket with matching policies.

---

## 6. Security (sensitive data)

- Auth enforced in every data server function via `requireUser()`.
- zod validation on all server-function inputs.
- RLS + forced row security on all tables; private Storage bucket with signed-URL access only.
- Upload constraints: allowed MIME types + max size.
- Centralized **security headers + CSP** (`src/lib/server/security-headers.ts`, wired in `src/start.ts`).
- **Rate limiting** on auth endpoints; generic auth responses (no user enumeration).
- Secret hygiene: only `VITE_*` reach the client; `.env` gitignored; `.env.example` committed.
- **CI** runs typecheck, lint, tests, build, Storybook build, `pnpm audit`, and gitleaks secret scan.

---

## 7. Design System

- Tailwind v4 tokens in `src/styles/app.css`: semantic colors in `oklch`, light/dark themes,
  per-event-type accent colors, Inter (body) + Lexend (display) typography.
- Reusable states: `EmptyState`, skeletons, page headers, confirm dialogs.
- Polished **timeline** visualization, responsive `AppShell` (sidebar + mobile sheet), motion via
  `tw-animate-css`, theme toggle (light/dark/system).

---

## 8. Testing & Storybook

- **Vitest** + Testing Library (jsdom) for units; mock repositories, never hit real Supabase.
- **Storybook** documents reusable components (`*.stories.tsx`), a11y addon enabled, its own Vite
  config (no TanStack Start plugin). Build with `pnpm build-storybook`.

---

## 9. Local Development

```bash
pnpm install
cp .env.example .env      # fill in Supabase values
pnpm dev                  # app on http://localhost:3000
pnpm storybook            # Storybook on http://localhost:6006
pnpm typecheck && pnpm lint && pnpm test
```

Supabase schema:

```bash
pnpm db:push              # apply migrations to your project
pnpm db:types             # regenerate database.types.ts
```

---

## 10. What You Need to Prepare (in parallel)

1. **Create a Supabase project** (cloud) and grab: Project URL, **publishable key**
   (`sb_publishable_...`), and **secret key** (`sb_secret_...`) from
   **Settings → API → API Keys**.
2. Populate `.env` from `.env.example`:
   - `VITE_SUPABASE_URL` — project URL
   - `VITE_SUPABASE_KEY` — publishable key (client-safe)
   - `SUPABASE_SECRET_KEY` — secret key (server/scripts only)
3. In Supabase Auth settings: enable **email/password**, set **Site URL** and redirect URLs
   (`http://localhost:3000` for dev), and configure email templates for password reset.
4. Apply the migrations (`pnpm db:push`) so tables, RLS policies, and the `documents` bucket exist.
5. For CI: no extra secrets required for gitleaks (uses the default `GITHUB_TOKEN`).

### Why this differs from Supabase's generic Vite prompt

Supabase's dashboard onboarding suggests a bare `createClient` in `src/utils/supabase.ts` and
querying tables directly from route loaders. **MedlineWebApp intentionally does not follow that
pattern** because it is an SSR app handling sensitive health data:

| Supabase prompt | MedlineWebApp (correct for this app) |
|---|---|
| `VITE_SUPABASE_KEY` + `createClient` | Same env var name; uses `@supabase/ssr` instead |
| Direct `supabase.from(...)` in loaders | Server functions (`*.api.ts`) + repositories |
| Browser session in localStorage | HttpOnly cookie sessions via `SupabaseProvider.server()` |
| No RLS enforcement layer | `requireUser()` on every server function + Postgres RLS |

The publishable key and project URL are the same; only the client wiring differs.

---

## 11. Status & Roadmap

Implemented: scaffold, Supabase schema + storage + RLS, data provider + repositories, auth flows,
lines & events CRUD with timeline UI, documents (upload/list/download/delete), cross-entity search,
security hardening (headers/CSP, rate limiting, audit log, CI scanning), Storybook, `.cursor` rules.

Possible next steps: sharing/collaboration, reminders/notifications, richer document previews,
data export, and end-to-end tests (Playwright).
