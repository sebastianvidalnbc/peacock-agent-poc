import { describe, it, expect, beforeEach } from "vitest";
import { MockPeacockService } from "./MockPeacockService";
import { PeacockNotConnectedError } from "./types";
import {
  PolicyClarificationRequiredError,
  PolicyProhibitedError,
} from "../policy/policy";
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

  it("policy-blocks every commerce method with zero mutation (RED confirm, YELLOW rest)", async () => {
    prototypeStore.connect("alex");
    const svc = service();
    const before = await svc.getSubscription();
    // Confirmed plan mutation is RED — hard prohibited.
    await expect(svc.confirmPlanChange("pc_x")).rejects.toBeInstanceOf(
      PolicyProhibitedError,
    );
    // Preview/cancel are YELLOW — unresolved, clarification required.
    await expect(svc.previewPlanChange("peacock_premium_plus")).rejects.toBeInstanceOf(
      PolicyClarificationRequiredError,
    );
    await expect(svc.previewCancellation()).rejects.toBeInstanceOf(
      PolicyClarificationRequiredError,
    );
    await expect(svc.confirmCancellation("cx_x")).rejects.toBeInstanceOf(
      PolicyClarificationRequiredError,
    );
    // Nothing changed: subscription plan/status is untouched.
    const after = await svc.getSubscription();
    expect(after.plan.id).toBe(before.plan.id);
    expect(after.status).toBe(before.status);
  });

  it("returns simulated Continue Watching (in-progress only) for Alex", async () => {
    prototypeStore.connect("alex");
    const cw = await service().getContinueWatching();
    expect(cw.length).toBeGreaterThan(0);
    expect(cw.every((v) => !v.completed)).toBe(true);
    expect(cw.some((v) => v.contentId === "ttl_love_island_usa")).toBe(true);
  });

  it("returns a resume position and next episode for Love Island USA", async () => {
    prototypeStore.connect("alex");
    const svc = service();
    const pos = await svc.getResumePosition("ttl_love_island_usa");
    expect(pos?.progressSeconds).toBeGreaterThan(0);
    expect(pos?.durationSeconds).toBeGreaterThan(pos!.progressSeconds);
    const next = await svc.getNextEpisode("ttl_love_island_usa");
    expect(next?.hasNext).toBe(true);
    expect(next?.episodeNumber).toBe(12);
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

  it("returns simulated preview info for Love Island USA (no connection required)", async () => {
    const preview = await service().getPreview("ttl_love_island_usa");
    expect(preview.previewAvailable).toBe(true);
    expect(preview.durationSeconds).toBeGreaterThan(0);
    expect(preview.previewSource).toBeTruthy();
  });

  it("returns the simulated Peacock playback destination for a title", async () => {
    const dest = await service().getPlaybackDestination("ttl_love_island_usa");
    expect(dest.destination).toBe("Peacock");
    expect(dest.connectionRequired).toBe(true);
    expect(dest.destinationUrl).toBeTruthy();
  });
});
