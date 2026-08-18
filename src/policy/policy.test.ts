import { describe, it, expect, beforeEach } from "vitest";
import { Agent } from "../agent/agent";
import { ConversationState } from "../agent/conversation-state";
import { routeIntent } from "../agent/intent-router";
import { MockPeacockService } from "../peacock/MockPeacockService";
import { prototypeStore } from "../state/prototype-store";
import { TOOLS, getTool } from "../tools";
import {
  PolicyClarificationRequiredError,
  PolicyProhibitedError,
  POLICY_MAP,
} from "./policy";

function connectedAgent() {
  prototypeStore.clearAll();
  prototypeStore.connect("alex");
  return new Agent(new MockPeacockService(prototypeStore), new ConversationState(), 0);
}

describe("policy regression — service-layer hard blocks (zero mutation)", () => {
  beforeEach(() => prototypeStore.clearAll());

  it("confirmPlanChange is RED (PolicyProhibitedError) and mutates nothing", async () => {
    prototypeStore.connect("alex");
    const svc = new MockPeacockService(prototypeStore);
    const before = await svc.getSubscription();
    await expect(svc.confirmPlanChange("x")).rejects.toBeInstanceOf(PolicyProhibitedError);
    const after = await svc.getSubscription();
    expect(after.plan.id).toBe(before.plan.id);
    expect(after.status).toBe(before.status);
  });

  it("preview/cancel are YELLOW (PolicyClarificationRequiredError) and mutate nothing", async () => {
    prototypeStore.connect("alex");
    const svc = new MockPeacockService(prototypeStore);
    const before = await svc.getSubscription();
    await expect(svc.previewPlanChange("peacock_premium_plus")).rejects.toBeInstanceOf(PolicyClarificationRequiredError);
    await expect(svc.previewCancellation()).rejects.toBeInstanceOf(PolicyClarificationRequiredError);
    await expect(svc.confirmCancellation("x")).rejects.toBeInstanceOf(PolicyClarificationRequiredError);
    const after = await svc.getSubscription();
    expect(after.plan.id).toBe(before.plan.id);
    expect(after.status).toBe(before.status);
  });
});

describe("policy regression — RED/YELLOW routing performs no mutation and is tagged", () => {
  it.each([
    ["I want to upgrade my plan", "upgrade"],
    ["Sign me up for Peacock", "new_subscription"],
    ["Reactivate my subscription", "reactivation"],
    ["Show me the plans I can buy", "display_plans"],
    ["Take me to checkout", "checkout"],
  ])("RED: %s stays red with no tool call", async (prompt) => {
    const agent = connectedAgent();
    const res = await agent.respond(prompt);
    expect(res.policy).toBe("red");
    expect(res.toolName).toBeUndefined();
    expect(res.card).toBeUndefined();
  });

  it.each([
    ["Cancel my subscription", "cancel"],
    ["Downgrade to a cheaper plan", "downgrade"],
    ["Pause my subscription", "pause"],
  ])("YELLOW: %s is clarification-required with no tool call", async (prompt) => {
    const agent = connectedAgent();
    const res = await agent.respond(prompt);
    expect(res.policy).toBe("yellow");
    expect(res.toolName).toBeUndefined();
  });
});

describe("policy regression — GREEN entitlement gap", () => {
  it("explains the ads gap from read-only entitlements, no checkout link", async () => {
    const agent = connectedAgent(); // alex is ad-supported
    const res = await agent.respond("Can I get fewer ads?");
    expect(res.policy).toBe("green");
    expect(res.toolName).toBe("get_entitlements");
    // Offers only an informational plans link — never an open/checkout action.
    const kinds = (res.actions ?? []).map((a) => a.kind);
    expect(kinds).not.toContain("open");
    expect(kinds.every((k) => k === "plans_info")).toBe(true);
  });
});

describe("policy regression — GREEN Continue Watching reads fixtures", () => {
  it("returns in-progress items tagged green with a resume action", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("What was I watching?");
    expect(res.policy).toBe("green");
    expect(res.card?.kind).toBe("continue_watching");
    expect((res.actions ?? []).some((a) => a.kind === "resume")).toBe(true);
  });
});

describe("policy regression — MCP annotations", () => {
  it("all read tools are readOnlyHint:true", () => {
    for (const name of [
      "get_account_summary", "get_subscription", "get_entitlements", "get_watchlist",
      "get_viewing_history", "get_continue_watching", "get_resume_position", "get_next_episode",
    ]) {
      expect(getTool(name)?.readOnlyHint, name).toBe(true);
    }
  });

  it("watchlist writes are readOnlyHint:false and destructiveHint:false (reversible)", () => {
    for (const name of ["add_to_watchlist", "remove_from_watchlist"]) {
      const t = getTool(name);
      expect(t?.readOnlyHint, name).toBe(false);
      expect(t?.destructiveHint, name).toBe(false);
      expect(t?.openWorldHint, name).toBe(true);
    }
  });

  it("discovery + playback handoff are openWorldHint:true", () => {
    for (const name of ["search_across_services", "get_where_to_watch", "get_recommendations", "get_playback_destination"]) {
      expect(getTool(name)?.openWorldHint, name).toBe(true);
    }
  });
});

describe("policy regression — no prohibited capability is reachable via TOOLS", () => {
  it("no registered tool mutates commerce state", () => {
    const names = TOOLS.map((t) => t.name);
    // The only mutating tools are the two reversible watchlist writes.
    const mutating = TOOLS.filter((t) => t.mutates).map((t) => t.name);
    expect(mutating.sort()).toEqual(["add_to_watchlist", "remove_from_watchlist"]);
    // No commerce tool is registered at all.
    for (const forbidden of ["confirm_plan_change", "preview_plan_change", "confirm_cancellation", "upgrade", "checkout"]) {
      expect(names).not.toContain(forbidden);
    }
  });

  it("every routed commerce intent maps to a non-green POLICY_MAP entry", () => {
    expect(routeIntent("upgrade my plan").kind).toBe("commerce_prohibited");
    expect(routeIntent("cancel my subscription").kind).toBe("commerce_clarify");
    expect(POLICY_MAP.upgrade.status).toBe("red");
    expect(POLICY_MAP.cancel.status).toBe("yellow");
    expect(POLICY_MAP.continue_watching.status).toBe("green");
  });
});
