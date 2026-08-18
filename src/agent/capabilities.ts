/**
 * Static, presentation-level copy for the assistant UI. The live, context-aware
 * capability list comes from the get_supported_capabilities tool; this module
 * only supplies the graceful limitation / about copy and the internal
 * "Things to try" examples.
 *
 * The first-run / new-chat screen is intentionally neutral: no greeting, no
 * starter prompts, and no capability hints. The composer is the only
 * affordance, and capabilities are revealed only after the user expresses an
 * intent.
 */

/**
 * Peacock-account-specific example prompts. These are intentionally kept off the
 * default home screen and surfaced inside the internal "Things to try" /
 * Prototype Settings experience, so the neutral first-run stays neutral.
 */
export const THINGS_TO_TRY: string[] = [
  "What's on my Peacock watchlist?",
  "Help me with my Peacock subscription",
  "What does my Peacock plan include?",
  "I want to watch Love Island USA",
  "@PeacockTV find The Traitors",
  "@PeacockTV recommend something funny",
];

/** Shown only when the user makes a request this prototype can't handle yet. */
export const UNSUPPORTED_MESSAGE =
  "This prototype focuses on helping you find something to watch. Try asking for a recommendation, or where you can watch a specific title.";

/** Prototype disclosures, surfaced in the About section of settings. */
export const ABOUT_LINES: string[] = [
  "This prototype uses simulated Peacock account and subscription data.",
  "No real Peacock credentials or payment information are used.",
  "It demonstrates what an OpenAI/ChatGPT Peacock plugin could and could not do under OpenAI's published plugin guidance (reviewed August 2026).",
  "Purchases, upgrades, and new subscriptions are not performed here — that guidance does not permit in-assistant digital commerce.",
];

/**
 * RED — copy for a prohibited commerce request. The assistant explains it can't
 * do the transaction in ChatGPT and offers a read-only alternative. It never
 * links to a checkout, promotes a tier, or displays plans for selection.
 */
export const COMMERCE_PROHIBITED_MESSAGE: Record<string, string> = {
  upgrade:
    "I can't change or upgrade your Peacock plan from here — under current OpenAI plugin guidance an assistant can't sell or start a subscription upgrade. I can explain what your current plan includes, or you can manage your plan directly in Peacock.",
  new_subscription:
    "I can't sign you up for Peacock or start a new subscription here — current OpenAI plugin guidance doesn't allow in-assistant subscription purchases. You can subscribe directly in the Peacock app or website.",
  reactivation:
    "I can't reactivate a paid Peacock subscription from here — that's a purchase, which current OpenAI plugin guidance doesn't allow an assistant to make. You can reactivate directly in Peacock. I'm happy to help you find something to watch in the meantime.",
  display_plans:
    "I can't show Peacock plans for selection or purchase here — current OpenAI plugin guidance doesn't allow an assistant to display plans to buy. I can explain what your current plan includes, or you can compare plans directly in Peacock.",
  checkout:
    "I can't take payment or run a checkout in ChatGPT — current OpenAI plugin guidance doesn't allow in-assistant digital purchases. Any payment happens directly in Peacock.",
};

/**
 * YELLOW — copy for a subscription-management action (cancel / downgrade /
 * pause) that current OpenAI guidance does not explicitly resolve. The
 * assistant does not perform it and does not pretend to; it explains the
 * clarification gap and points to Peacock. Zero mutation.
 */
export const COMMERCE_CLARIFY_MESSAGE: Record<string, string> = {
  cancel:
    "Cancelling a subscription sits in a grey area of current OpenAI plugin guidance — it isn't clearly permitted for an assistant to do on your behalf, so I won't action it here. You can cancel directly in your Peacock account settings.",
  downgrade:
    "Moving to a lower-cost plan isn't clearly resolved by current OpenAI plugin guidance, so I won't change your plan here. You can review and change your plan directly in Peacock.",
  pause:
    "Pausing a subscription isn't clearly resolved by current OpenAI plugin guidance, so I won't action it here. You can manage that directly in your Peacock account settings.",
};

/**
 * A neutral, informational Peacock plans page. Used only for GREEN
 * entitlement-gap explanations as a "learn more" link — never as a checkout or
 * a plan-selection surface. Mock URL for the prototype.
 */
export const PLANS_INFO_URL = "https://www.peacocktv.com/plans";
