# Browser automation (Playwright MCP)

Dev-time AI browser checks for MedlineWebApp. **Not** part of CI. No golden screenshot baselines.

## What’s wired

| Piece | Location |
| --- | --- |
| Playwright MCP | `.mcp.json` and `.cursor/mcp.json` |
| Agent skill | `.cursor/skills/run/SKILL.md` |
| Screenshots | `.cursor/skills/run/screenshots/` (gitignored) |

After changing MCP config, **reconnect / restart the Playwright MCP server** in Cursor.

## Local servers

```bash
pnpm dev          # http://localhost:3000
pnpm storybook    # http://localhost:6006
```

Requires `.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` for the app.

## Automated e2e (separate from MCP)

```bash
pnpm test:e2e     # Playwright specs in ./e2e
```

Smoke coverage today: `/login`, `/signup`, and unauthenticated `/` → `/login`.
