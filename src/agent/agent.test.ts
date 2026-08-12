import { describe, it, expect, beforeEach } from "vitest";
import { Agent } from "./agent";
import { ConversationState } from "./conversation-state";
import { MockPeacockService } from "../peacock/MockPeacockService";
import { prototypeStore } from "../state/prototype-store";

/** Build a connected agent with no artificial delay for deterministic tests. */
function connectedAgent() {
  prototypeStore.clearAll();
  prototypeStore.connect("alex");
  const service = new MockPeacockService(prototypeStore);
  return new Agent(service, new ConversationState(), 0);
}

describe("Agent intent understanding", () => {
  beforeEach(() => {
    prototypeStore.clearAll();
  });

  it("treats 'What should I watch tonight?' as a recommendation follow-up, not a literal search", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("What should I watch tonight?");
    // No results card yet — it should ask what mood the user wants.
    expect(res.card).toBeUndefined();
    expect(res.toolName).toBeUndefined();
    expect(res.text.toLowerCase()).toMatch(/mood|funny|genre/);
    expect(agent.ctx.isAwaitingRecommendCriteria()).toBe(true);
  });

  it("uses conversation context so 'Something funny' completes the prior recommendation", async () => {
    const agent = connectedAgent();
    await agent.respond("What should I watch tonight?");
    const res = await agent.respond("Something funny");
    expect(res.toolName).toBe("search_catalog");
    expect(res.card?.kind).toBe("search");
    const titles = res.card?.kind === "search" ? res.card.data : [];
    expect(titles.length).toBeGreaterThan(0);
    // Every returned title should genuinely be a comedy (data via the service).
    expect(titles.every((t) => t.genres.some((g) => g.toLowerCase() === "comedy"))).toBe(true);
    expect(agent.ctx.isAwaitingRecommendCriteria()).toBe(false);
  });

  it("extracts the search term from 'Find Poker Face' (searches Poker Face, not 'Find Poker Face')", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("Find Poker Face");
    expect(res.toolName).toBe("search_catalog");
    const titles = res.card?.kind === "search" ? res.card.data : [];
    expect(titles.some((t) => t.title === "Poker Face")).toBe(true);
    expect(res.text.toLowerCase()).not.toContain("find poker face");
  });

  it("maps 'How much am I paying?' to the subscription intent", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("How much am I paying?");
    expect(res.toolName).toBe("get_subscription");
    expect(res.card?.kind).toBe("subscription");
  });

  it("maps 'Do I get downloads?' to the entitlements intent", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("Do I get downloads?");
    expect(res.toolName).toBe("get_entitlements");
    expect(res.card?.kind).toBe("entitlements");
  });

  it("maps 'What's on my list?' to the watchlist intent", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("What's on my list?");
    expect(res.toolName).toBe("get_watchlist");
    expect(res.card?.kind).toBe("watchlist");
  });

  it("maps 'What else can you do?' to the capabilities intent", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("What else can you do?");
    expect(res.toolName).toBe("get_supported_capabilities");
    expect(res.card?.kind).toBe("capabilities");
  });

  it("treats 'Recommend something' and 'Anything good?' as recommendations", async () => {
    const a1 = connectedAgent();
    const r1 = await a1.respond("Recommend something");
    expect(r1.card).toBeUndefined();
    expect(a1.ctx.isAwaitingRecommendCriteria()).toBe(true);

    const a2 = connectedAgent();
    const r2 = await a2.respond("Anything good?");
    expect(r2.card).toBeUndefined();
    expect(a2.ctx.isAwaitingRecommendCriteria()).toBe(true);
  });

  it("recommends directly when a genre is already given ('Recommend a comedy')", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("Recommend a comedy");
    expect(res.toolName).toBe("search_catalog");
    const titles = res.card?.kind === "search" ? res.card.data : [];
    expect(titles.length).toBeGreaterThan(0);
    expect(titles.every((t) => t.genres.some((g) => g.toLowerCase() === "comedy"))).toBe(true);
  });

  it("does not invent data: a non-Peacock request is unsupported, with no card", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("What's the weather tomorrow?");
    expect(res.card).toBeUndefined();
    expect(res.toolName).toBeUndefined();
  });

  it("offers a recovery next step when an explicit search has zero results", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("Find Nonexistent Title 9000");
    const titles = res.card?.kind === "search" ? res.card.data : [];
    expect(titles.length).toBe(0);
    expect(res.text.toLowerCase()).toMatch(/similar|genre|comedy|drama|available/);
  });
});
