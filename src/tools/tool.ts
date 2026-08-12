import type { z } from "zod";
import type { PeacockService } from "../peacock/PeacockService";

/**
 * MCP-compatible tool definition.
 *
 * This mirrors the shape a Model Context Protocol server would expose (name,
 * description, JSON-schema-able input/output) plus prototype metadata. It is
 * intentionally transport-agnostic: a future local MCP server can wrap these
 * same definitions (converting the Zod schemas to JSON Schema) without any
 * change to the handlers or the underlying PeacockService.
 */
export interface ToolDefinition<I = unknown, O = unknown> {
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
  /** Whether the tool changes persisted state. */
  mutates: boolean;
  /** Whether a production deployment would require explicit user confirmation. */
  requiresConfirmation: boolean;
  /** Whether a connected Peacock persona is required to run this tool. */
  requiresAuth: boolean;
  /** Runs the tool against a PeacockService implementation. */
  handler: (service: PeacockService, input: I) => Promise<O>;
}

/** Identity helper that preserves the concrete input/output generics. */
export function defineTool<I, O>(def: ToolDefinition<I, O>): ToolDefinition<I, O> {
  return def;
}
