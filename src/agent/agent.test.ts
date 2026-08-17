import { describe, it, expect, beforeEach } from "vitest";
import { Agent } from "./agent";
import { ConversationState } from "./conversation-state";
import { MockPeacockService } from "../peacock/MockPeacockService";
import { prototypeStore } from "../state/prototype-store";
import { STARTER_PROMPTS } from "./capabilities";

/** Build a connected agent with no artificial delay for deterministic tests. */
function connectedAgent() {
  prototypeStore.clearAll();
  prototypeStore.connect("alex");
  const service = new MockPeacockService(prototypeStore);
  return new Agent(service, new ConversationState(), 0);
}

/** Build a disconnected agent (no persona connected) for the connect flow. */
function disconnectedAgent() {
  prototypeStore.clearAll();
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
    // Recommendations are cross-service by default (neutral discovery card).
    expect(res.toolName).toBe("get_recommendations");
    expect(res.card?.kind).toBe("discovery");
    const rows = res.card?.kind === "discovery" ? res.card.rows : [];
    expect(rows.length).toBeGreaterThan(0);
    // Every returned title should genuinely be a comedy (data via the service).
    expect(rows.every((r) => r.title.genres.some((g) => g.toLowerCase() === "comedy"))).toBe(true);
    // Results span more than just Peacock — other providers appear too.
    const providers = new Set(rows.flatMap((r) => r.title.availability.map((a) => a.provider)));
    expect(providers.size).toBeGreaterThan(1);
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
    expect(res.toolName).toBe("get_recommendations");
    expect(res.card?.kind).toBe("discovery");
    const rows = res.card?.kind === "discovery" ? res.card.rows : [];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.title.genres.some((g) => g.toLowerCase() === "comedy"))).toBe(true);
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

describe("Content discovery + Peacock playback handoff", () => {
  beforeEach(() => {
    prototypeStore.clearAll();
  });

  it("resolves 'I want to watch Love Island USA' to a title offer, not a literal search", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("I want to watch Love Island USA");
    expect(res.card?.kind).toBe("title_offer");
    expect(res.toolName).toBe("get_title_details");
    const title = res.card?.kind === "title_offer" ? res.card.data : undefined;
    expect(title?.title).toBe("Love Island USA");
    expect(title?.availableOnPeacock).toBe(true);
    // The offer should include a preview action and an open action when connected.
    const kinds = (res.actions ?? []).map((a) => a.kind);
    expect(kinds).toContain("preview");
    expect(kinds).toContain("open");
  });

  it("answers availability for 'Is Love Island USA on Peacock?'", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("Is Love Island USA on Peacock?");
    expect(res.card?.kind).toBe("title_offer");
    expect(res.text.toLowerCase()).toContain("available on peacock");
  });

  it("offers to connect when a disconnected user asks to watch a title", async () => {
    const agent = disconnectedAgent();
    const res = await agent.respond("I want to watch Love Island USA");
    // Still shows the offer + preview, but the primary action is to connect.
    expect(res.card?.kind).toBe("title_offer");
    const kinds = (res.actions ?? []).map((a) => a.kind);
    expect(kinds).toContain("preview");
    expect(kinds).toContain("connect");
    expect(kinds).not.toContain("open");
  });

  it("previews the current title via context ('Can I preview it?')", async () => {
    const agent = connectedAgent();
    await agent.respond("I want to watch Love Island USA");
    const res = await agent.respond("Can I preview it?");
    expect(res.card?.kind).toBe("title_offer");
    expect(res.toolName).toBe("get_preview");
    const preview = res.card?.kind === "title_offer" ? res.card.preview : undefined;
    expect(preview?.previewAvailable).toBe(true);
  });

  it("requires a connection to open a title, then resumes after connecting", async () => {
    const agent = disconnectedAgent();
    await agent.respond("I want to watch Love Island USA");
    const gated = await agent.respond("Open it in Peacock");
    expect(gated.card?.kind).toBe("connect");
    const connectAction = (gated.actions ?? []).find((a) => a.kind === "connect");
    expect(connectAction?.resumeText).toBeTruthy();

    // Simulate the connect + resume that the UI performs.
    prototypeStore.connect("alex");
    const resumed = await agent.respond(connectAction!.resumeText!);
    expect(resumed.card?.kind).toBe("handoff");
    expect(resumed.toolName).toBe("get_playback_destination");
  });

  it("routes the post-connect resume text 'Open <Title> in Peacock' to a handoff", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("Open Love Island USA in Peacock");
    expect(res.card?.kind).toBe("handoff");
    expect(res.toolName).toBe("get_playback_destination");
  });

  it("hands off to Peacock when a connected user opens a title", async () => {
    const agent = connectedAgent();
    await agent.respond("I want to watch Love Island USA");
    const res = await agent.openTitle("ttl_love_island_usa");
    expect(res.card?.kind).toBe("handoff");
    const dest = res.card?.kind === "handoff" ? res.card.destination : undefined;
    expect(dest?.destination).toBe("Peacock");
    expect(dest?.destinationUrl).toBeTruthy();
  });

  it("returns full details for 'Tell me more about it' using context", async () => {
    const agent = connectedAgent();
    await agent.respond("I want to watch Love Island USA");
    const res = await agent.respond("Tell me more about it");
    expect(res.card?.kind).toBe("title");
    expect(res.toolName).toBe("get_title_details");
    const title = res.card?.kind === "title" ? res.card.data : undefined;
    expect(title?.title).toBe("Love Island USA");
  });

  it("still routes 'add Love Island USA to my watchlist' to the watchlist, not a title offer", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("Add Love Island USA to my watchlist");
    expect(res.card?.kind).toBe("watchlist");
    expect(res.toolName).toBe("add_to_watchlist");
  });
});

describe("Cross-service discovery (Phase 2B)", () => {
  beforeEach(() => {
    prototypeStore.clearAll();
  });

  it("answers 'Where can I watch X?' with a neutral cross-service card, not a Peacock offer", async () => {
    const agent = disconnectedAgent();
    const res = await agent.respond("Where can I watch Neon Alley?");
    expect(res.card?.kind).toBe("where_to_watch");
    expect(res.toolName).toBe("get_where_to_watch");
    const providers =
      res.card?.kind === "where_to_watch" ? res.card.data.availability.map((a) => a.provider) : [];
    expect(providers).toContain("netflix");
    // Neon Alley is not on Peacock, so nothing is marked owned.
    if (res.card?.kind === "where_to_watch") expect(res.card.ownedOnPeacock).toBe(false);
  });

  it("keeps 'Is X on Peacock?' as the Peacock-specific offer (not cross-service)", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("Is Signal Lost on Peacock?");
    expect(res.card?.kind).toBe("title_offer");
    expect(res.text.toLowerCase()).toContain("available on peacock");
  });

  it("marks the Peacock row owned only when connected", async () => {
    const off = disconnectedAgent();
    const r1 = await off.respond("Where can I watch Signal Lost?");
    expect(r1.card?.kind).toBe("where_to_watch");
    if (r1.card?.kind === "where_to_watch") expect(r1.card.ownedOnPeacock).toBe(false);

    const on = connectedAgent();
    const r2 = await on.respond("Where can I watch Signal Lost?");
    // Signal Lost is on Peacock; a connected account already covers it.
    if (r2.card?.kind === "where_to_watch") expect(r2.card.ownedOnPeacock).toBe(true);
  });

  it("routes an explicit cross-service search to a discovery card", async () => {
    const agent = connectedAgent();
    const res = await agent.respond("Find drama across all services");
    expect(res.toolName).toBe("search_across_services");
    expect(res.card?.kind).toBe("discovery");
    const rows = res.card?.kind === "discovery" ? res.card.rows : [];
    expect(rows.length).toBeGreaterThan(0);
  });

  it("answers 'which of these do I already have?' by intersecting with the connected account", async () => {
    const agent = connectedAgent();
    await agent.respond("Find drama across all services");
    const res = await agent.respond("Which of these do I already have?");
    expect(res.card?.kind).toBe("discovery");
    const rows = res.card?.kind === "discovery" ? res.card.rows : [];
    // Any owned row must genuinely be a Peacock title.
    for (const r of rows) {
      if (r.ownedOnPeacock)
        expect(r.title.availability.some((a) => a.provider === "peacock")).toBe(true);
    }
  });

  it("prompts to connect for 'which do I have?' when disconnected", async () => {
    const agent = disconnectedAgent();
    await agent.respond("Find drama across all services");
    const res = await agent.respond("Which of these do I already have?");
    const kinds = (res.actions ?? []).map((a) => a.kind);
    expect(kinds).toContain("connect");
    // Nothing is owned while disconnected.
    const rows = res.card?.kind === "discovery" ? res.card.rows : [];
    expect(rows.every((r) => !r.ownedOnPeacock)).toBe(true);
  });

  it("resolves 'where else can I watch it?' from conversation context", async () => {
    const agent = connectedAgent();
    await agent.respond("I want to watch Signal Lost");
    const res = await agent.respond("Where else can I watch it?");
    expect(res.card?.kind).toBe("where_to_watch");
    if (res.card?.kind === "where_to_watch") expect(res.card.data.title).toBe("Signal Lost");
  });
});

describe("Neutral home state (default starter prompts)", () => {
  beforeEach(() => {
    prototypeStore.clearAll();
  });

  it("keeps the default starter prompts provider-neutral (no Peacock on the home screen)", () => {
    expect(STARTER_PROMPTS).toEqual([
      "What should I watch tonight?",
      "Recommend a funny movie",
      "Where can I watch Jaws?",
    ]);
    expect(STARTER_PROMPTS.some((p) => /peacock/i.test(p))).toBe(false);
  });

  it("answers the 'Where can I watch Jaws?' starter with a neutral cross-service card that includes Peacock", async () => {
    const agent = disconnectedAgent();
    const res = await agent.respond("Where can I watch Jaws?");
    expect(res.card?.kind).toBe("where_to_watch");
    expect(res.toolName).toBe("get_where_to_watch");
    const providers =
      res.card?.kind === "where_to_watch" ? res.card.data.availability.map((a) => a.provider) : [];
    // Peacock surfaces naturally as one provider among several — not preferred.
    expect(providers).toContain("peacock");
    expect(providers.length).toBeGreaterThan(1);
  });

  it("answers the 'Recommend a funny movie' starter without requiring or mentioning a connection", async () => {
    const agent = disconnectedAgent();
    const res = await agent.respond("Recommend a funny movie");
    expect(res.toolName).toBe("get_recommendations");
    expect(res.card?.kind).toBe("discovery");
    // Disconnected home state never claims Peacock ownership.
    if (res.card?.kind === "discovery") expect(res.card.connected).toBe(false);
  });
});
