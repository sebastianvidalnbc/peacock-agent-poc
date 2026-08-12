import type { PeacockService } from "../peacock/PeacockService";
import type { ToolDefinition } from "./tool";
import { getAccountSummaryTool } from "./account";
import { getSubscriptionTool } from "./subscription";
import { getEntitlementsTool, getSupportedCapabilitiesTool } from "./entitlements";
import { getTitleDetailsTool, searchCatalogTool } from "./catalog";
import {
  addToWatchlistTool,
  getWatchlistTool,
  removeFromWatchlistTool,
} from "./watchlist";

export type { ToolDefinition } from "./tool";

/** Ordered registry of all MCP-compatible tools in the prototype. */
export const TOOLS: ToolDefinition<any, any>[] = [
  getAccountSummaryTool,
  getSubscriptionTool,
  getEntitlementsTool,
  getSupportedCapabilitiesTool,
  getWatchlistTool,
  addToWatchlistTool,
  removeFromWatchlistTool,
  searchCatalogTool,
  getTitleDetailsTool,
];

const TOOLS_BY_NAME: Record<string, ToolDefinition<any, any>> =
  Object.fromEntries(TOOLS.map((t) => [t.name, t]));

export function getTool(name: string): ToolDefinition<any, any> | undefined {
  return TOOLS_BY_NAME[name];
}

/**
 * Validate input, run a tool against a service, and validate its output. This
 * is the single execution path used by the agent (and, later, by a real MCP
 * server) so behaviour and validation stay identical across transports.
 */
export async function runTool<O = unknown>(
  service: PeacockService,
  name: string,
  input: unknown = {},
): Promise<O> {
  const tool = TOOLS_BY_NAME[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  const parsedInput = tool.inputSchema.parse(input ?? {});
  const result = await tool.handler(service, parsedInput);
  return tool.outputSchema.parse(result) as O;
}
