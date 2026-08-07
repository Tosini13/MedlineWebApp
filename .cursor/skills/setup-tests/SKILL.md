---
name: setup-tests
description: >
  Implements Vitest unit/component tests, Playwright e2e + CI, and Playwright
  MCP AI browser automation in a frontend repo. Use when the user asks to set
  up tests, add Vitest/RTL/Playwright, wire CI test jobs, or add Cursor/Claude
  browser automation MCP + run skill.
---

# Setup tests + AI browser automation

Adapt ports, aliases, providers, and CI to the target repo. Do not invent
extra tooling.

If `docs/testing-setup-playbook.md` exists in the workspace, read it first and
follow it. Otherwise follow the steps below. When reusing in another app, the
playbook may be attached via `@` or copied in — prefer that over guessing.

## Compatibility gate (mandatory)

Before installing packages or writing configs, inspect `package.json`, lockfile,
existing `*test*` / `jest` / `vitest` / `playwright` / `cypress` config, and CI.

This skill’s defaults assume: **React + Vite + Vitest + Testing Library +
Playwright + npm + GitHub Actions CI + Playwright MCP**.

If the target differs (Next.js, Jest, Cypress, pnpm/yarn, Vue/Svelte, etc.):

1. **Stop and ask the user** whether to keep this stack or use more accurate
   tools for their framework while preserving the same layers (unit → component
   → e2e smoke → CI → optional AI browser MCP).
2. Only proceed after they confirm.
3. Never force Vite `loadEnv`, `npm run dev` webServer, or CI-host-specific jobs
   onto a mismatched app without adapting.

## Rollout order (do in order)

1. Vitest + one pure unit test → prove `npm test`
2. jsdom / RTL + `renderWithProviders` + 2–3 component tests
3. Playwright config + 1–2 smoke e2e specs
4. CI jobs (unit `--changed` + e2e)
5. MCP + `.cursor/skills/run` skill (dev-time only, not CI)

## 1. Deps and scripts

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
npx playwright install chromium
```

Scripts: `test` → `vitest run`, `test:watch` → `vitest`, `test:changed` → `vitest run --changed`, `test:e2e` → `playwright test`.

Pin `@playwright/test` and the CI Playwright image to the same version.

## 2. Vitest

`vitest.config.ts` with two projects (mirror app Vite aliases):

| Project | Env | Include | Setup |
| --- | --- | --- | --- |
| `unit` | `node` | `src/**/*.test.ts` | — |
| `component` | `jsdom` | `src/**/*.test.tsx` | `src/test/setup.ts` |

`src/test/setup.ts`: import `@testing-library/jest-dom/vitest`, `cleanup` in `afterEach`.

`src/test/render.tsx`: `renderWithProviders` wrapping router + query client + mocked app contexts. No real network.

First tests: pure utils, then a few lib/input components. Prefer `getByRole` / `getByLabelText`.

## 3. Playwright e2e

`playwright.config.ts`:

- `testDir: './e2e'`, Chromium only
- `baseURL` from env/dev port
- `webServer: { command: 'npm run dev', url: baseURL, reuseExistingServer: !CI }`
- CI: retries 2, 1 worker, HTML reporter

Specs: navigate → assert key text/URL → optional console-error collector. Thin smokes only.

`.gitignore`: `/test-results/`, `/playwright-report/`, `/playwright/.cache/`.

## 4. CI

**Unit (PR):** Node matching engines; cache package store on lockfile; `fetch-depth: 0`; install deps then `test:changed` against the PR base branch. Trigger on `src/**`, lockfile, `vitest.config.ts`.

**E2E (PR):** `mcr.microsoft.com/playwright:vX.Y.Z-noble` matching package version; `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` on install; install deps + `test:e2e`; artifact `playwright-report/` on failure. Path-filter to `src/**`, `e2e/**`, lockfile, `playwright.config.ts` (plus an always-green gate job if the check is required).

## 5. AI browser automation (not CI)

### MCP

`.mcp.json` and/or Cursor MCP (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@playwright/mcp@0.0.78",
        "--viewport-size=1440,900",
        "--output-dir=.cursor/skills/run/screenshots"
      ],
      "env": {}
    }
  }
}
```

Ask user to restart/reconnect MCP after adding. No custom driver — use `browser_*` tools from `@playwright/mcp`.

### `run` skill

Create `.cursor/skills/run/SKILL.md` (optional Claude copy: `.claude/skills/run/SKILL.md`) that covers:

1. When to start Storybook vs `npm run dev` (ports, background start, poll with `curl`, kill before relaunch)
2. Drive: `browser_navigate` → `browser_wait_for` / `browser_snapshot` → screenshot → `browser_console_messages` → `browser_close`
3. Prefer snapshot for decisions; screenshot for human/chart review
4. Storybook: `http://localhost:PORT/iframe.html?id=<story-id>&viewMode=story`
5. Project gotchas (auth bypass, Storybook iframe reload)
6. Scope: dev-time only, no golden baselines, not in CI

Ignore `screenshots/` under the skill dir. Add short `docs/browser-automation.md` + README link.

## Done when

- [ ] `npm test` and `npm run test:e2e` pass locally
- [ ] CI jobs added/adapted
- [ ] MCP registered; `run` skill present with correct ports
- [ ] User told to reconnect MCP session

## Reference (this repo)

Copy/adapt from: `vitest.config.ts`, `src/test/*`, example `*.test.ts(x)`,
`playwright.config.ts`, `e2e/*`, `.mcp.json`, `.cursor/skills/run/SKILL.md`,
`docs/browser-automation.md`, `.github/workflows/ci.yml`,
`docs/testing-setup-playbook.md`.

## Example prompt (paste in another project)

```
Set up testing and AI browser automation in this repo (Vitest unit + component
tests, Playwright e2e + CI, Playwright MCP + a Cursor `run` skill).

Instructions:
- Follow @docs/testing-setup-playbook.md and/or the setup-tests skill if present.
  If those files are not in this workspace, I will attach/paste them — wait for
  that rather than inventing a different stack.
- First inspect this project's package.json, lockfile, existing test tooling,
  bundler (Vite/Next/etc.), and CI.
- If the stack differs from React + Vite + Vitest + Playwright + npm, STOP and
  ask me whether to (a) adopt that Vitest/Playwright/MCP stack anyway, or
  (b) use more accurate tools for this app (e.g. Jest, Next conventions,
  Cypress) while keeping the same layers: unit → component → e2e smoke → CI →
  optional AI browser MCP.
- After I confirm, implement the harness, then add a small initial suite:
  1–2 pure unit tests, 1–2 component tests with a project-appropriate
  renderWithProviders, and 1–2 Playwright smoke e2e specs for the main routes.
- Wire CI only if this repo already has CI config; adapt to the existing host
  (e.g. GitHub Actions). Skip inventing a new CI system unless I ask.
- Add Playwright MCP + `.cursor/skills/run/SKILL.md` with this app's real
  ports/commands. Tell me to reconnect MCP when done.
- Prefer thin smoke tests over deep coverage. Do not commit secrets or baselines.
```
