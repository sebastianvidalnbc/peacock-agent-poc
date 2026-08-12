import type { PeacockService } from "../peacock/PeacockService";
import { runTool } from "../tools";
import { routeIntent, detectGenre, type Intent } from "./intent-router";
import { ConversationState } from "./conversation-state";
import { COMMERCE_DISCLAIMER, UNSUPPORTED_MESSAGE } from "./capabilities";
import { resolveTitleByName } from "../data/catalog";
import { PeacockActionUnavailableError, PeacockNotConnectedError } from "../peacock/types";
import type {
  AccountSummary,
  Capability,
  CatalogTitle,
  Entitlements,
  Subscription,
} from "../peacock/types";
import type { AgentResponse, AssistantAction } from "./types";

const ADS: Record<string, string> = {
  ads: "ad-supported streaming",
  fewer_ads: "fewer ads",
  no_ads: "no ads",
};
const PROVIDER: Record<string, string> = { peacock_direct: "Peacock", apple: "Apple" };
const STATUS: Record<string, string> = { active: "active", cancelled: "cancelled", lapsed: "lapsed" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Phase 1 conversational simulator: intent → tool → structured reply. */
export class Agent {
  constructor(
    private service: PeacockService,
    public ctx: ConversationState = new ConversationState(),
    private delayMs = 300,
  ) {}

  async respond(input: string): Promise<AgentResponse> {
    const intent = this.resolveIntent(input);
    this.ctx.setLastIntent(intent.kind);
    if (this.delayMs > 0) await sleep(this.delayMs);
    try {
      return await this.handle(intent, input);
    } catch (e) {
      if (e instanceof PeacockNotConnectedError) return this.connectPrompt(input);
      if (e instanceof PeacockActionUnavailableError) return { text: e.message };
      return { text: `Sorry — the prototype hit an error: ${(e as Error).message}` };
    }
  }

  /**
   * Route the raw text, but first honour a pending recommendation follow-up: if
   * the previous turn asked the user to narrow things down, a short reply such
   * as "something funny" or "comedy" completes that recommendation.
   */
  private resolveIntent(input: string): Intent {
    if (this.ctx.isAwaitingRecommendCriteria()) {
      const genre = detectGenre(input.toLowerCase().trim());
      const routed = routeIntent(input);
      if (genre || routed.kind === "recommend") {
        return { kind: "recommend", criteria: genre || (routed.kind === "recommend" ? routed.criteria : "") };
      }
    }
    return routeIntent(input);
  }

  private connectAction(resumeText?: string): AssistantAction {
    return { id: "connect", kind: "connect", label: "Connect Peacock", resumeText };
  }

  private connectPrompt(resumeText: string): AgentResponse {
    return {
      text: "To do that I need to connect to your Peacock account. This is a simulated connection — I won't ask for a username, password, or payment details.",
      card: { kind: "connect" },
      actions: [this.connectAction(resumeText)],
    };
  }

  private guard(input: string): AgentResponse | null {
    return this.service.isConnected() ? null : this.connectPrompt(input);
  }

  private async handle(intent: Intent, input: string): Promise<AgentResponse> {
    // Any non-recommendation turn ends a pending "what are you in the mood for?".
    if (intent.kind !== "recommend") this.ctx.setAwaitingRecommendCriteria(false);
    switch (intent.kind) {
      case "capabilities": {
        const data = await runTool<Capability[]>(this.service, "get_supported_capabilities");
        const connected = this.service.isConnected();
        return {
          text: connected
            ? "Here's what I can help you with on this account:"
            : "Here's what I can help you with. Connect a demo Peacock account to use the personal actions:",
          card: { kind: "capabilities", data },
          toolName: "get_supported_capabilities",
          actions: connected ? undefined : [this.connectAction()],
        };
      }
      case "get_subscription": {
        const g = this.guard(input);
        if (g) return g;
        const s = await runTool<Subscription>(this.service, "get_subscription");
        const renews = s.status === "active" && s.renewsOn ? `, renewing on ${s.renewsOn}` : "";
        return {
          text: `You're on ${s.plan.name} — ${s.priceLabel}, billed ${s.billingInterval} through ${PROVIDER[s.billingProvider]}. Your subscription is ${STATUS[s.status]}${renews}.`,
          card: { kind: "subscription", data: s },
          toolName: "get_subscription",
        };
      }
      case "get_entitlements": {
        const g = this.guard(input);
        if (g) return g;
        const e = await runTool<Entitlements>(this.service, "get_entitlements");
        return {
          text: `Your ${e.planName} plan includes ${e.downloads ? "downloads for offline viewing" : "no offline downloads"}, ${ADS[e.adsLevel]}, up to ${e.simultaneousStreams} simultaneous streams, and ${e.maxVideoQuality} video.`,
          card: { kind: "entitlements", data: e },
          toolName: "get_entitlements",
        };
      }
      case "get_account": {
        const g = this.guard(input);
        if (g) return g;
        const a = await runTool<AccountSummary>(this.service, "get_account_summary");
        return {
          text: `Here's your account summary, ${a.displayName}.`,
          card: { kind: "account", data: a },
          toolName: "get_account_summary",
        };
      }
      case "get_watchlist": {
        const g = this.guard(input);
        if (g) return g;
        const list = await runTool<CatalogTitle[]>(this.service, "get_watchlist");
        return {
          text: list.length
            ? `You have ${list.length} title${list.length === 1 ? "" : "s"} on your watchlist:`
            : "Your watchlist is empty right now.",
          card: { kind: "watchlist", data: list },
          toolName: "get_watchlist",
        };
      }
      case "add_to_watchlist":
        return this.handleWatchlistWrite(intent.titleQuery, input, true);
      case "remove_from_watchlist":
        return this.handleWatchlistWrite(intent.titleQuery, input, false);
      case "recommend":
        return this.handleRecommend(intent.criteria);
      case "search_catalog":
        return this.handleSearch(intent.query.trim());
      case "commerce_info":
        return { text: `${this.commerceLead(intent.topic)} ${COMMERCE_DISCLAIMER}` };
      case "unknown":
      default:
        return { text: UNSUPPORTED_MESSAGE };
    }
  }

  /**
   * A discovery request. With a genre criterion we search for it; without one we
   * ask a short conversational follow-up and remember that we're waiting for it.
   */
  private async handleRecommend(criteria: string): Promise<AgentResponse> {
    if (!criteria) {
      this.ctx.setAwaitingRecommendCriteria(true);
      return {
        text: "Happy to help you find something. What are you in the mood for — something funny, a drama, action, a thriller, or a mystery?",
      };
    }
    this.ctx.setAwaitingRecommendCriteria(false);
    const data = await runTool<CatalogTitle[]>(this.service, "search_catalog", { query: criteria });
    if (data.length === 1) this.ctx.setLastTitle(data[0].contentId);
    if (!data.length) {
      return {
        text: `I couldn't find any ${criteria} titles in the demo catalog. Want me to show what's available, or try a different mood like comedy or drama?`,
        card: { kind: "search", data: [] },
        toolName: "search_catalog",
      };
    }
    return {
      text: `Here ${data.length === 1 ? "is a" : "are some"} ${criteria} pick${data.length === 1 ? "" : "s"} you might enjoy:`,
      card: { kind: "search", data },
      toolName: "search_catalog",
    };
  }

  /** An explicit catalog lookup by extracted term, with zero-result recovery. */
  private async handleSearch(query: string): Promise<AgentResponse> {
    this.ctx.setAwaitingRecommendCriteria(false);
    const data = await runTool<CatalogTitle[]>(this.service, "search_catalog", { query });
    if (data.length === 1) this.ctx.setLastTitle(data[0].contentId);
    if (!data.length) {
      return {
        text: query
          ? `I couldn't find anything matching "${query}" in the demo catalog. Want me to look for something similar, or browse a genre like comedy or drama?`
          : "I couldn't find a match. Want me to show what's available, or try a genre like comedy or drama?",
        card: { kind: "search", data: [] },
        toolName: "search_catalog",
      };
    }
    return {
      text: query
        ? `Here ${data.length === 1 ? "is a title" : "are some titles"} matching "${query}":`
        : "Here are a few things you might enjoy:",
      card: { kind: "search", data },
      toolName: "search_catalog",
    };
  }

  private commerceLead(topic: "cancel" | "downgrade" | "upgrade" | "ads"): string {
    if (topic === "cancel") return "Cancelling your subscription would be a simulated action.";
    if (topic === "ads") return "Getting fewer ads would mean changing to a higher plan, which is a simulated action.";
    return `A plan ${topic} would be a simulated action.`;
  }

  private async handleWatchlistWrite(titleQuery: string, input: string, add: boolean): Promise<AgentResponse> {
    const g = this.guard(input);
    if (g) return g;
    const title = resolveTitleByName(titleQuery);
    if (!title)
      return { text: `I couldn't find a title called "${titleQuery}" in the demo catalog. Try asking me to find something first.` };
    const before = await runTool<CatalogTitle[]>(this.service, "get_watchlist");
    const present = before.some((t) => t.contentId === title.contentId);
    const tool = add ? "add_to_watchlist" : "remove_from_watchlist";
    const list = await runTool<CatalogTitle[]>(this.service, tool, { contentId: title.contentId });
    this.ctx.setLastTitle(title.contentId);
    const text = add
      ? present
        ? `${title.title} is already on your watchlist.`
        : `Added ${title.title} to your watchlist.`
      : present
        ? `Removed ${title.title} from your watchlist.`
        : `${title.title} wasn't on your watchlist.`;
    return { text, card: { kind: "watchlist", data: list }, toolName: tool };
  }
}
