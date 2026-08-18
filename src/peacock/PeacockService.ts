import type {
  AccountSummary,
  ActionResult,
  CancellationPreview,
  Capability,
  CatalogTitle,
  Entitlements,
  NextEpisode,
  PlanChangePreview,
  PlaybackDestination,
  PreviewInfo,
  Subscription,
  ViewingProgress,
} from "./types";

/**
 * Contract for Peacock account behaviour used by both the browser prototype
 * (via MockPeacockService) and, later, a real local MCP server. The MCP server
 * will reuse this exact interface + the tool layer so business behaviour is
 * defined in one place only.
 *
 * All methods are async to mirror a real networked API. Personal methods throw
 * PeacockNotConnectedError when no persona is connected.
 */
export interface PeacockService {
  isConnected(): boolean;
  getConnectedPersonaId(): string | null;

  // Read-only, personal
  getAccountSummary(): Promise<AccountSummary>;
  getSubscription(): Promise<Subscription>;
  getEntitlements(): Promise<Entitlements>;
  getWatchlist(): Promise<CatalogTitle[]>;

  // Read-only, personal — simulated viewing state (Continue Watching / resume)
  getViewingHistory(): Promise<ViewingProgress[]>;
  getContinueWatching(): Promise<ViewingProgress[]>;
  getResumePosition(contentId: string): Promise<ViewingProgress | null>;
  getNextEpisode(contentId: string): Promise<NextEpisode | null>;

  // Read-only, general (no connection required)
  getSupportedCapabilities(): Promise<Capability[]>;
  searchCatalog(query: string): Promise<CatalogTitle[]>;
  getTitleDetails(contentId: string): Promise<CatalogTitle>;
  getPreview(contentId: string): Promise<PreviewInfo>;
  getPlaybackDestination(contentId: string): Promise<PlaybackDestination>;

  // Mutating, personal
  addToWatchlist(contentId: string): Promise<CatalogTitle[]>;
  removeFromWatchlist(contentId: string): Promise<CatalogTitle[]>;

  // Simulated commerce (defined for contract parity only). Under current OpenAI
  // plugin guidance these are policy-blocked: every method hard-throws and
  // mutates nothing. confirmPlanChange throws PolicyProhibitedError (RED);
  // the rest throw PolicyClarificationRequiredError (YELLOW). RED vs YELLOW is
  // decided at the agent/intent layer; the service guarantees zero mutation.
  previewPlanChange(targetPlanId: string): Promise<PlanChangePreview>;
  confirmPlanChange(previewId: string): Promise<ActionResult>;
  previewCancellation(): Promise<CancellationPreview>;
  confirmCancellation(previewId: string): Promise<ActionResult>;
}
