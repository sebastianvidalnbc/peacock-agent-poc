/**
 * Minimal conversational memory for the prototype. Tracks just enough context
 * for simple follow-ups (e.g. the last title referenced), without pretending to
 * be a general dialogue manager.
 */
export class ConversationState {
  private lastTitleId: string | null = null;
  private lastIntentKind: string | null = null;
  private awaitingRecommendCriteria = false;
  private lastDiscoveryIds: string[] = [];
  private lastResultIds: string[] = [];

  /**
   * The single title the conversation is currently "about" — the last one named,
   * offered, or selected. Follow-ups that refer to a title by pronoun ("preview
   * it", "add it to my watchlist") resolve against this. `setLastTitle` and
   * `getLastTitle` are the canonical accessors; the "lastReferencedTitle" naming
   * in the brief maps directly onto them.
   */
  setLastTitle(contentId: string | null): void {
    this.lastTitleId = contentId;
  }

  getLastTitle(): string | null {
    return this.lastTitleId;
  }

  /** Alias for getLastTitle(), matching the "lastReferencedTitle" brief naming. */
  getLastReferencedTitle(): string | null {
    return this.lastTitleId;
  }

  /**
   * Remember the titles from the last cross-service discovery result so a
   * follow-up such as "which of these do I already have?" can resolve against
   * them without re-running the search.
   */
  setLastDiscovery(contentIds: string[]): void {
    this.lastDiscoveryIds = [...contentIds];
  }

  getLastDiscovery(): string[] {
    return this.lastDiscoveryIds;
  }

  /**
   * The ordered list of titles most recently shown to the user (search,
   * recommendation, or discovery results). Enables selection follow-ups such as
   * "the second one" (by ordinal) or "Poker Face sounds good" (by name) to pick
   * a single result and promote it to the referenced title.
   */
  setLastResults(contentIds: string[]): void {
    this.lastResultIds = [...contentIds];
  }

  getLastResults(): string[] {
    return this.lastResultIds;
  }

  setLastIntent(kind: string): void {
    this.lastIntentKind = kind;
  }

  getLastIntent(): string | null {
    return this.lastIntentKind;
  }

  /**
   * When true, the previous turn asked the user to narrow a recommendation, so
   * a short reply (e.g. "something funny") should complete that request.
   */
  setAwaitingRecommendCriteria(awaiting: boolean): void {
    this.awaitingRecommendCriteria = awaiting;
  }

  isAwaitingRecommendCriteria(): boolean {
    return this.awaitingRecommendCriteria;
  }

  reset(): void {
    this.lastTitleId = null;
    this.lastIntentKind = null;
    this.awaitingRecommendCriteria = false;
    this.lastDiscoveryIds = [];
    this.lastResultIds = [];
  }
}
