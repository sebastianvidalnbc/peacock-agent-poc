import type { ToolDefinition } from "./tool";

/**
 * MCP optional-auth access modes for a tool.
 *
 * Mirrors OpenAI's optional-authentication MCP pattern, where a connector can
 * advertise which tools are reachable anonymously versus which require a
 * connected (OAuth) account:
 *  - "noauth": runnable by a Guest with no Peacock connection (anonymous,
 *    public catalog / discovery / preview / public playback-destination).
 *  - "oauth2": requires a connected Peacock account (personal or mutating).
 *
 * A tool may support both: a "dual-mode" tool returns public results for a
 * Guest and richer, account-aware results once connected. This metadata is the
 * conceptual auth contract a real MCP server would expose; the prototype's
 * runtime enforcement still flows through requiresAuth + the connect guard.
 */
export type AuthMode = "noauth" | "oauth2";

/**
 * The authoritative access modes for a tool. Prefer the tool's explicit
 * `authModes` when present; otherwise derive a conservative default from
 * `requiresAuth` (authenticated → oauth2-only, anonymous → noauth-only) so
 * every tool has a well-defined contract even before it is annotated.
 */
export function authModesFor(tool: ToolDefinition<any, any, any>): AuthMode[] {
  if (tool.authModes && tool.authModes.length) return tool.authModes;
  return tool.requiresAuth ? ["oauth2"] : ["noauth"];
}

/** Whether a Guest (no connection) may run this tool at all. */
export function isGuestAccessible(tool: ToolDefinition<any, any, any>): boolean {
  return authModesFor(tool).includes("noauth");
}

/** The Access Inspector label for the current connection state. */
export function accessLabelFor(connected: boolean): { mode: AuthMode; label: string } {
  return connected
    ? { mode: "oauth2", label: "Connected Peacock / oauth2" }
    : { mode: "noauth", label: "Guest / noauth" };
}
