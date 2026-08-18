/**
 * Single source of truth for the prototype's OpenAI plugin policy model.
 *
 * The UI (Policy Inspector), the agent handlers, and the policy regression
 * tests all reference this module rather than duplicating GREEN/YELLOW/RED
 * classifications. Classifications reflect OpenAI's published plugin guidance
 * as reviewed in August 2026 (see docs/openai-policy-matrix.md) and should be
 * revalidated before any production launch.
 */

/** Traffic-light classification for a capability under current OpenAI guidance. */
export type PolicyStatus = "green" | "yellow" | "red";

/**
 * Thrown by a service method that would perform a RED action (selling,
 * initiating, upgrading, reactivating, or checking out a digital subscription).
 * Such methods must never mutate state; they hard-stop here instead.
 */
export class PolicyProhibitedError extends Error {
  constructor(message = "This action is not permitted by current OpenAI plugin guidance.") {
    super(message);
    this.name = "PolicyProhibitedError";
  }
}

/**
 * Thrown by a service method for a YELLOW subscription-management action
 * (cancel / downgrade / pause) that OpenAI's published guidance does not
 * explicitly resolve. The method must never mutate state; a production plugin
 * would require policy confirmation from OpenAI before wiring it up.
 */
export class PolicyClarificationRequiredError extends Error {
  constructor(
    message = "OpenAI's current published plugin guidance does not explicitly resolve this subscription-management action.",
  ) {
    super(message);
    this.name = "PolicyClarificationRequiredError";
  }
}

/** Stable identifiers for every capability the prototype reasons about. */
export type PolicyCapabilityId =
  // GREEN
  | "catalog_search"
  | "recommendations"
  | "title_metadata"
  | "account_connection"
  | "account_read"
  | "subscription_read"
  | "entitlement_read"
  | "watchlist_read"
  | "watchlist_write"
  | "viewing_history"
  | "continue_watching"
  | "preview"
  | "playback_handoff"
  | "entitlement_gap"
  | "plans_info_link"
  // YELLOW
  | "embedded_playback"
  | "cancel"
  | "downgrade"
  | "pause"
  // RED
  | "upgrade"
  | "display_plans"
  | "new_subscription"
  | "reactivation"
  | "digital_checkout"
  | "upgrade_promotion"
  | "checkout_link";

export interface PolicyEntry {
  status: PolicyStatus;
  /** Human label for the capability. */
  label: string;
  /** Official OpenAI doc that governs the classification. */
  source: string;
}

const G = "app-guidelines";
const T = "plan/tools";

/** The canonical capability → policy classification map. */
export const POLICY_MAP: Record<PolicyCapabilityId, PolicyEntry> = {
  catalog_search: { status: "green", label: "Catalog / search", source: T },
  recommendations: { status: "green", label: "Recommendations", source: T },
  title_metadata: { status: "green", label: "Title metadata", source: T },
  account_connection: { status: "green", label: "Peacock account connection", source: "build/auth" },
  account_read: { status: "green", label: "Account read", source: G },
  subscription_read: { status: "green", label: "Subscription read", source: G },
  entitlement_read: { status: "green", label: "Entitlement read", source: G },
  watchlist_read: { status: "green", label: "Watchlist read", source: G },
  watchlist_write: { status: "green", label: "Watchlist write", source: G },
  viewing_history: { status: "green", label: "Viewing history", source: G },
  continue_watching: { status: "green", label: "Continue Watching / resume", source: G },
  preview: { status: "green", label: "Preview / trailer", source: G },
  playback_handoff: { status: "green", label: "Open / deep-link to Peacock playback", source: G },
  entitlement_gap: { status: "green", label: "Entitlement-gap explanation", source: G },
  plans_info_link: { status: "green", label: "Informational plans-page link", source: G },

  embedded_playback: { status: "yellow", label: "Full embedded playback in ChatGPT", source: G },
  cancel: { status: "yellow", label: "Cancellation", source: G },
  downgrade: { status: "yellow", label: "Downgrade", source: G },
  pause: { status: "yellow", label: "Pause", source: G },

  upgrade: { status: "red", label: "Upgrade", source: G },
  display_plans: { status: "red", label: "Displaying subscription plans for selection", source: G },
  new_subscription: { status: "red", label: "New subscription", source: G },
  reactivation: { status: "red", label: "Paid subscription reactivation", source: G },
  digital_checkout: { status: "red", label: "Digital checkout", source: G },
  upgrade_promotion: { status: "red", label: "Upgrade promotion", source: G },
  checkout_link: { status: "red", label: "Direct transactional / checkout link", source: G },
};

/** The short Policy Inspector label shown for each status. */
export function policyLabelFor(status: PolicyStatus): string {
  switch (status) {
    case "green":
      return "Supported by current OpenAI plugin guidance";
    case "yellow":
      return "Requires OpenAI clarification";
    case "red":
      return "Not permitted by current OpenAI plugin guidance";
  }
}

/** Convenience lookups used by the agent and tests. */
export function statusOf(id: PolicyCapabilityId): PolicyStatus {
  return POLICY_MAP[id].status;
}

export function sourceOf(id: PolicyCapabilityId): string {
  return POLICY_MAP[id].source;
}
