# MedlineWebApp

A secure web app for organizing personal medical history as **timelines** of events
(appointments, tests, surgeries, and more) with attached documents. It is the web successor to
the **MedlineMobile** app, migrated from Firebase to **Supabase**.

Built with **TanStack Start**, **Supabase**, **shadcn/ui** (Tailwind v4), **TypeScript**, tested
with **Vitest**, and documented in **Storybook**.

> Full architecture, migration plan, data model, security model, and setup details live in
> **[docs.md](./docs.md)**.

## Features

- Email/password auth with secure cookie sessions and password reset
- Timelines ("lines") with color coding
- Chronological events with typed categories and rich detail pages
- Private document upload / download / delete via signed URLs
- Cross-entity search
- Light/dark theme, responsive layout, accessible components

## Quick start

```bash
pnpm install
cp .env.example .env        # VITE_SUPABASE_URL + VITE_SUPABASE_KEY (publishable)
pnpm dev                    # http://localhost:3000
```

Set up the database (against your Supabase project):

```bash
pnpm db:push                # apply migrations (tables, RLS, storage bucket)
pnpm db:types               # regenerate typed schema
```

## Deploy (Vercel + GitHub)

Nitro is configured for Vercel (`vercel.json` sets `outputDirectory: .vercel/output`). Full
checklist: **[docs.md § Deploy](./docs.md#11-deploy-to-vercel-github)**.

**Note:** Vercel's UI may default Output Directory to `dist` — that's for static apps. This
project overrides it via `vercel.json`; keep Framework preset on **TanStack Start**.

**Apply database migrations to production** (from your machine, before or after first Vercel deploy):

```bash
supabase login
supabase link --project-ref <your-project-ref>   # from Supabase dashboard URL
pnpm db:push                                     # applies supabase/migrations/*.sql
```

Then connect the GitHub repo in Vercel and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_KEY` in
project environment variables. Update Supabase Auth redirect URLs for your `*.vercel.app` domain.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` / `pnpm lint:fix` | Biome lint (and autofix) |
| `pnpm test` / `pnpm test:watch` | Vitest |
| `pnpm storybook` / `pnpm build-storybook` | Component workshop / static build |
| `pnpm db:push` / `pnpm db:types` / `pnpm db:reset` | Supabase schema management |

## Project structure

See **[docs.md](./docs.md)** for the layered architecture (Routes → Query hooks → Server
functions → Repositories → Supabase), folder conventions, and the security model.

## Security

This app handles sensitive health data. It enforces auth + zod validation in every server
function, Postgres Row Level Security, private document storage with signed URLs, security
headers/CSP, rate-limited auth, and CI dependency/secret scanning. Details in
**[docs.md](./docs.md#6-security-sensitive-data)**.

## Contributing

Agent and contributor conventions are encoded in [`.cursor/rules`](./.cursor/rules). Run
`pnpm typecheck && pnpm lint && pnpm test && pnpm build-storybook` before pushing.
