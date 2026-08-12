/**
 * Static, presentation-level copy for the assistant UI. The live, context-aware
 * capability list comes from the get_supported_capabilities tool; this module
 * only supplies the neutral initial greeting, a few conversation starters, and
 * the graceful limitation / about copy.
 */

/** Neutral opening headline shown before any conversation has started. */
export const INITIAL_GREETING = "What can I help with?";

/** A small set of secondary conversation starters (kept to three). */
export const STARTER_PROMPTS: string[] = [
  "What should I watch tonight?",
  "What's on my Peacock watchlist?",
  "Help me with my Peacock subscription",
];

/** Shown only when the user makes a request this prototype can't handle yet. */
export const UNSUPPORTED_MESSAGE =
  "This prototype currently supports a focused set of Peacock scenarios. Try asking about your Peacock subscription, watchlist, or something to watch.";

/** Prototype disclosures, surfaced in the About section of settings. */
export const ABOUT_LINES: string[] = [
  "This prototype uses simulated Peacock account and subscription data.",
  "No real Peacock credentials or payment information are used.",
  "Transactional subscription functionality may be simulated for concept evaluation and does not imply production approval.",
];

/** Short note surfaced when discussing simulated commerce actions. */
export const COMMERCE_DISCLAIMER =
  "Note: upgrade, downgrade, and cancellation are simulated capabilities for concept evaluation only. They are not wired up in this phase of the prototype, and nothing here is an approved OpenAI production feature.";
