# OpenAI/ChatGPT Plugin Policy Matrix — Peacock Connector

**Purpose.** This prototype demonstrates to Peacock stakeholders what an
OpenAI/ChatGPT Peacock plugin **could** and **could not** do under OpenAI's
published plugin guidance. This document is the human-readable companion to the
machine source of truth in [`src/policy/policy.ts`](../src/policy/policy.ts).

**Sources reviewed (August 2026).**
- App guidelines — `developers.openai.com/plugins/app-guidelines`
- Define tools — `developers.openai.com/plugins/plan/tools`
- Authentication — `developers.openai.com/plugins/build/auth`
- Security & privacy — `developers.openai.com/plugins/guides/security-privacy`

**Revalidation.** These classifications reflect guidance as reviewed on the date
above. OpenAI guidance changes; re-check all four sources and reconcile
`POLICY_MAP` before any production launch.

## The GREEN / YELLOW / RED model

| Status | Meaning | Assistant behaviour |
|---|---|---|
| **GREEN** | Supported by current OpenAI plugin guidance. | Perform it (reads, watchlist writes, discovery, previews, playback handoff, entitlement-gap explanation, Continue Watching). |
| **YELLOW** | Requires OpenAI clarification — guidance does not explicitly resolve it. | Do **not** perform. Explain the clarification gap; **zero mutation**. |
| **RED** | Not permitted by current OpenAI plugin guidance. | Refuse with an explanation; offer only read-only alternatives. Never sell, initiate, upgrade-promote, display plans for purchase, or link to checkout. **Zero mutation.** |

## Capability matrix

| Capability | Status | Expected tool / behaviour | Source |
|---|---|---|---|
| Catalog / search | GREEN | `search_catalog`, `search_across_services` | plan/tools |
| Recommendations | GREEN | `get_recommendations` (provider-neutral) | plan/tools |
| Title metadata | GREEN | `get_title_details` | plan/tools |
| Account connection | GREEN | Simulated OAuth-style connect (no credentials) | build/auth |
| Account read | GREEN | `get_account_summary` | app-guidelines |
| Subscription read | GREEN | `get_subscription` | app-guidelines |
| Entitlement read | GREEN | `get_entitlements` | app-guidelines |
| Watchlist read | GREEN | `get_watchlist` | app-guidelines |
| Watchlist write | GREEN | `add_to_watchlist` / `remove_from_watchlist` (reversible) | app-guidelines |
| Viewing history | GREEN | `get_viewing_history` | app-guidelines |
| Continue Watching / resume | GREEN | `get_continue_watching`, `get_resume_position`, `get_next_episode` | app-guidelines |
| Preview / trailer | GREEN | `get_preview` (simulated player) | app-guidelines |
| Playback handoff | GREEN | `get_playback_destination` (deep-link to Peacock) | app-guidelines |
| Entitlement-gap explanation | GREEN | Read `get_entitlements`; explain gap + informational plans link (no checkout) | app-guidelines |
| Informational plans link | GREEN | Open neutral plans page in a new tab | app-guidelines |
| Full embedded playback in ChatGPT | YELLOW | Not attempted; handoff to Peacock instead | app-guidelines |
| Cancellation | YELLOW | Clarification message; no mutation | app-guidelines |
| Downgrade | YELLOW | Clarification message; no mutation | app-guidelines |
| Pause | YELLOW | Clarification message; no mutation | app-guidelines |
| Upgrade | RED | Refuse; explain; no mutation | app-guidelines |
| Display plans for selection | RED | Refuse; explain what current plan includes | app-guidelines |
| New subscription | RED | Refuse; defer to Peacock | app-guidelines |
| Paid reactivation | RED | Refuse; defer to Peacock | app-guidelines |
| Digital checkout | RED | Refuse; payment happens only in Peacock | app-guidelines |
| Upgrade promotion | RED | Never promote a higher tier | app-guidelines |
| Direct transactional / checkout link | RED | Never link to a purchase surface | app-guidelines |

## Enforcement in code

- **Single source of truth:** `POLICY_MAP` in `src/policy/policy.ts`. The agent,
  the Policy Inspector UI, and the regression tests all read from it.
- **Service floor (last line of defence):** every commerce method on
  `MockPeacockService` hard-throws and mutates nothing —
  `confirmPlanChange` throws `PolicyProhibitedError` (RED); `previewPlanChange`,
  `previewCancellation`, `confirmCancellation` throw
  `PolicyClarificationRequiredError` (YELLOW).
- **Agent layer:** RED and YELLOW intents route to dedicated handlers that
  never call a mutating tool and tag the reply with its policy status.
- **MCP tool annotations:** every tool carries `readOnlyHint`,
  `destructiveHint` (reversible watchlist writes are `false`), and
  `openWorldHint` (discovery + playback handoff are `true`).
- **No RED tool is registered.** The only mutating tools are the two reversible
  watchlist writes; this is asserted in `src/policy/policy.test.ts`.

## MCP annotations summary

| Tool group | readOnlyHint | destructiveHint | openWorldHint |
|---|---|---|---|
| Account/subscription/entitlement/watchlist reads | true | — | false |
| Viewing history / Continue Watching reads | true | — | false |
| Catalog search / title details | true | — | true |
| Preview | true | — | false |
| Playback handoff | true | — | true |
| Watchlist writes (add/remove) | false | false | true |
| Cross-service discovery | true | — | true |

## Caveats

- All account, subscription, viewing, and catalog data are **synthetic
  fixtures**. No real Peacock telemetry, credentials, or payment data exist.
- The prototype is **static and front-end-only** — no backend and no live LLM.
- Diagnostic IDs and routing traces in the debug/policy inspector are developer
  instrumentation, shown only when the toggles are on, and are never part of the
  assistant's user-facing copy or MCP tool output.
