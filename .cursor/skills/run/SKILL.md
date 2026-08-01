---
name: run
description: >
  Drive the MedlineWebApp UI in a real browser via Playwright MCP tools
  (navigate, snapshot, click, screenshot, console). Use when the user asks to
  screenshot, visually verify, or interactively test a page or Storybook story.
---

# Run — AI browser automation (MedlineWebApp)

Dev-time only. Not CI. No golden screenshot baselines.

Use Playwright MCP `browser_*` tools. There is no custom driver.

## Servers

| Target | Command | URL |
| --- | --- | --- |
| App (TanStack Start) | `pnpm dev` | http://localhost:3000 |
| Storybook | `pnpm storybook` | http://localhost:6006 |

Screenshots write to `.cursor/skills/run/screenshots/` (gitignored; matches MCP `--output-dir`).

## Start / stop servers

1. Check terminals / `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` (or `:6006`).
2. If not up, start in the background (`block_until_ms: 0`), then poll with `curl` until HTTP 200 (or the app responds).
3. Kill the old process before relaunching the same port.
4. App needs `.env` with `VITE_SUPABASE_URL` + `VITE_SUPABASE_KEY` (publishable). Without them the server throws on boot.

## Drive the browser

1. `browser_navigate` → URL
2. `browser_wait_for` / `browser_snapshot` → decide next action
3. Interact (`browser_click`, `browser_type`, …) as needed
4. `browser_take_screenshot` when the user needs a visual
5. `browser_console_messages` for client errors
6. `browser_close` when finished

Prefer **snapshot** for decisions; **screenshot** for human/chart review.

### Storybook

Open the story iframe directly:

`http://localhost:6006/iframe.html?id=<story-id>&viewMode=story`

Example: `http://localhost:6006/iframe.html?id=ui-button--default&viewMode=story`

If the iframe looks stale after a code change, navigate again (full reload).

## Project gotchas

- **Auth**: Most routes live under `/_authenticated` and redirect to `/login` when signed out. For authenticated UI, sign in with a real test user or work on `/login`, `/signup`, `/reset-password`.
- **Signup**: Cloudflare Turnstile may block automated signup; prefer login or Storybook for form chrome.
- **Health data**: Never dump PHI into chat or commit screenshots that include real medical content.
- **Secrets**: Never put `SUPABASE_SECRET_KEY` or service accounts into MCP env.

## Scope

- Interactive agent checks while developing
- Not a substitute for `pnpm test` / `pnpm test:e2e`
- Do not add visual regression baselines to the repo
