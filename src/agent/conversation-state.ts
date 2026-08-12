/**
 * Minimal conversational memory for the prototype. Tracks just enough context
 * for simple follow-ups (e.g. the last title referenced), without pretending to
 * be a general dialogue manager.
 */
export class ConversationState {
  private lastTitleId: string | null = null;
  private lastIntentKind: string | null = null;
  private awaitingRecommendCriteria = false;

  setLastTitle(contentId: string | null): void {
    this.lastTitleId = contentId;
  }

  getLastTitle(): string | null {
    return this.lastTitleId;
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
  }
}
