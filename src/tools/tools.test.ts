import { describe, it, expect } from "vitest";
import { getTool, runTool } from "./index";
import { MockPeacockService } from "../peacock/MockPeacockService";
import { mockDiscoveryService } from "../discovery/MockDiscoveryService";
import { prototypeStore } from "../state/prototype-store";
import type { TitleAvailability } from "../peacock/types";

describe("tool metadata", () => {
  it("get_supported_capabilities does not require auth", () => {
    expect(getTool("get_supported_capabilities")?.requiresAuth).toBe(false);
  });
  it("mutating watchlist tools require auth", () => {
    expect(getTool("add_to_watchlist")?.requiresAuth).toBe(true);
    expect(getTool("add_to_watchlist")?.mutates).toBe(true);
  });
  it("registers get_preview as a read-only, no-auth tool", () => {
    const t = getTool("get_preview");
    expect(t).toBeDefined();
    expect(t?.requiresAuth).toBe(false);
    expect(t?.mutates).toBe(false);
  });
  it("registers get_playback_destination as a read-only, no-auth tool", () => {
    const t = getTool("get_playback_destination");
    expect(t).toBeDefined();
    expect(t?.requiresAuth).toBe(false);
    expect(t?.mutates).toBe(false);
  });
});

describe("cross-service discovery tools", () => {
  it("registers the discovery tools as provider-neutral, no-auth, read-only", () => {
    for (const name of ["search_across_services", "get_where_to_watch", "get_recommendations"]) {
      const t = getTool(name);
      expect(t, name).toBeDefined();
      expect(t?.target, name).toBe("discovery");
      expect(t?.requiresAuth, name).toBe(false);
      expect(t?.mutates, name).toBe(false);
    }
  });

  it("routes discovery tools to the discovery backend via a ServiceContext", async () => {
    prototypeStore.clearAll();
    const ctx = { peacock: new MockPeacockService(prototypeStore), discovery: mockDiscoveryService };
    const where = await runTool<TitleAvailability>(ctx, "get_where_to_watch", {
      contentId: "ttl_signal_lost",
    });
    // Signal Lost is on both Peacock and Max in the fixtures.
    const providers = where.availability.map((a) => a.provider);
    expect(providers).toContain("peacock");
    expect(providers).toContain("max");
  });

  it("still accepts a bare PeacockService (back-compat) and runs discovery tools", async () => {
    prototypeStore.clearAll();
    const service = new MockPeacockService(prototypeStore);
    const results = await runTool<TitleAvailability[]>(service, "search_across_services", {
      query: "Neon Alley",
    });
    expect(results.some((t) => t.title === "Neon Alley")).toBe(true);
  });
});
