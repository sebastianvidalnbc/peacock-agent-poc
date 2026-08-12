import { describe, it, expect, beforeEach } from "vitest";
import { MockPeacockService } from "./MockPeacockService";
import { PeacockActionUnavailableError, PeacockNotConnectedError } from "./types";
import { prototypeStore } from "../state/prototype-store";

const service = () => new MockPeacockService(prototypeStore);

describe("MockPeacockService", () => {
  beforeEach(() => {
    prototypeStore.clearAll();
  });

  it("throws PeacockNotConnectedError when no persona is connected", async () => {
    await expect(service().getSubscription()).rejects.toBeInstanceOf(
      PeacockNotConnectedError,
    );
  });

  it("returns Alex's mid-tier active subscription billed by Peacock", async () => {
    prototypeStore.connect("alex");
    const sub = await service().getSubscription();
    expect(sub.plan.id).toBe("peacock_select");
    expect(sub.status).toBe("active");
    expect(sub.billingProvider).toBe("peacock_direct");
    expect(sub.managedExternally).toBe(false);
  });

  it("returns Alex's entitlements: no downloads, ad-supported", async () => {
    prototypeStore.connect("alex");
    const ent = await service().getEntitlements();
    expect(ent.downloads).toBe(false);
    expect(ent.adsLevel).toBe("ads");
  });

  it("adds a title to the watchlist", async () => {
    prototypeStore.connect("alex");
    const svc = service();
    const before = await svc.getWatchlist();
    const after = await svc.addToWatchlist("ttl_poker_face");
    expect(after.length).toBe(before.length + 1);
    expect(after.some((t) => t.contentId === "ttl_poker_face")).toBe(true);
  });

  it("does not add duplicate titles", async () => {
    prototypeStore.connect("alex");
    const svc = service();
    await svc.addToWatchlist("ttl_poker_face");
    const first = await svc.getWatchlist();
    const second = await svc.addToWatchlist("ttl_poker_face");
    expect(second.length).toBe(first.length);
  });

  it("removes a title from the watchlist", async () => {
    prototypeStore.connect("alex");
    const after = await service().removeFromWatchlist("ttl_midnight_harbor");
    expect(after.some((t) => t.contentId === "ttl_midnight_harbor")).toBe(false);
  });

  it("restores fixtures on resetScenario", async () => {
    prototypeStore.connect("alex");
    const svc = service();
    await svc.addToWatchlist("ttl_poker_face");
    prototypeStore.resetScenario();
    const list = await svc.getWatchlist();
    expect(list.map((t) => t.contentId)).toEqual([
      "ttl_midnight_harbor",
      "ttl_summit_run",
    ]);
  });

  it("marks Taylor as externally billed through Apple", async () => {
    prototypeStore.connect("taylor");
    const sub = await service().getSubscription();
    expect(sub.managedExternally).toBe(true);
    expect(sub.billingProvider).toBe("apple");
  });

  it("blocks simulated commerce for externally billed Taylor", async () => {
    prototypeStore.connect("taylor");
    const svc = service();
    await expect(svc.previewPlanChange("peacock_select")).rejects.toBeInstanceOf(
      PeacockActionUnavailableError,
    );
    await expect(svc.previewCancellation()).rejects.toBeInstanceOf(
      PeacockActionUnavailableError,
    );
  });

  it("reports change_plan/cancel_subscription unavailable for Taylor", async () => {
    prototypeStore.connect("taylor");
    const caps = await service().getSupportedCapabilities();
    const byId = Object.fromEntries(caps.map((c) => [c.id, c]));
    expect(byId["change_plan"].available).toBe(false);
    expect(byId["cancel_subscription"].available).toBe(false);
  });

  // Adjustment #2: capabilities must work while disconnected.
  it("returns capabilities while disconnected (no persona connected)", async () => {
    const caps = await service().getSupportedCapabilities();
    expect(caps.length).toBeGreaterThan(0);
    expect(caps.some((c) => c.id === "view_subscription")).toBe(true);
  });
});
