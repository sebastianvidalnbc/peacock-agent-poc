import { describe, it, expect } from "vitest";
import { getTool } from "./index";

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
