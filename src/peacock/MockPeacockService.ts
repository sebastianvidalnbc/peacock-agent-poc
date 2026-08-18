import type { PeacockService } from "./PeacockService";
import {
  PeacockNotConnectedError,
  type AccountSummary,
  type ActionResult,
  type CancellationPreview,
  type Capability,
  type CatalogTitle,
  type TitleAvailability,
  type Entitlements,
  type NextEpisode,
  type PlanChangePreview,
  type PlaybackDestination,
  type PreviewInfo,
  type Subscription,
  type ViewingProgress,
} from "./types";
import { PolicyClarificationRequiredError, PolicyProhibitedError } from "../policy/policy";
import { getPersonaFixture } from "../data/personas";
import { getPlan } from "../data/plans";
import {
  findTitleById,
  getNextEpisodeData,
  getPlaybackData,
  getPreviewData,
  searchCatalogData,
} from "../data/catalog";
import { prototypeStore } from "../state/prototype-store";

type Store = typeof prototypeStore;

/** In-memory Peacock behaviour backed by fixtures + the prototype store. */
export class MockPeacockService implements PeacockService {
  constructor(private store: Store = prototypeStore) {}

  isConnected(): boolean {
    return this.store.getConnectedPersonaId() !== null;
  }

  getConnectedPersonaId(): string | null {
    return this.store.getConnectedPersonaId();
  }

  private requirePersona(): string {
    const id = this.store.getConnectedPersonaId();
    if (!id) throw new PeacockNotConnectedError();
    return id;
  }

  private futureDate(interval: "monthly" | "annual"): string {
    const d = new Date();
    if (interval === "annual") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  }

  async getAccountSummary(): Promise<AccountSummary> {
    const id = this.requirePersona();
    const f = getPersonaFixture(id);
    const o = this.store.getOverlay(id);
    return {
      personaId: f.id,
      displayName: f.displayName,
      email: f.email,
      memberSince: f.memberSince,
      status: o.status,
      planName: getPlan(o.planId).name,
      billingProvider: f.billingProvider,
    };
  }

  async getSubscription(): Promise<Subscription> {
    const id = this.requirePersona();
    const f = getPersonaFixture(id);
    const o = this.store.getOverlay(id);
    const plan = getPlan(o.planId);
    const active = o.status === "active";
    const priceLabel =
      o.billingInterval === "annual" && plan.priceAnnual != null
        ? `$${plan.priceAnnual.toFixed(2)}/yr`
        : `$${plan.priceMonthly.toFixed(2)}/mo`;
    return {
      status: o.status,
      plan,
      billingProvider: f.billingProvider,
      billingInterval: o.billingInterval,
      renewsOn: active ? this.futureDate(o.billingInterval) : null,
      managedExternally: f.billingProvider === "apple",
      priceLabel,
    };
  }

  async getEntitlements(): Promise<Entitlements> {
    const id = this.requirePersona();
    const plan = getPlan(this.store.getOverlay(id).planId);
    const top = plan.tier === "top";
    return {
      planName: plan.name,
      downloads: plan.downloads,
      adsLevel: plan.adsLevel,
      simultaneousStreams: top ? 3 : 2,
      maxVideoQuality: top ? "4K" : "1080p",
      offlineDevices: plan.downloads ? 2 : 0,
    };
  }

  async getWatchlist(): Promise<CatalogTitle[]> {
    const id = this.requirePersona();
    return this.store
      .getOverlay(id)
      .watchlist.map((cid) => findTitleById(cid))
      .filter((t): t is TitleAvailability => Boolean(t));
  }

  async addToWatchlist(contentId: string): Promise<CatalogTitle[]> {
    const id = this.requirePersona();
    if (!findTitleById(contentId)) throw new Error(`Unknown title: ${contentId}`);
    const current = this.store.getOverlay(id).watchlist;
    if (!current.includes(contentId)) this.store.setWatchlist(id, [...current, contentId]);
    return this.getWatchlist();
  }

  async removeFromWatchlist(contentId: string): Promise<CatalogTitle[]> {
    const id = this.requirePersona();
    const current = this.store.getOverlay(id).watchlist;
    this.store.setWatchlist(id, current.filter((c) => c !== contentId));
    return this.getWatchlist();
  }

  async getSupportedCapabilities(): Promise<Capability[]> {
    const id = this.store.getConnectedPersonaId();
    const f = id ? getPersonaFixture(id) : null;
    const o = id ? this.store.getOverlay(id) : null;
    const external = f?.billingProvider === "apple";
    const lapsed = o ? o.status !== "active" : false;
    const manageReason = external
      ? "Billing is managed through Apple — changes are made in Apple subscription settings."
      : lapsed
        ? "No active subscription to change."
        : undefined;
    return [
      cap("view_account", "See account summary", "Show plan, status, and billing at a glance.", true),
      cap("view_subscription", "Explain my subscription", "Describe the current plan and billing.", true),
      cap("view_entitlements", "Check what my plan includes", "Downloads, ad level, streams, and quality.", true),
      cap("browse_catalog", "Find something to watch", "Search the demo catalog by title or genre.", true),
      cap("manage_watchlist", "Manage my watchlist", "View, add, and remove titles on the watchlist.", true),
      cap("change_plan", "Change my plan (simulated)", "Preview an upgrade or downgrade.", !external && !lapsed, manageReason),
      cap("cancel_subscription", "Cancel my subscription (simulated)", "Preview a cancellation.", !external && !lapsed, manageReason),
    ];
  }

  async searchCatalog(query: string): Promise<CatalogTitle[]> {
    return searchCatalogData(query);
  }

  async getTitleDetails(contentId: string): Promise<CatalogTitle> {
    const t = findTitleById(contentId);
    if (!t) throw new Error(`Unknown title: ${contentId}`);
    return t;
  }

  async getPreview(contentId: string): Promise<PreviewInfo> {
    if (!findTitleById(contentId)) throw new Error(`Unknown title: ${contentId}`);
    return getPreviewData(contentId);
  }

  async getPlaybackDestination(contentId: string): Promise<PlaybackDestination> {
    if (!findTitleById(contentId)) throw new Error(`Unknown title: ${contentId}`);
    return getPlaybackData(contentId);
  }

  // Simulated viewing state (Continue Watching / resume / history). Read-only:
  // sourced directly from persona fixtures, never mutated by this prototype.

  async getViewingHistory(): Promise<ViewingProgress[]> {
    const id = this.requirePersona();
    return [...getPersonaFixture(id).viewing];
  }

  async getContinueWatching(): Promise<ViewingProgress[]> {
    const id = this.requirePersona();
    // "Continue Watching" is the in-progress subset, newest first.
    return getPersonaFixture(id).viewing.filter((v) => !v.completed);
  }

  async getResumePosition(contentId: string): Promise<ViewingProgress | null> {
    const id = this.requirePersona();
    return getPersonaFixture(id).viewing.find((v) => v.contentId === contentId) ?? null;
  }

  async getNextEpisode(contentId: string): Promise<NextEpisode | null> {
    this.requirePersona();
    return getNextEpisodeData(contentId);
  }

  // Simulated commerce — policy-blocked. Under current OpenAI plugin guidance
  // these never run: each hard-throws and mutates nothing. confirmPlanChange is
  // a confirmed plan mutation (RED); the rest are unresolved subscription-
  // management actions (YELLOW). The RED vs YELLOW user-facing distinction is
  // enforced at the agent/intent layer; here the service is the last-line
  // guarantee that no commerce state can ever change.

  async previewPlanChange(_targetPlanId: string): Promise<PlanChangePreview> {
    throw new PolicyClarificationRequiredError();
  }

  async confirmPlanChange(_previewId: string): Promise<ActionResult> {
    throw new PolicyProhibitedError();
  }

  async previewCancellation(): Promise<CancellationPreview> {
    throw new PolicyClarificationRequiredError();
  }

  async confirmCancellation(_previewId: string): Promise<ActionResult> {
    throw new PolicyClarificationRequiredError();
  }
}

function cap(
  id: string,
  label: string,
  description: string,
  available: boolean,
  reason?: string,
): Capability {
  return reason && !available ? { id, label, description, available, reason } : { id, label, description, available };
}

export const mockPeacockService = new MockPeacockService();
