# Peacock Connector — Prototype (Phase 1)

A simulated Peacock account connector rendered as a small chat UI. It is a
**static, front-end-only prototype**: there is **no backend, no external LLM,
and no secrets**. The "connection" is a persona picker — the app never asks for
a username, password, MFA, or payment details.

## Overview

The prototype demonstrates how a Peacock connector could answer account
questions (subscription, entitlements, watchlist, catalog search) through a
tool-calling agent, without any real integration. All behaviour is backed by
in-memory fixtures and a small observable store persisted to `localStorage`.

## Architecture (Phase 1)

```
User → Chat UI (React) → Agent (intent router) → Tools (runTool + Zod)
     → PeacockService → MockPeacockService → prototype store / fixtures
```

- **Agent** routes each turn to an intent and calls a single tool via `runTool`.
- **Tools** are transport-agnostic definitions (name/description/Zod
  input+output schema/`mutates`/`requiresConfirmation`/`requiresAuth`). Metadata
  is separate from execution: `runTool(service, name, input)` is the one
  execution path.
- **PeacockService** is the behaviour contract; `MockPeacockService` implements
  it against fixtures + the prototype store.

### Future MCP path

```
ChatGPT / MCP Inspector → local MCP server → SAME src/tools + PeacockService
```

A future local MCP server reuses the **same** `src/tools` and `src/peacock`
layer — no second business implementation. See `mcp/README.md`.

## Directory layout

```
src/
  app/         App shell + app bar
  agent/       Intent router, agent, conversation state, capabilities
  components/  Chat UI, Peacock cards, prototype controls
  data/        Fixtures: personas, plans, catalog
  peacock/     PeacockService contract, MockPeacockService, Zod schemas, types
  state/       Framework-agnostic prototype store + React binding
  tools/       MCP-compatible tool definitions + runTool registry
```

## Local development

```bash
npm install
npm run dev        # http://localhost:5173/peacock-agent-poc/
npm test           # vitest run
npm run typecheck  # tsc -b --noEmit
npm run build      # tsc -b && vite build
npm run preview    # serve dist/
```

## GitHub Pages base path

The Vite `base` defaults to `/peacock-agent-poc/` (matches a repo named
`peacock-agent-poc`). Override it to match a different repo name:

```bash
GH_PAGES_BASE=/my-repo/ npm run build
```

## Deployment

### (A) PRIMARY — manual `gh-pages`

```bash
git init
git remote add origin <your-remote-url>
npm run deploy     # runs build, then: npx gh-pages -d dist
```

This publishes `dist/` to the `gh-pages` branch. Then enable
**Settings → Pages → Deploy from branch → `gh-pages` / (root)**.

### (B) OPTIONAL — GitHub Actions

`.github/workflows/deploy.yml` builds and deploys on push to `main`. It needs
Actions **and** Pages permissions enabled, which may be disabled on NBCU
GitHub. Prefer path (A) if Actions/Pages are restricted.

## Personas

- **alex** — mid-tier, Peacock-billed, ads, no downloads.
- **jordan** — top-tier, annual, downloads, fewer ads.
- **taylor** — Apple-billed; some actions blocked (billed externally).
- **morgan** — lapsed subscription with prior watch history.

## Prototype controls

Connect / switch persona, disconnect, **Reset scenario** (restore fixtures),
and **Clear all local state**. A **Debug** toggle shows a tool-activity panel
listing which Peacock tool each assistant turn invoked.

## Product-policy note

Simulated commerce (upgrade/downgrade/cancel) is a **concept-evaluation
capability only** and is **NOT an approved OpenAI production feature**. It is
defined on the service contract for parity but is not wired into the Phase 1
agent, tools, or UI.

## Security note

No secrets or credentials exist anywhere in this repo. The "connection" is a
persona picker only; all state lives in browser `localStorage`
(key `peacock-agent-poc:v1`) and is cleared by "Clear all local state".
