import type { z } from "zod";
import type { PeacockService } from "../peacock/PeacockService";
import type { DiscoveryService } from "../discovery/DiscoveryService";

/**
 * Which backend a tool runs against. Peacock tools use account-aware behaviour;
 * discovery tools are provider-neutral and hold no account state. Defaulting to
 * "peacock" keeps every existing tool definition valid without change.
 */
export type ToolTarget = "peacock" | "discovery";

/** The backend a tool of a given target receives in its handler. */
export type ServiceForTarget<T extends ToolTarget> = T extends "discovery"
  ? DiscoveryService
  : PeacockService;

/**
 * MCP-compatible tool definition.
 *
 * This mirrors the shape a Model Context Protocol server would expose (name,
 * description, JSON-schema-able input/output) plus prototype metadata. It is
 * intentionally transport-agnostic: a future local MCP server can wrap these
 * same definitions (converting the Zod schemas to JSON Schema) without any
 * change to the handlers or the underlying services.
 */
export interface ToolDefinition<I = unknown, O = unknown, T extends ToolTarget = ToolTarget> {
  /** Machine name, e.g. "get_subscription". */
  name: string;
  /** Short human-readable title for UI. */
  title: string;
  /** Human-readable description of what the tool does. */
  description: string;
  /** Input schema (Zod; convertible to JSON Schema for MCP). */
  inputSchema: z.ZodType<I>;
  /** Output schema (Zod; convertible to JSON Schema for MCP). */
  outputSchema: z.ZodType<O>;
  /** Which backend the tool runs against. Defaults to "peacock". */
  target?: T;
  /** Whether the tool changes persisted state. */
  mutates: boolean;
  /** Whether a production deployment would require explicit user confirmation. */
  requiresConfirmation: boolean;
  /** Whether a connected Peacock persona is required to run this tool. */
  requiresAuth: boolean;
  /**
   * MCP tool annotations (hints). These mirror the Model Context Protocol tool
   * annotations a real server would advertise and are surfaced by the prototype
   * for policy review:
   *  - readOnlyHint: the tool does not modify its environment (all reads).
   *  - destructiveHint: a mutating tool performs a destructive/irreversible
   *    update. Watchlist writes are reversible, so this is false for them.
   *  - openWorldHint: the tool interacts with an external/open world beyond the
   *    Peacock account (cross-service discovery, playback handoff).
   * All are optional; omit when not meaningful for a tool.
   */
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  openWorldHint?: boolean;
  /** Runs the tool against the service for its target. */
  handler: (service: ServiceForTarget<T>, input: I) => Promise<O>;
}

/** Identity helper that preserves the concrete input/output/target generics. */
export function defineTool<I, O, T extends ToolTarget = "peacock">(
  def: ToolDefinition<I, O, T>,
): ToolDefinition<I, O, T> {
  return def;
}
