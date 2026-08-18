import { describe, it, expect } from "vitest";
import { TOOLS, getTool } from "./index";
import { authModesFor, isGuestAccessible, accessLabelFor } from "./access";

/**
 * MCP optional-auth access-mode metadata. These assert the conceptual auth
 * contract each tool advertises (noauth / oauth2 / dual), independent of the
 * runtime connect guard, so the Guest-vs-connected split is a single source of
 * truth the agent, UI, and a future MCP server can all read.
 */

const ANONYMOUS_DUAL = [
  "search_catalog",
  "get_title_details",
  "get_preview",
  "get_playback_destination",
  "search_across_services",
  "get_where_to_watch",
  "get_recommendations",
  "get_supported_capabilities",
];

const AUTHENTICATED = [
  "get_account_summary",
  "get_subscription",
  "get_entitlements",
  "get_watchlist",
  "add_to_watchlist",
  "remove_from_watchlist",
  "get_viewing_history",
  "get_continue_watching",
  "get_resume_position",
  "get_next_episode",
];

describe("tool access modes — anonymous discovery + playback + catalog are dual", () => {
  it.each(ANONYMOUS_DUAL)("%s advertises both noauth and oauth2", (name) => {
    const t = getTool(name);
    expect(t, name).toBeDefined();
    expect(authModesFor(t!), name).toEqual(["noauth", "oauth2"]);
    expect(isGuestAccessible(t!), name).toBe(true);
    // Dual/anonymous tools never require a connection to run.
    expect(t!.requiresAuth, name).toBe(false);
  });
});

describe("tool access modes — personal / mutating tools are oauth2-only", () => {
  it.each(AUTHENTICATED)("%s advertises oauth2 only and is not guest-accessible", (name) => {
    const t = getTool(name);
    expect(t, name).toBeDefined();
    expect(authModesFor(t!), name).toEqual(["oauth2"]);
    expect(isGuestAccessible(t!), name).toBe(false);
    expect(t!.requiresAuth, name).toBe(true);
  });
});

describe("tool access modes — every registered tool has a well-defined contract", () => {
  it("declares authModes explicitly on every tool", () => {
    for (const t of TOOLS) {
      expect(t.authModes, t.name).toBeDefined();
      expect(t.authModes!.length, t.name).toBeGreaterThan(0);
    }
  });

  it("keeps authModes consistent with requiresAuth (authenticated ⇒ oauth2-only)", () => {
    for (const t of TOOLS) {
      if (t.requiresAuth) {
        expect(authModesFor(t), t.name).toEqual(["oauth2"]);
      } else {
        expect(authModesFor(t).includes("noauth"), t.name).toBe(true);
      }
    }
  });
});

describe("accessLabelFor — Access Inspector descriptor", () => {
  it("labels a disconnected session as Guest / noauth", () => {
    expect(accessLabelFor(false)).toEqual({ mode: "noauth", label: "Guest / noauth" });
  });
  it("labels a connected session as Connected Peacock / oauth2", () => {
    expect(accessLabelFor(true)).toEqual({ mode: "oauth2", label: "Connected Peacock / oauth2" });
  });
});
