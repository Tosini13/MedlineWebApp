# Pull Request Testing Guide

Use this guide when opening or reviewing PRs for MedlineWebApp. The app stores sensitive health
data — combine automated checks, targeted unit tests, manual smoke tests, and AI-assisted review.

---

## Quick verification (every PR)

```bash
pnpm lint && pnpm typecheck && pnpm test
```

For UI changes, also run `pnpm build-storybook` when components or stories changed.

---

## What to unit-test (by feature area)

Prefer **pure logic** tests (schemas, mappers, formatters, small helpers). Mock repositories; never
hit real Supabase in Vitest.

### Auth (`src/features/auth/`)

| Target | Why |
|---|---|
| `auth.schema.ts` | Email normalization, password length bounds, required fields |
| `auth-errors.ts` → `isEmailNotConfirmedError` | Branch on Supabase `email_not_confirmed` without leaking other errors |
| `generate-password.ts` | Length clamping (8–128), character-class coverage |
| `src/lib/auth/approval.ts` → `isUserPendingApproval` | Admin-gated sign-in when `app_metadata.approved === false` |
| `src/lib/server/recaptcha.ts` | Parse siteverify responses; mock `fetch` for network failures |

**Skip:** form layout, toast copy, cursor styles, rate-limit timing (integration concern).

### Profiles (`src/features/profile/`)

| Target | Why |
|---|---|
| `profile.schema.ts` | DOB format (`YYYY-MM-DD`), blood type enum, optional fields, max lengths |
| `upsertProfileSchema` transforms | Empty strings → `null` before DB write |

**Skip:** avatar upload UI, lock-screen PWA display (manual / E2E).

### Documents (`src/features/documents/`)

| Target | Why |
|---|---|
| `isAllowedMimeType` | Block executables and unexpected types |
| `sanitizeFileName` | Path traversal, unsafe characters |
| Upload size constants | Assert limits match server enforcement |

**Skip:** signed URL expiry (needs Supabase), multipart upload wiring.

### Lines & events (`src/features/lines/`, `src/features/events/`)

| Target | Why |
|---|---|
| `lines.schema.ts` | Hex color regex, title trim, description null transform |
| `events.schema.ts` | Event type enum, ISO date parsing, description null transform |
| `migration.transform.ts` | Firebase → Supabase normalization (already covered) |

### Search & migration

| Target | Why |
|---|---|
| Query sanitization / result shaping | If added as pure functions |
| `migration.transform.ts` | Color, date, event-type coercion |

### PWA (when present)

| Target | Why |
|---|---|
| Manifest / icon paths | Static asset references |
| Offline shell logic | Pure helpers for cache keys or route allowlists |

**Skip:** service worker install prompts, push notifications (browser-only).

### Admin approval (when present)

| Target | Why |
|---|---|
| `isUserPendingApproval` | Legacy users without `approved` key stay approved |
| Approval server functions | Validate zod input; mock admin client |

**Skip:** email notification delivery (manual with real SMTP).

---

## Manual test checklists

### Auth

- [ ] Sign up with valid email/password → confirmation or immediate login per project settings
- [ ] Sign in with wrong password → generic “Invalid email or password” (no user enumeration)
- [ ] Sign in with unverified email → verify-specific message (when email confirmation enabled)
- [ ] Sign in with pending approval → approval message; approved user can sign in
- [ ] Password reset request → same success message for known and unknown emails
- [ ] Reset link → `/update-password` → new password works
- [ ] Sign out → protected routes redirect to `/login`
- [ ] Rate limit: repeated failed logins eventually blocked (dev: check network tab)

### Profiles

- [ ] Account / profile page loads for authenticated user
- [ ] Save valid DOB and blood type → persists after reload
- [ ] Invalid DOB or blood type → inline validation errors
- [ ] Clear optional fields → stored as empty/null, not stale data
- [ ] Lock screen summary (PWA) shows saved summary when enabled

### Lines & events

- [ ] Create, edit, delete a line
- [ ] Create event with each event type; timeline order correct
- [ ] Edit/delete event; empty description handled
- [ ] Unauthenticated access to `/_authenticated/*` redirects

### Documents

- [ ] Upload PDF/image under size limit on an event
- [ ] Reject disallowed MIME type (if UI exposes error)
- [ ] Download via signed URL; URL not publicly guessable
- [ ] Delete document removes list entry

### Search

- [ ] Search finds lines, events, documents by title/name
- [ ] Empty query and no-results states render correctly

### PWA

- [ ] Install prompt / add-to-home-screen (supported browsers)
- [ ] Offline: app shell loads; authenticated data shows appropriate empty/error state
- [ ] Manifest icons and theme color correct

### Admin approval

- [ ] New signup sets `approved: false` (when feature enabled)
- [ ] Pending user cannot access authenticated routes
- [ ] Admin approves user → user can sign in
- [ ] Legacy user without `approved` metadata still signs in

### Firebase migration (Account page)

- [ ] With `FIREBASE_SERVICE_ACCOUNT` configured: summary loads
- [ ] Without credentials: section hidden or graceful message

---

## Using AI to verify changes

AI review complements — but does not replace — running tests and manual checks.

### 1. Security diff review

Prompt Cursor (or paste the PR diff) with context from `.cursor/rules/security.mdc`:

```
Review this diff for a medical-records app. Flag:
- Server functions missing requireUser() or zod .validator()
- Client imports of SUPABASE_SECRET_KEY or server-only modules
- Public document URLs instead of signed URLs
- New tables without RLS policies in supabase/migrations/
- Auth responses that reveal whether an email exists
- CSP connect-src missing new external origins
```

Ask for **file:line** references and suggested fixes.

### 2. Edge-case tests from schemas

Paste a `*.schema.ts` file and ask:

```
List 10 edge-case inputs for this zod schema (empty, boundary lengths, invalid enums,
unicode, null vs undefined). For each, say whether parse() should pass or throw and why.
Then draft vitest cases in the repo's describe/it style.
```

Implement the high-value cases; skip trivial duplicates.

### 3. UX flow sanity check

Point AI at route files (`src/routes/**`) and feature components:

```
Trace the happy path and two failure paths for [feature]. List loading, error, and empty
states. Note any step that skips auth or validates only on the client.
```

Use output as a manual checklist; verify critical paths yourself.

### 4. Limitations (AI cannot replace)

| Gap | Why |
|---|---|
| Postgres migrations | AI won't apply SQL to your Supabase project — run `pnpm db:push` locally |
| RLS behavior | Needs real Supabase with two test users |
| reCAPTCHA in production | Requires live keys and Google siteverify |
| Email delivery | Confirmation/reset emails need Supabase Auth + SMTP |
| Vercel body limits | Upload > ~4.5 MB may fail on serverless regardless of app limit |
| PWA install / offline | Requires real browser and HTTPS (or localhost) |

### 5. Suggested Cursor / CI workflow

1. **Local:** `pnpm test && pnpm typecheck && pnpm lint`
2. **If failures:** paste failing test output + relevant source into AI; fix and re-run
3. **Before merge:** AI security pass on full PR diff (see §1)
4. **Schema changes:** AI-generated edge cases → add tests → `pnpm test`
5. **CI:** GitHub Actions should mirror local commands; do not merge on red CI
6. **Deploy preview:** run the manual checklist for the touched feature areas

---

## Test file conventions

- Location: `src/**/*.test.ts` next to the module under test
- Runner: Vitest + jsdom (`src/test/setup.ts`)
- Style: `describe` / `it`, assert behavior not implementation details
- Prefer `schema.parse()` / pure function calls over rendering unless testing UI logic

Existing examples:

- `src/features/lines/lines.schema.test.ts`
- `src/features/documents/documents.schema.test.ts`
- `src/features/auth/auth.schema.test.ts`
- `src/features/profile/profile.schema.test.ts`
