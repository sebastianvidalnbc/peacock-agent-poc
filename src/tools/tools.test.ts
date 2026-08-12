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
});
