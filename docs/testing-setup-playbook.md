# Testing + AI browser automation setup playbook

A guide to implement testing and AI browser automation setup.

Copy this playbook (and/or the `setup-tests` skill) into the target repo, or
paste the example prompt from the skill into chat with `@docs/testing-setup-playbook.md`.

## Compatibility gate (do this first)

This playbook assumes:

| Assumption | Default in this guide |
| --- | --- |
| UI | React 18+ |
| Bundler / app | Vite (SPA) |
| Unit / component runner | Vitest + jsdom + Testing Library |
| E2E | Playwright (`@playwright/test`) |
| Package manager | npm (`package-lock.json`) |
| CI | GitHub Actions (adapt patterns to the target host) |
| AI browser | Playwright MCP (`@playwright/mcp`) |

**Before installing anything**, inspect the target repo (`package.json`, lockfile,
existing test config, CI). If the stack differs — e.g. Next.js, Jest, Cypress,
pnpm/yarn, Vue/Svelte, Storybook-only, no SPA `npm run dev` — **stop and ask**
whether to:

1. Keep this Vitest + Playwright + MCP stack (migrate toward it), or
2. Adapt to more accurate tools for that app (Jest, Next test conventions,
   Cypress, etc.) while keeping the same layering: unit → component → e2e smoke
   → CI → optional AI browser MCP.

Do not force Vite/`loadEnv`/CI-host-specific snippets onto a mismatched project.

## Stack overview

| Layer | Tooling | CI? | Purpose |
| --- | --- | --- | --- |
| Unit (`.test.ts`) | Vitest + Node | Yes (`test:changed`) | Pure helpers/utils |
| Component (`.test.tsx`) | Vitest + jsdom + RTL | Yes (same job) | UI components in isolation |
| E2E (`e2e/*.spec.ts`) | `@playwright/test` | Yes (host + cached Chromium) | Real routes + smoke flows |
| AI browser automation | `@playwright/mcp` + agent skill | No | Interactive screenshots / visual checks during agent work |

## Rollout order

1. Vitest + one pure unit test (`npm test`)
2. jsdom / RTL setup + `renderWithProviders` + 2–3 component tests
3. Playwright config + 1–2 smoke e2e specs
4. CI jobs (unit changed + e2e)
5. MCP + agent `run` skill for screenshots

---

## 1. Install deps and scripts

```bash
npm i -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test
npx playwright install chromium   # local e2e only
```

`package.json` scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:changed": "vitest run --changed",
  "test:e2e": "playwright test"
}
```

Pin `@playwright/test`. CI installs Chromium on the host runner (no Playwright
Docker image) and caches `~/.cache/ms-playwright` keyed on the lockfile.

---

## 2. Vitest — unit vs component projects

### `vitest.config.ts`

```ts
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror the app's Vite aliases
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts']
        }
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts']
        }
      }
    ]
  }
});
```

### `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
```

### `src/test/render.tsx`

Add a `renderWithProviders` that wraps the app’s real providers (router, query
client, auth/context mocks). Keep network out of component tests — stub API
modules or context values.

Reference in this repo: [`src/test/render.tsx`](../src/test/render.tsx).

### What to test first

- Pure utils / schemas under `src/lib/**` or `src/features/**` (or equivalent)
- A few UI / app components with RTL roles and labels
- Prefer `getByRole` / `getByLabelText` over class names or DOM structure

Examples: [`src/lib/utils.test.ts`](../src/lib/utils.test.ts),
[`src/components/ui/button.test.tsx`](../src/components/ui/button.test.tsx).

---

## 3. Playwright e2e

### `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';
import { loadEnv } from 'vite'; // or dotenv — whatever the app uses

process.env = { ...process.env, ...loadEnv('development', process.cwd()) };

const port = Number(process.env.VITE_PORT) || 5190;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'html',
  use: {
    baseURL,
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
});
```

### Spec style

Thin smoke tests only:

1. Navigate to a route
2. Assert key text / URL / table headers
3. Optionally collect `console` + `pageerror` and assert no errors

Examples: [`e2e/login.spec.ts`](../e2e/login.spec.ts),
[`e2e/signup.spec.ts`](../e2e/signup.spec.ts).

### `.gitignore`

```
/test-results/
/playwright-report/
/playwright/.cache/
```

---

## 4. CI

Adapt to whatever CI the target repo already uses (this repo: GitHub Actions).
Typical jobs:

### Unit tests (changed files only)

- Image: Node matching project engines
- Cache package manager store keyed on lockfile
- Full git history (`fetch-depth: 0`) so `vitest --changed` can see the merge
  base
- Install deps, then run `test:changed` against the PR base branch
- Trigger when `src/**`, lockfile, or `vitest.config.ts` change

Example (GitHub Actions-style):

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
- run: pnpm install --frozen-lockfile
- run: pnpm test:changed -- "origin/${{ github.base_ref }}"
```

### E2E tests

- Run on `ubuntu-latest` (no Playwright Docker container — avoids ~30s image pull)
- Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` on dependency install
- Cache `~/.cache/ms-playwright` keyed on the lockfile
- Cache miss: `pnpm exec playwright install --with-deps chromium`
- Cache hit: `pnpm exec playwright install-deps chromium` (system libs are not cached)
- Then `pnpm test:e2e`
- Artifact `playwright-report/` on failure, expire in ~7 days
- Trigger when `src/**`, `e2e/**`, lockfile, or `playwright.config.ts` change

This repo’s workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
(`test:changed` on PRs, host Chromium + browser cache + path filter + gate job,
full `pnpm test` on `main` pushes).

---

## 5. AI browser automation (Cursor / Claude)

Development-time only — **not** wired into CI. No golden screenshot baselines.

### MCP server

Project root [`.mcp.json`](../.mcp.json) is the source of truth; keep
`.cursor/mcp.json` in sync for Cursor. Pin `@playwright/mcp` (do not use
`@latest`):

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

Restart/reconnect MCP after adding. There is no custom driver — use upstream
`browser_*` tools (`browser_navigate`, `browser_snapshot`, `browser_click`,
`browser_take_screenshot`, `browser_console_messages`, `browser_wait_for`,
`browser_close`, …).

### Agent `run` skill

| Client | Path |
| --- | --- |
| Cursor | `.cursor/skills/run/SKILL.md` |
| Claude Code | `.claude/skills/run/SKILL.md` |

Copy from [`.cursor/skills/run/SKILL.md`](../.cursor/skills/run/SKILL.md) and
adapt:

- Dev / Storybook commands and ports
- Auth bypass or login requirements
- Screenshot output dir (match MCP `--output-dir`)
- Project-specific gotchas (e.g. Storybook iframe reload)

Optional Claude Code copy: `.claude/skills/run/SKILL.md` (same content, paths
adjusted if needed).

Ignore generated screenshots:

```
# .cursor/skills/run/.gitignore  (and/or .claude/skills/run/.gitignore)
screenshots/
```

### Human docs

Keep a short [`docs/browser-automation.md`](browser-automation.md) and link it
from the README so humans know what is wired.

---

## Multi-client notes

| Piece | Cursor | Claude Code (optional) |
| --- | --- | --- |
| MCP | `.mcp.json` + `.cursor/mcp.json` | `.mcp.json` |
| `run` skill | `.cursor/skills/run/SKILL.md` | `.claude/skills/run/SKILL.md` |
| Screenshots | `.cursor/skills/run/screenshots` | Match that client’s skill dir |
| Skill wording | “Cursor agent” / screenshot / verify UI | “Claude Code” if that client is used |

To **implement** this stack in another repo with Cursor, use the
[`setup-tests`](../.cursor/skills/setup-tests/SKILL.md) skill (or paste this
playbook into the chat).

---

## Reference file checklist

Copy/adapt from this repo:

- [ ] `vitest.config.ts`
- [ ] `src/test/setup.ts`
- [ ] `src/test/render.tsx`
- [ ] Example unit + component tests
- [ ] `playwright.config.ts`
- [ ] `e2e/*.spec.ts`
- [ ] `.mcp.json` (and Cursor MCP equivalent)
- [ ] `.cursor/skills/run/SKILL.md` (+ optional `.claude` copy)
- [ ] `docs/browser-automation.md`
- [ ] CI: unit + e2e jobs (e.g. `.github/workflows/ci.yml`)
- [ ] `.gitignore` Playwright paths

## Example prompt (another project)

In the target app’s Cursor chat, attach this playbook (and optionally the
skill), then paste:

```
Set up testing and AI browser automation in this repo (Vitest unit + component tests, Playwright e2e + CI,
Playwright MCP + a Cursor `run` skill).

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

**Reuse tip:** copy `docs/testing-setup-playbook.md` and
`.cursor/skills/setup-tests/` into the target repo (or keep the skill under
`~/.cursor/skills/setup-tests` personally), then run the prompt above.
