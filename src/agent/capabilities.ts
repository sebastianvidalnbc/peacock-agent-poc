/**
 * Static, presentation-level copy for the assistant UI. The live, context-aware
 * capability list comes from the get_supported_capabilities tool; this module
 * only supplies the neutral initial greeting, a few conversation starters, and
 * the graceful limitation / about copy.
 */

/** Neutral opening headline shown before any conversation has started. */
export const INITIAL_GREETING = "What can I help with?";

/**
 * The default home-screen conversation starters. These are provider-neutral and
 * entertainment-oriented — a fresh conversation should feel like any general AI
 * assistant chat, so nothing here mentions Peacock, accounts, watchlists, or
 * subscriptions. Peacock enters the conversation only when the user's request
 * makes it relevant (e.g. a title that happens to be on Peacock).
 */
export const STARTER_PROMPTS: string[] = [
  "What should I watch tonight?",
  "Recommend a funny movie",
  "Where can I watch Jaws?",
];

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
];

/** Shown only when the user makes a request this prototype can't handle yet. */
export const UNSUPPORTED_MESSAGE =
  "This prototype focuses on helping you find something to watch. Try asking for a recommendation, or where you can watch a specific title.";

/** Prototype disclosures, surfaced in the About section of settings. */
export const ABOUT_LINES: string[] = [
  "This prototype uses simulated Peacock account and subscription data.",
  "No real Peacock credentials or payment information are used.",
  "Transactional subscription functionality may be simulated for concept evaluation and does not imply production approval.",
];

/** Short note surfaced when discussing simulated commerce actions. */
export const COMMERCE_DISCLAIMER =
  "Note: upgrade, downgrade, and cancellation are simulated capabilities for concept evaluation only. They are not wired up in this phase of the prototype, and nothing here is an approved OpenAI production feature.";
