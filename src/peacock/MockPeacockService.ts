import type { PeacockService } from "./PeacockService";
import {
  PeacockActionUnavailableError,
  PeacockNotConnectedError,
  type AccountSummary,
  type ActionResult,
  type CancellationPreview,
  type Capability,
  type CatalogTitle,
  type Entitlements,
  type PlanChangePreview,
  type Subscription,
} from "./types";
import { getPersonaFixture } from "../data/personas";
import { getPlan } from "../data/plans";
import { findTitleById, searchCatalogData } from "../data/catalog";
import { prototypeStore } from "../state/prototype-store";

type Store = typeof prototypeStore;

interface Pending {
  kind: "plan_change" | "cancellation";
  personaId: string;
  targetPlanId?: string;
}

/** In-memory Peacock behaviour backed by fixtures + the prototype store. */
export class MockPeacockService implements PeacockService {
  private pending = new Map<string, Pending>();

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
      .filter((t): t is CatalogTitle => Boolean(t));
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

  private assertManageable(): string {
    const id = this.requirePersona();
    const f = getPersonaFixture(id);
    if (f.billingProvider === "apple")
      throw new PeacockActionUnavailableError(
        "This subscription is billed through Apple and cannot be changed here.",
      );
    if (this.store.getOverlay(id).status !== "active")
      throw new PeacockActionUnavailableError("There is no active subscription to change.");
    return id;
  }

  async previewPlanChange(targetPlanId: string): Promise<PlanChangePreview> {
    const id = this.assertManageable();
    const target = getPlan(targetPlanId);
    const o = this.store.getOverlay(id);
    const previewId = `pc_${Date.now()}`;
    this.pending.set(previewId, { kind: "plan_change", personaId: id, targetPlanId });
    return {
      previewId,
      targetPlan: target,
      currentPlanName: getPlan(o.planId).name,
      priceLabel: `$${target.priceMonthly.toFixed(2)}/mo`,
      effectiveDate: this.futureDate(o.billingInterval),
      note: "Simulated plan change for concept evaluation only.",
    };
  }

  async confirmPlanChange(previewId: string): Promise<ActionResult> {
    const p = this.pending.get(previewId);
    if (!p || p.kind !== "plan_change" || !p.targetPlanId)
      return { success: false, message: "That plan-change preview has expired." };
    this.store.setSubscription(p.personaId, { planId: p.targetPlanId });
    this.pending.delete(previewId);
    return { success: true, message: `Plan changed to ${getPlan(p.targetPlanId).name} (simulated).` };
  }

  async previewCancellation(): Promise<CancellationPreview> {
    const id = this.assertManageable();
    const previewId = `cx_${Date.now()}`;
    this.pending.set(previewId, { kind: "cancellation", personaId: id });
    return {
      previewId,
      accessUntil: this.futureDate(this.store.getOverlay(id).billingInterval),
      note: "Simulated cancellation for concept evaluation only.",
    };
  }

  async confirmCancellation(previewId: string): Promise<ActionResult> {
    const p = this.pending.get(previewId);
    if (!p || p.kind !== "cancellation")
      return { success: false, message: "That cancellation preview has expired." };
    this.store.setSubscription(p.personaId, { status: "cancelled" });
    this.pending.delete(previewId);
    return { success: true, message: "Subscription cancelled (simulated)." };
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
