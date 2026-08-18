# Peacock Connector — Prototype (Phase 1)

A simulated Peacock account connector rendered as a small chat UI. It is a
**static, front-end-only prototype**: there is **no backend, no external LLM,
and no secrets**. The "connection" is a persona picker — the app never asks for
a username, password, MFA, or payment details.

Its purpose is to demonstrate to Peacock stakeholders what an OpenAI/ChatGPT
Peacock plugin **could** and **could not** do under OpenAI's published plugin
guidance. Each capability is classified GREEN / YELLOW / RED — see the
[OpenAI policy matrix](docs/openai-policy-matrix.md) and the
[policy test script](docs/policy-test-script.md). The single source of truth for
the classifications is [`src/policy/policy.ts`](src/policy/policy.ts).

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
  policy/      GREEN/YELLOW/RED policy model (single source of truth) + tests
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

## Continue Watching

A GREEN existing-account capability backed by mock viewing fixtures per persona.
It answers "what was I watching?", "where did I leave off?", "continue
\<title\>", "resume my last show", "show me things I haven't finished", and
"what's next in \<series\>?" via read-only tools (`get_viewing_history`,
`get_continue_watching`, `get_resume_position`, `get_next_episode`). Nothing here
mutates viewing state; Resume hands off to the simulated Peacock playback flow.

## Guest mode (optional authentication)

Following OpenAI's optional-authentication MCP pattern, the connector works for a
**Guest** — anyone with no connected Peacock account. "Guest" is simply the
absence of a connection (`connectedPersonaId === null`); it is **not** a
silently-created customer account and never triggers OAuth on its own.

- **Anonymous / public tools work as a Guest:** catalog search, title details,
  recommendations, cross-service availability, previews, and the public playback
  destination. These are dual-mode (`noauth` + `oauth2`) — public for Guests,
  richer once connected.
- **Personal / account actions require the connection:** subscription,
  entitlements, watchlist read, viewing history, Continue Watching, and any
  watchlist write are `oauth2`-only. A Guest asking for them gets the connect
  prompt and no account data leaks.
- **Personal writes** prompt *"Connect Peacock to save this to My Stuff."* and
  preserve the original intent so it auto-resumes after connecting.

Each tool's contract lives in [`src/tools/access.ts`](src/tools/access.ts)
(`authModes`); the boundary is covered by `src/tools/access.test.ts` and the
*Guest Peacock Mode* suite in `src/agent/agent.test.ts`.

## Prototype controls

Connect / switch persona, disconnect, **Reset scenario** (restore fixtures),
and **Clear all local state**. A **Show tool activity** toggle shows which
Peacock tool each assistant turn invoked; a **Show OpenAI policy status** toggle
badges each reply GREEN / YELLOW / RED for stakeholder review. Either toggle also
reveals the **Access Inspector** line — `Guest / noauth` or
`Connected Peacock / oauth2` — for the turn.

## Product-policy note

Commerce (upgrade / new subscription / reactivation / display-plans / checkout)
is **RED** — not permitted by current OpenAI plugin guidance — and cancel /
downgrade / pause are **YELLOW** (require OpenAI clarification). The service
layer enforces this as a hard floor: every commerce method throws and mutates
nothing (`PolicyProhibitedError` for confirmed plan change,
`PolicyClarificationRequiredError` for the rest). No commerce tool is registered;
the only mutating tools are the two reversible watchlist writes. See
[docs/openai-policy-matrix.md](docs/openai-policy-matrix.md).

## Security note

No secrets or credentials exist anywhere in this repo. The "connection" is a
persona picker only; all state lives in browser `localStorage`
(key `peacock-agent-poc:v1`) and is cleared by "Clear all local state".
