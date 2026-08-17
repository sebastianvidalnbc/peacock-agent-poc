import type { PeacockService } from "../peacock/PeacockService";
import type { DiscoveryService } from "../discovery/DiscoveryService";
import { mockDiscoveryService } from "../discovery/MockDiscoveryService";
import type { ToolDefinition } from "./tool";
import { getAccountSummaryTool } from "./account";
import { getSubscriptionTool } from "./subscription";
import { getEntitlementsTool, getSupportedCapabilitiesTool } from "./entitlements";
import {
  getPlaybackDestinationTool,
  getPreviewTool,
  getTitleDetailsTool,
  searchCatalogTool,
} from "./catalog";
import {
  addToWatchlistTool,
  getWatchlistTool,
  removeFromWatchlistTool,
} from "./watchlist";
import {
  getRecommendationsTool,
  getWhereToWatchTool,
  searchAcrossServicesTool,
} from "./discovery";

export type { ToolDefinition } from "./tool";

/**
 * The set of backends the tool layer can run against. Peacock tools use the
 * account-aware service; discovery tools use the provider-neutral one. Passing a
 * bare PeacockService is still accepted (a default discovery service is used) so
 * existing call sites keep working unchanged.
 */
export interface ServiceContext {
  peacock: PeacockService;
  discovery: DiscoveryService;
}

/** Ordered registry of all MCP-compatible tools in the prototype. */
export const TOOLS: ToolDefinition<any, any, any>[] = [
  getAccountSummaryTool,
  getSubscriptionTool,
  getEntitlementsTool,
  getSupportedCapabilitiesTool,
  getWatchlistTool,
  addToWatchlistTool,
  removeFromWatchlistTool,
  searchCatalogTool,
  getTitleDetailsTool,
  getPreviewTool,
  getPlaybackDestinationTool,
  searchAcrossServicesTool,
  getWhereToWatchTool,
  getRecommendationsTool,
];

const TOOLS_BY_NAME: Record<string, ToolDefinition<any, any, any>> =
  Object.fromEntries(TOOLS.map((t) => [t.name, t]));

export function getTool(name: string): ToolDefinition<any, any, any> | undefined {
  return TOOLS_BY_NAME[name];
}

/** Normalise the accepted service argument into a full ServiceContext. */
function toContext(service: PeacockService | ServiceContext): ServiceContext {
  return "peacock" in service
    ? service
    : { peacock: service, discovery: mockDiscoveryService };
}

/**
 * Validate input, run a tool against the correct backend, and validate its
 * output. This is the single execution path used by the agent (and, later, by a
 * real MCP server) so behaviour and validation stay identical across transports.
 *
 * Accepts either a full ServiceContext or, for backward compatibility, a bare
 * PeacockService (in which case a default discovery service is supplied).
 */
export async function runTool<O = unknown>(
  service: PeacockService | ServiceContext,
  name: string,
  input: unknown = {},
): Promise<O> {
  const tool = TOOLS_BY_NAME[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  const ctx = toContext(service);
  const backend = tool.target === "discovery" ? ctx.discovery : ctx.peacock;
  const parsedInput = tool.inputSchema.parse(input ?? {});
  const result = await tool.handler(backend as any, parsedInput);
  return tool.outputSchema.parse(result) as O;
}
