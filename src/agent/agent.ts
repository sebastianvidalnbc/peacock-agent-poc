import type { PeacockService } from "../peacock/PeacockService";
import type { DiscoveryService } from "../discovery/DiscoveryService";
import { mockDiscoveryService } from "../discovery/MockDiscoveryService";
import { runTool, type ServiceContext } from "../tools";
import { routeIntent, detectGenre, type Intent } from "./intent-router";
import { ConversationState } from "./conversation-state";
import {
  COMMERCE_CLARIFY_MESSAGE,
  COMMERCE_PROHIBITED_MESSAGE,
  PLANS_INFO_URL,
  UNSUPPORTED_MESSAGE,
} from "./capabilities";
import { resolveTitleByName, providerLabel, findTitleById, type KnownProvider } from "../data/catalog";
import { PeacockActionUnavailableError, PeacockNotConnectedError } from "../peacock/types";
import type {
  AccountSummary,
  Capability,
  CatalogTitle,
  Entitlements,
  NextEpisode,
  PlaybackDestination,
  PreviewInfo,
  Subscription,
  TitleAvailability,
  ViewingProgress,
} from "../peacock/types";
import { POLICY_MAP, type PolicyCapabilityId, type PolicyStatus } from "../policy/policy";
import { accessLabelFor } from "../tools/access";
import type { AccessInfo, AgentResponse, AssistantAction, DebugTrace, DiscoveryRow } from "./types";

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
  private discovery: DiscoveryService;

  constructor(
    private service: PeacockService,
    public ctx: ConversationState = new ConversationState(),
    private delayMs = 300,
    discovery: DiscoveryService = mockDiscoveryService,
  ) {
    this.discovery = discovery;
  }

  /**
   * The full backend context passed to the tool layer. Peacock tools run against
   * the account-aware service; discovery tools against the provider-neutral one.
   */
  private get svc(): ServiceContext {
    return { peacock: this.service, discovery: this.discovery };
  }

  async respond(input: string): Promise<AgentResponse> {
    const intent = this.resolveIntent(input);
    this.ctx.setLastIntent(intent.kind);
    if (this.delayMs > 0) await sleep(this.delayMs);
    try {
      const res = await this.handle(intent, input);
      return this.withAccess({ ...res, debug: this.traceFor(intent, res) });
    } catch (e) {
      if (e instanceof PeacockNotConnectedError) return this.withAccess(this.connectPrompt(input));
      if (e instanceof PeacockActionUnavailableError) return this.withAccess({ text: e.message });
      return this.withAccess({ text: `Sorry — the prototype hit an error: ${(e as Error).message}` });
    }
  }

  /**
   * The Access Inspector descriptor for the current connection state. "Guest"
   * is simply the absence of a connected Peacock persona (no OAuth) — never a
   * silently-created account.
   */
  private get access(): AccessInfo {
    return accessLabelFor(this.service.isConnected());
  }

  /** Stamp the current access descriptor onto a response (client-side chrome). */
  private withAccess(res: AgentResponse): AgentResponse {
    return { access: this.access, ...res };
  }

  /**
   * Build the debug-only routing trace for a turn: the resolved intent, the
   * extracted title and provider entities (when the intent carries them), and
   * the tool the handler ran. Consumed only by the intent inspector when debug
   * mode is on; it never affects user-facing copy.
   */
  private traceFor(intent: Intent, res: AgentResponse): DebugTrace {
    const trace: DebugTrace = { intent: intent.kind };
    const contentId =
      "contentId" in intent && intent.contentId
        ? intent.contentId
        : this.ctx.getLastTitle() ?? undefined;
    if (contentId) trace.title = findTitleById(contentId)?.title ?? contentId;
    if ("provider" in intent && intent.provider) trace.provider = providerLabel(intent.provider);
    if (res.toolName) trace.tool = res.toolName;
    return trace;
  }

  /**
   * Directly request the Peacock playback handoff for a specific title, used by
   * the "Open in Peacock" action button. Requires a connection; when
   * disconnected it returns the connect prompt with a resume that re-opens this
   * title after authorization.
   */
  async openTitle(contentId: string): Promise<AgentResponse> {
    if (this.delayMs > 0) await sleep(this.delayMs);
    try {
      const title = await runTool<CatalogTitle>(this.service, "get_title_details", { contentId });
      this.ctx.setLastTitle(title.contentId);
      return this.withAccess(await this.handleOpenInPeacock(contentId, `Open ${title.title} in Peacock`));
    } catch (e) {
      if (e instanceof PeacockNotConnectedError)
        return this.withAccess(this.connectPrompt(`Open ${contentId} in Peacock`));
      if (e instanceof PeacockActionUnavailableError) return this.withAccess({ text: e.message });
      return this.withAccess({ text: `Sorry — the prototype hit an error: ${(e as Error).message}` });
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

  private previewAction(contentId: string): AssistantAction {
    return { id: "preview", kind: "preview", label: "Watch a preview", contentId };
  }

  private openAction(contentId: string, label: string): AssistantAction {
    return { id: "open", kind: "open", label, contentId };
  }

  /** A "resume from where you left off" action (maps to playback in the app). */
  private resumeAction(contentId: string, label: string): AssistantAction {
    return { id: "resume", kind: "resume", label, contentId };
  }

  /**
   * Policy metadata for a turn, looked up from the single POLICY_MAP source of
   * truth. Spread onto an AgentResponse so the Policy Inspector can badge it.
   * Client-side chrome only — never part of tool output.
   */
  private policy(id: PolicyCapabilityId): { policy: PolicyStatus; policySource: string } {
    const entry = POLICY_MAP[id];
    return { policy: entry.status, policySource: entry.source };
  }

  private connectPrompt(resumeText: string): AgentResponse {
    return {
      text: "To do that I need to connect to your Peacock account. This is a simulated connection — I won't ask for a username, password, or payment details.",
      card: { kind: "connect" },
      actions: [this.connectAction(resumeText)],
    };
  }

  /**
   * A Guest tried a personal write (save to My Stuff). Prompt to connect with
   * write-specific copy and preserve the original intent so it auto-resumes
   * after the simulated authorization.
   */
  private connectToSavePrompt(resumeText: string): AgentResponse {
    return {
      text: "Connect Peacock to save this to My Stuff.",
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
      case "watch_title":
        return this.handleWatchTitle(intent.contentId);
      case "title_availability":
        return this.handleTitleAvailability(intent.contentId);
      case "provider_availability":
        return this.handleProviderAvailability(intent.contentId, intent.provider);
      case "where_to_watch":
        return this.handleWhereToWatch(intent.contentId);
      case "discover":
        return this.handleDiscover(intent.query.trim());
      case "which_do_i_have":
        return this.handleWhichDoIHave();
      case "preview_title":
        return this.handlePreviewTitle(intent.contentId);
      case "open_in_peacock":
        return this.handleOpenInPeacock(intent.contentId, input);
      case "title_details":
        return this.handleTitleDetails(intent.contentId);
      case "recommend":
        return this.handleRecommend(intent.criteria);
      case "search_catalog":
        return this.handleSearch(intent.query.trim());
      case "commerce_prohibited":
        return this.handleCommerceProhibited(intent.topic);
      case "commerce_clarify":
        return this.handleCommerceClarify(intent.topic);
      case "plan_gap":
        return this.handlePlanGap(intent.benefit, input);
      case "viewing_history":
        return this.handleViewingHistory(input);
      case "continue_watching":
        return this.handleContinueWatching(input);
      case "resume_last":
        return this.handleResumeLast(input);
      case "resume_title":
        return this.handleResumeTitle(intent.contentId, input);
      case "next_episode":
        return this.handleNextEpisode(intent.contentId, input);
      case "unfinished":
        return this.handleUnfinished(input);
      case "needs_title_clarification":
        return {
          text: "Which show or movie do you mean? Tell me the title and I'll check where you can watch it.",
        };
      case "unknown":
      default:
        return { text: UNSUPPORTED_MESSAGE };
    }
  }

  /**
   * A discovery request. With a genre criterion we recommend across services;
   * without one we ask a short conversational follow-up and remember that we're
   * waiting for it. Recommendations are provider-neutral by default — they span
   * every simulated service and only highlight Peacock rows the connected
   * account already covers.
   */
  private async handleRecommend(criteria: string): Promise<AgentResponse> {
    if (!criteria) {
      this.ctx.setAwaitingRecommendCriteria(true);
      return {
        text: "Happy to help you find something. What are you in the mood for — something funny, a drama, action, a thriller, or a mystery?",
      };
    }
    this.ctx.setAwaitingRecommendCriteria(false);
    const data = await runTool<TitleAvailability[]>(this.svc, "get_recommendations", { genre: criteria });
    this.ctx.setLastDiscovery(data.map((t) => t.contentId));
    if (data.length === 1) this.ctx.setLastTitle(data[0].contentId);
    const connected = this.service.isConnected();
    if (!data.length) {
      return {
        text: `I couldn't find any ${criteria} titles across the simulated services. Want to try a different mood like comedy or drama?`,
        card: { kind: "discovery", rows: [], connected },
        toolName: "get_recommendations",
      };
    }
    const rows = data.map((t) => this.toRow(t));
    const ownedCount = rows.filter((r) => r.ownedOnPeacock).length;
    const tail = connected && ownedCount
      ? ` ${ownedCount} of ${ownedCount === 1 ? "them is" : "these are"} on Peacock, which your account already covers.`
      : "";
    return {
      text: `Here ${data.length === 1 ? "is a" : "are some"} ${criteria} pick${data.length === 1 ? "" : "s"} across services you might enjoy:${tail}`,
      card: { kind: "discovery", rows, connected },
      toolName: "get_recommendations",
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

  /**
   * RED — a prohibited commerce request (upgrade, new subscription,
   * reactivation, display-plans, checkout). The assistant refuses with an
   * explanation and offers only read-only alternatives. It calls no service
   * method, so no state can change. Tagged RED for the Policy Inspector.
   */
  private handleCommerceProhibited(
    topic: "upgrade" | "new_subscription" | "reactivation" | "display_plans" | "checkout",
  ): AgentResponse {
    const capabilityByTopic: Record<typeof topic, PolicyCapabilityId> = {
      upgrade: "upgrade",
      new_subscription: "new_subscription",
      reactivation: "reactivation",
      display_plans: "display_plans",
      checkout: "digital_checkout",
    };
    return {
      text: COMMERCE_PROHIBITED_MESSAGE[topic],
      ...this.policy(capabilityByTopic[topic]),
    };
  }

  /**
   * YELLOW — a subscription-management action (cancel / downgrade / pause) that
   * current OpenAI guidance does not resolve. The assistant explains the
   * clarification gap and does not action it. No service call, no mutation.
   * Tagged YELLOW for the Policy Inspector.
   */
  private handleCommerceClarify(topic: "cancel" | "downgrade" | "pause"): AgentResponse {
    return {
      text: COMMERCE_CLARIFY_MESSAGE[topic],
      ...this.policy(topic),
    };
  }

  /**
   * GREEN — an entitlement-gap explanation. The user asks about a benefit their
   * plan lacks; the assistant reads (read-only) entitlements, explains whether
   * the current plan already includes it or a higher plan would, and offers an
   * informational plans link. It never starts a checkout or displays plans for
   * selection. Requires a connection to read the account's entitlements.
   */
  private async handlePlanGap(
    benefit: "ads" | "downloads" | "quality" | "streams",
    input: string,
  ): Promise<AgentResponse> {
    const g = this.guard(input);
    if (g) return g;
    const e = await runTool<Entitlements>(this.service, "get_entitlements");
    const has = this.entitlementCovers(benefit, e);
    const lead = has
      ? this.planGapAlreadyHave(benefit, e)
      : this.planGapMissing(benefit);
    // The plans link is informational only — never a checkout or selection UI.
    const actions: AssistantAction[] = has
      ? []
      : [{ id: "plans_info", kind: "plans_info", label: "Learn about Peacock plans", resumeText: PLANS_INFO_URL }];
    return {
      text: lead,
      card: { kind: "entitlements", data: e },
      toolName: "get_entitlements",
      actions: actions.length ? actions : undefined,
      ...this.policy("entitlement_gap"),
    };
  }

  /** Whether the current entitlements already cover the asked-about benefit. */
  private entitlementCovers(
    benefit: "ads" | "downloads" | "quality" | "streams",
    e: Entitlements,
  ): boolean {
    switch (benefit) {
      case "ads":
        return e.adsLevel === "no_ads";
      case "downloads":
        return e.downloads;
      case "quality":
        return e.maxVideoQuality === "4K";
      case "streams":
        return e.simultaneousStreams >= 3;
    }
  }

  /** GREEN copy when the account already has the benefit. */
  private planGapAlreadyHave(
    benefit: "ads" | "downloads" | "quality" | "streams",
    e: Entitlements,
  ): string {
    switch (benefit) {
      case "ads":
        return `Good news — your ${e.planName} plan already streams with no ads.`;
      case "downloads":
        return `Your ${e.planName} plan already includes downloads for offline viewing.`;
      case "quality":
        return `Your ${e.planName} plan already supports up to 4K video.`;
      case "streams":
        return `Your ${e.planName} plan already supports ${e.simultaneousStreams} simultaneous streams.`;
    }
  }

  /**
   * GREEN copy when the benefit is missing. Explains that a higher plan
   * includes it, conservatively (no specific tier name, no price, no plan
   * comparison), and defers any change to Peacock. No checkout is offered.
   */
  private planGapMissing(benefit: "ads" | "downloads" | "quality" | "streams"): string {
    const what: Record<typeof benefit, string> = {
      ads: "ad-free streaming",
      downloads: "downloads for offline viewing",
      quality: "4K video",
      streams: "more simultaneous streams",
    };
    return `Your current plan doesn't include ${what[benefit]} — a higher Peacock plan does. I can't change plans or take payment from here, but you can review the options and upgrade directly in Peacock.`;
  }

  private async handleWatchlistWrite(titleQuery: string, input: string, add: boolean): Promise<AgentResponse> {
    // A Guest cannot mutate My Stuff. For an add, use the write-specific
    // "save to My Stuff" prompt; either way the original intent is preserved
    // and auto-resumes after the simulated connection.
    if (!this.service.isConnected())
      return add ? this.connectToSavePrompt(input) : this.connectPrompt(input);
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

  /**
   * Resolve the title a follow-up refers to: an explicitly named contentId when
   * present, otherwise the last title referenced in the conversation.
   */
  private resolveContextTitle(contentId?: string): string | null {
    return contentId ?? this.ctx.getLastTitle();
  }

  /**
   * "I want to watch X" — present a discovery offer for the title. Shows Peacock
   * availability and offers a preview plus a connect-or-open call to action. No
   * connection is required just to see the offer.
   */
  private async handleWatchTitle(contentId: string): Promise<AgentResponse> {
    const title = await runTool<CatalogTitle>(this.service, "get_title_details", { contentId });
    this.ctx.setLastTitle(title.contentId);
    if (!title.availableOnPeacock) {
      return {
        text: `${title.title} isn't available on Peacock in this demo.`,
        card: { kind: "title", data: title },
        toolName: "get_title_details",
      };
    }
    const preview = title.previewAvailable
      ? await runTool<PreviewInfo>(this.service, "get_preview", { contentId })
      : undefined;
    const connected = this.service.isConnected();
    const actions: AssistantAction[] = [];
    if (preview?.previewAvailable) actions.push(this.previewAction(title.contentId));
    if (connected) actions.push(this.openAction(title.contentId, "Open in Peacock"));
    else actions.push(this.connectAction(`Open ${title.title} in Peacock`));
    return {
      text: connected
        ? `${title.title} is available on Peacock. You can watch a preview here, or open it in Peacock to start watching.`
        : `${title.title} is available on Peacock. You can watch a preview right here. To start watching, I'll connect your Peacock account first.`,
      card: { kind: "title_offer", data: title, preview },
      actions,
      toolName: "get_title_details",
    };
  }

  /** "Is X on Peacock?" — Peacock-specific availability for a title. Resolves
   * the title from context when the request refers to it by pronoun. */
  private async handleTitleAvailability(contentId?: string): Promise<AgentResponse> {
    const id = this.resolveContextTitle(contentId);
    if (!id)
      return { text: "Which title do you want to check on Peacock? Tell me the name and I'll look it up." };
    const title = await runTool<CatalogTitle>(this.service, "get_title_details", { contentId: id });
    this.ctx.setLastTitle(title.contentId);
    if (!title.availableOnPeacock) {
      return {
        text: `${title.title} isn't available on Peacock in this demo.`,
        card: { kind: "title", data: title },
        toolName: "get_title_details",
      };
    }
    const preview = title.previewAvailable
      ? await runTool<PreviewInfo>(this.service, "get_preview", { contentId: id })
      : undefined;
    const connected = this.service.isConnected();
    const actions: AssistantAction[] = [];
    if (preview?.previewAvailable) actions.push(this.previewAction(title.contentId));
    if (connected) actions.push(this.openAction(title.contentId, "Open in Peacock"));
    else actions.push(this.connectAction(`Open ${title.title} in Peacock`));
    return {
      text: `Yes — ${title.title} is available on Peacock.`,
      card: { kind: "title_offer", data: title, preview },
      actions,
      toolName: "get_title_details",
    };
  }

  /**
   * "Is X on <provider>?" for a non-Peacock provider — a neutral, cross-service
   * answer. We look up where the title streams and report whether that specific
   * provider carries it, pointing to the other services it's on when it doesn't.
   * The richer Peacock preview/connect card is deliberately reserved for the
   * Peacock-specific path; here every provider (Peacock included, if it appears
   * among the rows) is shown as one neutral option. Resolves the title from
   * context when referred to by pronoun.
   */
  private async handleProviderAvailability(
    contentId: string | undefined,
    provider: KnownProvider,
  ): Promise<AgentResponse> {
    const label = providerLabel(provider);
    const id = this.resolveContextTitle(contentId);
    if (!id)
      return { text: `Which title do you want to check on ${label}? Tell me the name and I'll look it up.` };
    const title = await runTool<TitleAvailability>(this.svc, "get_where_to_watch", { contentId: id });
    this.ctx.setLastTitle(title.contentId);
    this.ctx.setLastDiscovery([title.contentId]);
    const connected = this.service.isConnected();
    const owned = this.ownedOnPeacock(title);
    const onProvider = title.availability.some((a) => a.provider === provider);
    const others = title.availability.filter((a) => a.provider !== provider);
    let text: string;
    if (onProvider) {
      text = `Yes — ${title.title} is available on ${label} in this demo.`;
    } else if (others.length) {
      const names = Array.from(new Set(others.map((a) => providerLabel(a.provider))));
      text = `${title.title} isn't on ${label} in this demo, but you can watch it on ${names.join(", ")}.`;
    } else {
      text = `I couldn't find ${title.title} on ${label} — or any service — in this demo.`;
    }
    return {
      text,
      card: { kind: "where_to_watch", data: title, ownedOnPeacock: owned, connected },
      toolName: "get_where_to_watch",
    };
  }

  /**
   * True when a title carries a Peacock availability row. This is a purely
   * provider-neutral fact about the title (does Peacock offer it?), independent
   * of whether the user is connected.
   */
  private isOnPeacock(title: TitleAvailability): boolean {
    return title.availability.some((a) => a.provider === "peacock");
  }

  /**
   * "Which of these do I already have?" is the only place ownership is inferred,
   * and only for Peacock: a title counts as owned when the account is connected
   * AND Peacock offers the title. Other providers are never treated as owned.
   */
  private ownedOnPeacock(title: TitleAvailability): boolean {
    return this.service.isConnected() && this.isOnPeacock(title);
  }

  private toRow(title: TitleAvailability): DiscoveryRow {
    return { title, ownedOnPeacock: this.ownedOnPeacock(title) };
  }

  /**
   * "Where can I watch X?" — provider-neutral, cross-service availability for a
   * single title. Peacock is one provider among several; it is only highlighted
   * as already-covered when the account is connected. Resolves the title from
   * context when the request refers to it by pronoun.
   */
  private async handleWhereToWatch(contentId?: string): Promise<AgentResponse> {
    const id = this.resolveContextTitle(contentId);
    if (!id)
      return { text: "Which title do you want to find? Tell me the name and I'll show where it's streaming." };
    const title = await runTool<TitleAvailability>(this.svc, "get_where_to_watch", { contentId: id });
    this.ctx.setLastTitle(title.contentId);
    this.ctx.setLastDiscovery([title.contentId]);
    const connected = this.service.isConnected();
    const owned = this.ownedOnPeacock(title);
    if (!title.availability.length) {
      return {
        text: `I couldn't find where ${title.title} is streaming in this demo.`,
        card: { kind: "title", data: title },
        toolName: "get_where_to_watch",
      };
    }
    const count = title.availability.length;
    const lead = owned
      ? `${title.title} is available on ${count} service${count === 1 ? "" : "s"}, including Peacock — which your connected account already covers.`
      : this.isOnPeacock(title) && connected
        ? `${title.title} is available on ${count} service${count === 1 ? "" : "s"}, including Peacock.`
        : `${title.title} is available on ${count} service${count === 1 ? "" : "s"} in this demo.`;
    return {
      text: lead,
      card: { kind: "where_to_watch", data: title, ownedOnPeacock: owned, connected },
      toolName: "get_where_to_watch",
    };
  }

  /**
   * "Find X across services" — provider-neutral discovery search. Returns
   * several titles each with cross-service availability, and remembers the
   * result so a follow-up ("which of these do I already have?") can resolve
   * against it.
   */
  private async handleDiscover(query: string): Promise<AgentResponse> {
    const data = await runTool<TitleAvailability[]>(this.svc, "search_across_services", { query });
    this.ctx.setLastDiscovery(data.map((t) => t.contentId));
    if (data.length === 1) this.ctx.setLastTitle(data[0].contentId);
    const connected = this.service.isConnected();
    if (!data.length) {
      return {
        text: query
          ? `I couldn't find anything matching "${query}" across the simulated services. Want to try a different title or genre?`
          : "I couldn't find a match across the simulated services. Want to try a title or genre?",
        card: { kind: "discovery", rows: [], connected },
        toolName: "search_across_services",
      };
    }
    const rows = data.map((t) => this.toRow(t));
    const ownedCount = rows.filter((r) => r.ownedOnPeacock).length;
    const tail = connected && ownedCount
      ? ` ${ownedCount} of ${ownedCount === 1 ? "them is" : "these are"} on Peacock, which your account already covers.`
      : "";
    return {
      text: query
        ? `Here ${data.length === 1 ? "is a title" : "are some titles"} matching "${query}" across services:${tail}`
        : `Here are some titles across services:${tail}`,
      card: { kind: "discovery", rows, connected },
      toolName: "search_across_services",
    };
  }

  /**
   * "Which of these do I already have?" — a follow-up on the last discovery
   * result. Intersects those titles with the connected Peacock account. When
   * disconnected, there's nothing to intersect, so we prompt to connect.
   */
  private async handleWhichDoIHave(): Promise<AgentResponse> {
    const ids = this.ctx.getLastDiscovery();
    if (!ids.length)
      return { text: "Search for something first and I'll tell you which of the results your account already covers." };
    const connected = this.service.isConnected();
    const titles = await Promise.all(
      ids.map((id) => runTool<TitleAvailability>(this.svc, "get_where_to_watch", { contentId: id })),
    );
    const rows = titles.map((t) => this.toRow(t));
    if (!connected) {
      return {
        text: "I can only tell which titles your account already covers once your Peacock account is connected. This is a simulated connection — no username, password, or payment details.",
        card: { kind: "discovery", rows, connected },
        actions: [this.connectAction("which of these do I already have?")],
      };
    }
    const owned = rows.filter((r) => r.ownedOnPeacock);
    const names = owned.map((r) => r.title.title);
    const text = owned.length
      ? owned.length === rows.length
        ? "Good news — your Peacock account already covers all of these."
        : `Your Peacock account already covers ${owned.length} of these: ${names.join(", ")}.`
      : "None of these are on Peacock in this demo — they're all on other services.";
    return {
      text,
      card: { kind: "discovery", rows, connected },
    };
  }

  /** "Preview X" / "Can I preview it?" — show the title offer with the preview. */
  private async handlePreviewTitle(contentId?: string): Promise<AgentResponse> {
    const id = this.resolveContextTitle(contentId);
    if (!id)
      return { text: "Which title would you like to preview? Tell me the name and I'll pull it up." };
    const title = await runTool<CatalogTitle>(this.service, "get_title_details", { contentId: id });
    this.ctx.setLastTitle(title.contentId);
    const preview = await runTool<PreviewInfo>(this.service, "get_preview", { contentId: id });
    if (!preview.previewAvailable) {
      return {
        text: `There's no preview available for ${title.title} in this demo.`,
        card: { kind: "title", data: title },
        toolName: "get_preview",
      };
    }
    const connected = this.service.isConnected();
    const actions: AssistantAction[] = [this.previewAction(title.contentId)];
    if (connected) actions.push(this.openAction(title.contentId, "Open in Peacock"));
    else actions.push(this.connectAction(`Open ${title.title} in Peacock`));
    return {
      text: `Here's a preview of ${title.title}. Press play to watch the clip.`,
      card: { kind: "title_offer", data: title, preview },
      actions,
      toolName: "get_preview",
    };
  }

  /**
   * "Open X in Peacock" — the personal playback handoff. Requires a connection;
   * when disconnected, prompt to connect and resume this exact request after.
   */
  private async handleOpenInPeacock(contentId: string | undefined, input: string): Promise<AgentResponse> {
    const id = this.resolveContextTitle(contentId);
    if (!id)
      return { text: "Which title would you like to open in Peacock? Tell me the name and I'll set it up." };
    const title = await runTool<CatalogTitle>(this.service, "get_title_details", { contentId: id });
    this.ctx.setLastTitle(title.contentId);
    if (!this.service.isConnected())
      return this.connectPrompt(input);
    const destination = await runTool<PlaybackDestination>(this.service, "get_playback_destination", {
      contentId: id,
    });
    return {
      text: `Opening ${title.title} in Peacock. This is a simulated handoff — in a real integration this would launch Peacock playback.`,
      card: { kind: "handoff", data: title, destination },
      toolName: "get_playback_destination",
    };
  }

  /** "Tell me more about X" / "…about it" — full title details. */
  private async handleTitleDetails(contentId?: string): Promise<AgentResponse> {
    const id = this.resolveContextTitle(contentId);
    if (!id)
      return { text: "Which title would you like to know more about? Tell me the name and I'll look it up." };
    const title = await runTool<CatalogTitle>(this.service, "get_title_details", { contentId: id });
    this.ctx.setLastTitle(title.contentId);
    return {
      text: `Here's more about ${title.title}.`,
      card: { kind: "title", data: title },
      toolName: "get_title_details",
    };
  }

  // --- Continue Watching / resume / viewing history (GREEN account reads) ---

  /** Format a title's resume position as a short "X min left" phrase. */
  private remainingLabel(v: ViewingProgress): string {
    const remaining = Math.max(0, v.durationSeconds - v.progressSeconds);
    const mins = Math.round(remaining / 60);
    if (v.completed) return "finished";
    return mins <= 1 ? "about a minute left" : `about ${mins} min left`;
  }

  /** A compact "S2 E6" episode tag when the item is an episode. */
  private episodeTag(v: ViewingProgress): string {
    if (v.seasonNumber != null && v.episodeNumber != null) {
      const ep = v.episodeTitle ? ` "${v.episodeTitle}"` : "";
      return ` (S${v.seasonNumber} E${v.episodeNumber}${ep})`;
    }
    return "";
  }

  /** Build a Continue Watching card + resume action for a set of items. */
  private async continueWatchingCard(
    items: ViewingProgress[],
    text: string,
    nextEpisode?: NextEpisode,
  ): Promise<AgentResponse> {
    const anchor = items[0];
    const title = await runTool<CatalogTitle>(this.service, "get_title_details", { contentId: anchor.contentId });
    this.ctx.setLastTitle(anchor.contentId);
    return {
      text,
      card: { kind: "continue_watching", items, title, nextEpisode },
      actions: [this.resumeAction(anchor.contentId, `Resume ${anchor.title}`)],
      toolName: "get_continue_watching",
      ...this.policy("continue_watching"),
    };
  }

  /** "What was I watching?" — viewing history (in-progress and completed). */
  private async handleViewingHistory(input: string): Promise<AgentResponse> {
    const g = this.guard(input);
    if (g) return g;
    const items = await runTool<ViewingProgress[]>(this.service, "get_viewing_history");
    if (!items.length)
      return { text: "You don't have any viewing history on this demo account yet.", ...this.policy("viewing_history") };
    const lines = items
      .map((v) => `• ${v.title}${this.episodeTag(v)} — ${this.remainingLabel(v)}`)
      .join("\n");
    return {
      text: `Here's what you've been watching:\n${lines}`,
      card: { kind: "continue_watching", items, title: await runTool<CatalogTitle>(this.service, "get_title_details", { contentId: items[0].contentId }) },
      toolName: "get_viewing_history",
      actions: [this.resumeAction(items[0].contentId, `Resume ${items[0].title}`)],
      ...this.policy("viewing_history"),
    };
  }

  /** "Show my Continue Watching" — the in-progress rail. */
  private async handleContinueWatching(input: string): Promise<AgentResponse> {
    const g = this.guard(input);
    if (g) return g;
    const items = await runTool<ViewingProgress[]>(this.service, "get_continue_watching");
    if (!items.length)
      return { text: "You don't have anything in progress right now. Want a recommendation?", ...this.policy("continue_watching") };
    const names = items.map((v) => v.title).join(", ");
    return this.continueWatchingCard(items, `Here's your Continue Watching: ${names}.`);
  }

  /** "Resume my last show" — the single most recent in-progress title. */
  private async handleResumeLast(input: string): Promise<AgentResponse> {
    const g = this.guard(input);
    if (g) return g;
    const items = await runTool<ViewingProgress[]>(this.service, "get_continue_watching");
    if (!items.length)
      return { text: "You don't have anything in progress to resume right now.", ...this.policy("continue_watching") };
    const last = items[0];
    return this.continueWatchingCard(
      [last],
      `Picking up ${last.title}${this.episodeTag(last)} — ${this.remainingLabel(last)}.`,
    );
  }

  /** "Continue X" / "Where did I leave off in X?" — resume a specific title. */
  private async handleResumeTitle(contentId: string | undefined, input: string): Promise<AgentResponse> {
    const g = this.guard(input);
    if (g) return g;
    const id = this.resolveContextTitle(contentId);
    if (!id)
      return { text: "Which show would you like to resume? Tell me the title and I'll pick up where you left off." };
    const pos = await runTool<ViewingProgress | null>(this.service, "get_resume_position", { contentId: id });
    if (!pos) {
      const title = await runTool<CatalogTitle>(this.service, "get_title_details", { contentId: id });
      this.ctx.setLastTitle(id);
      return {
        text: `You don't have a saved position for ${title.title} — you can start it from the beginning.`,
        card: { kind: "title", data: title },
        toolName: "get_resume_position",
        ...this.policy("continue_watching"),
      };
    }
    return this.continueWatchingCard(
      [pos],
      `Resuming ${pos.title}${this.episodeTag(pos)} — ${this.remainingLabel(pos)}.`,
    );
  }

  /** "What's next in X?" — next-episode lookup for a series. */
  private async handleNextEpisode(contentId: string | undefined, input: string): Promise<AgentResponse> {
    const g = this.guard(input);
    if (g) return g;
    const id = this.resolveContextTitle(contentId);
    if (!id)
      return { text: "Which series do you mean? Tell me the title and I'll tell you what's next." };
    const next = await runTool<NextEpisode | null>(this.service, "get_next_episode", { contentId: id });
    const title = await runTool<CatalogTitle>(this.service, "get_title_details", { contentId: id });
    this.ctx.setLastTitle(id);
    if (!next || !next.hasNext) {
      return {
        text: `There's no next episode of ${title.title} in this demo — you're all caught up.`,
        card: { kind: "title", data: title },
        toolName: "get_next_episode",
        ...this.policy("continue_watching"),
      };
    }
    const pos = await runTool<ViewingProgress | null>(this.service, "get_resume_position", { contentId: id });
    const items = pos ? [pos] : [];
    const text = `Next up in ${next.title} is S${next.seasonNumber} E${next.episodeNumber} "${next.episodeTitle}".`;
    if (!items.length) {
      return {
        text,
        card: { kind: "title", data: title },
        toolName: "get_next_episode",
        ...this.policy("continue_watching"),
      };
    }
    return this.continueWatchingCard(items, text, next);
  }

  /** "Show me things I haven't finished" — the unfinished (in-progress) subset. */
  private async handleUnfinished(input: string): Promise<AgentResponse> {
    const g = this.guard(input);
    if (g) return g;
    const items = await runTool<ViewingProgress[]>(this.service, "get_continue_watching");
    if (!items.length)
      return { text: "You've finished everything you've started — nice. Want a recommendation for something new?", ...this.policy("continue_watching") };
    const names = items.map((v) => `${v.title} (${this.remainingLabel(v)})`).join(", ");
    return this.continueWatchingCard(items, `Here's what you haven't finished yet: ${names}.`);
  }
}
