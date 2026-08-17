import type { TitleAvailability } from "../peacock/types";

/**
 * Contract for provider-neutral, cross-service content discovery (Phase 2B).
 *
 * This service deliberately knows nothing about any user's account, connection,
 * or entitlements — it only answers "what titles exist and where can they be
 * watched across streaming services?". Peacock is one provider among several and
 * is never treated as preferred here. Account-aware reasoning (e.g. "which of
 * these do I already have?") lives in the Agent, which intersects these results
 * with the separate PeacockService state.
 *
 * All data is fully simulated: no real availability API, brand asset, or deep
 * link is modelled. Methods are async to mirror a real networked API and to keep
 * the shape identical for a future local MCP server that reuses this contract.
 */
export interface DiscoveryService {
  /** Search titles across all providers by title, genre, or keyword. */
  searchAcrossServices(query: string): Promise<TitleAvailability[]>;
  /** Return where a single title can be watched, across providers. */
  getWhereToWatch(contentId: string): Promise<TitleAvailability>;
  /** Provider-neutral recommendations, optionally narrowed by genre. */
  getRecommendations(genre?: string): Promise<TitleAvailability[]>;
}
