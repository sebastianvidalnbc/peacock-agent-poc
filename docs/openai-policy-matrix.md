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

## Guest Mode & optional authentication (MCP optional-auth pattern)

Reflecting OpenAI's optional-authentication MCP pattern, each tool advertises an
`authModes` contract (`src/tools/access.ts`) that is **orthogonal** to the
GREEN/YELLOW/RED policy status above — policy answers *"is this permitted?"*,
access answers *"who can run it?"*.

- **Guest** = the absence of a connected Peacock persona (`connectedPersonaId`
  is `null`). Guest is **not** a silently-created customer account — no OAuth,
  no profile, no overlay is created.
- **`noauth`** — runnable by a Guest (anonymous, public).
- **`oauth2`** — requires the simulated Peacock connection.
- **Dual (`["noauth","oauth2"]`)** — public results for a Guest; richer,
  account-aware results once connected.

| Access mode | Tools | Guest can run? |
|---|---|---|
| Dual (noauth + oauth2) | `search_catalog`, `get_title_details`, `get_preview`, `get_playback_destination`, `search_across_services`, `get_where_to_watch`, `get_recommendations`, `get_supported_capabilities` | Yes (public result) |
| oauth2 only | `get_account_summary`, `get_subscription`, `get_entitlements`, `get_watchlist`, `add_to_watchlist`, `remove_from_watchlist`, `get_viewing_history`, `get_continue_watching`, `get_resume_position`, `get_next_episode` | No — prompts to connect |

- A Guest attempting a **personal read** (subscription, entitlements, watchlist,
  viewing history) gets the connect prompt and **no** account card or tool call.
- A Guest attempting a **personal write** (save to My Stuff) gets the
  write-specific prompt *"Connect Peacock to save this to My Stuff."*; the
  original intent is preserved and auto-resumes after the simulated connection.
- The **Access Inspector** (shown with the debug/policy toggles) labels each
  turn `Guest / noauth` or `Connected Peacock / oauth2`.

Enforcement is verified in `src/tools/access.test.ts` and the *Guest Peacock
Mode — access boundary* suite in `src/agent/agent.test.ts` (Guest cannot read or
mutate authenticated account data; Guest can use anonymous tools).

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

| Tool group | readOnlyHint | destructiveHint | openWorldHint | authModes |
|---|---|---|---|---|
| Account/subscription/entitlement/watchlist reads | true | — | false | oauth2 |
| Viewing history / Continue Watching reads | true | — | false | oauth2 |
| Catalog search / title details | true | — | true | noauth + oauth2 |
| Preview | true | — | false | noauth + oauth2 |
| Playback handoff | true | — | true | noauth + oauth2 |
| Watchlist writes (add/remove) | false | false | true | oauth2 |
| Cross-service discovery | true | — | true | noauth + oauth2 |

## Caveats

- All account, subscription, viewing, and catalog data are **synthetic
  fixtures**. No real Peacock telemetry, credentials, or payment data exist.
- The prototype is **static and front-end-only** — no backend and no live LLM.
- Diagnostic IDs and routing traces in the debug/policy inspector are developer
  instrumentation, shown only when the toggles are on, and are never part of the
  assistant's user-facing copy or MCP tool output.
