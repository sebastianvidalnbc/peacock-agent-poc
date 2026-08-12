import type {
  AccountSummary,
  ActionResult,
  CancellationPreview,
  Capability,
  CatalogTitle,
  Entitlements,
  PlanChangePreview,
  PlaybackDestination,
  PreviewInfo,
  Subscription,
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

  // Read-only, general (no connection required)
  getSupportedCapabilities(): Promise<Capability[]>;
  searchCatalog(query: string): Promise<CatalogTitle[]>;
  getTitleDetails(contentId: string): Promise<CatalogTitle>;
  getPreview(contentId: string): Promise<PreviewInfo>;
  getPlaybackDestination(contentId: string): Promise<PlaybackDestination>;

  // Mutating, personal
  addToWatchlist(contentId: string): Promise<CatalogTitle[]>;
  removeFromWatchlist(contentId: string): Promise<CatalogTitle[]>;

  // Simulated commerce (defined for contract parity; not wired into Phase 1
  // tools/agent). Prototype capability only — not an OpenAI production policy.
  previewPlanChange(targetPlanId: string): Promise<PlanChangePreview>;
  confirmPlanChange(previewId: string): Promise<ActionResult>;
  previewCancellation(): Promise<CancellationPreview>;
  confirmCancellation(previewId: string): Promise<ActionResult>;
}
