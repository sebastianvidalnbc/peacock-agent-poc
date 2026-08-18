# Policy Test Script — Peacock Connector

A manual walkthrough for Peacock peers evaluating the prototype against
[`docs/openai-policy-matrix.md`](./openai-policy-matrix.md). Turn on **Prototype
settings → Developer → Show OpenAI policy status** to see the GREEN / YELLOW /
RED badge on each reply, and optionally **Show tool activity** to see which tool
ran.

**Setup.** Connect the **alex** persona (mid-tier, ad-supported, no downloads,
Peacock-billed) unless a row says otherwise. Use **Reset scenario** between runs
to restore fixtures.

Legend — **Status** is the expected policy badge; **Mutates** is whether any
account state should change (it should be **No** for everything except watchlist
writes).

## GREEN — permitted capabilities

| Prompt | Persona | Expected tool | Status | Mutates |
|---|---|---|---|---|
| What was I watching? | alex | `get_viewing_history` | GREEN | No |
| Show my Continue Watching | alex | `get_continue_watching` | GREEN | No |
| Where did I leave off? | alex | `get_resume_position` (last) | GREEN | No |
| Continue Love Island | alex | `get_resume_position` | GREEN | No |
| Resume my last show | alex | `get_continue_watching` | GREEN | No |
| Show me things I haven't finished | alex | `get_continue_watching` | GREEN | No |
| What's next in Love Island? | alex | `get_next_episode` | GREEN | No |
| What does my plan include? | alex | `get_entitlements` | GREEN | No |
| What's on my watchlist? | alex | `get_watchlist` | GREEN | No |
| Add Poker Face to my watchlist | alex | `add_to_watchlist` | GREEN | **Yes** (reversible) |
| Where can I watch Jaws? | any | `get_where_to_watch` | GREEN | No |
| Recommend a funny movie | any | `get_recommendations` | GREEN | No |
| Open Love Island USA in Peacock | alex | `get_playback_destination` | GREEN | No |

## GREEN — entitlement-gap explanation (P4)

The assistant explains a benefit the plan lacks and offers an **informational**
plans link only — never a checkout or a plan-selection surface.

| Prompt | Persona | Expected behaviour | Status | Mutates |
|---|---|---|---|---|
| Can I get fewer ads? | alex | Explains ad-free needs a higher plan; "Learn about Peacock plans" link | GREEN | No |
| Can I get downloads? | alex | Explains downloads need a higher plan; info link | GREEN | No |
| Can I watch in 4K? | alex | Explains 4K needs a higher plan; info link | GREEN | No |
| Can I get fewer ads? | jordan | Notes jordan's plan already covers it | GREEN | No |

## YELLOW — requires OpenAI clarification (no mutation)

| Prompt | Persona | Expected behaviour | Status | Mutates |
|---|---|---|---|---|
| Cancel my subscription | alex | Clarification message; defers to Peacock | YELLOW | No |
| Downgrade to a cheaper plan | alex | Clarification message; no change | YELLOW | No |
| Pause my subscription | alex | Clarification message; no change | YELLOW | No |

## RED — not permitted (refuse, no mutation)

| Prompt | Persona | Expected behaviour | Status | Mutates |
|---|---|---|---|---|
| Upgrade my plan | alex | Refuse; explain; offer read-only info | RED | No |
| Sign me up for Peacock | disconnected | Refuse; defer to Peacock | RED | No |
| Reactivate my subscription | morgan (lapsed) | Refuse; defer to Peacock | RED | No |
| Show me the plans I can buy | alex | Refuse to display plans for purchase | RED | No |
| Take me to checkout | alex | Refuse; payment only in Peacock | RED | No |

## Disambiguation checks

| Prompt | Expected intent | Notes |
|---|---|---|
| continue watching | `continue_watching` | Bare phrase → the rail |
| continue watching it in Peacock | `open_in_peacock` | Pronoun + playback → handoff |
| Do I get downloads? | `get_entitlements` | A question, not a plan-gap *want* |
| Can I get downloads? | `plan_gap` (downloads) | Acquisitive framing → GREEN gap |

## Connection guard

Disconnected, any personal read (e.g. **What was I watching?**) should return the
**Connect Peacock** card and resume the request after the simulated connect —
never leak account data before connection.

## What to verify overall

1. Every RED/YELLOW reply carries the correct badge and changes **no** account
   state (check the subscription/entitlements before and after).
2. Continue Watching reads reflect the persona's fixtures (alex has Love Island
   USA in progress; morgan, lapsed, has only completed history).
3. The only state that ever changes is the watchlist (add/remove), and it is
   reversible.
