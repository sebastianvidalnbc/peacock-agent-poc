import { defineTool } from "./tool";
import {
  ContentIdInputSchema,
  RecommendCriteriaInputSchema,
  SearchInputSchema,
  TitleAvailabilitySchema,
  TitleAvailabilityListSchema,
} from "../peacock/schemas";

/**
 * Provider-neutral, cross-service discovery tools (Phase 2B). None require a
 * Peacock connection and none mutate state — they only report simulated
 * availability across streaming services. Account-aware reasoning ("which of
 * these do I already have?") is composed by the agent, not by these tools.
 */

export const searchAcrossServicesTool = defineTool({
  name: "search_across_services",
  title: "Search across services",
  description:
    "Search titles across all simulated streaming services by title, genre, or keyword and return each match with its cross-service availability. Provider-neutral; does not require a connection.",
  inputSchema: SearchInputSchema,
  outputSchema: TitleAvailabilityListSchema,
  target: "discovery",
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: false,
  handler: (service, input) => service.searchAcrossServices(input.query),
});

export const getWhereToWatchTool = defineTool({
  name: "get_where_to_watch",
  title: "Get where to watch",
  description:
    "Return where a single title can be watched across simulated streaming services (provider, offer type, quality, and a mock deep link). Provider-neutral; does not require a connection.",
  inputSchema: ContentIdInputSchema,
  outputSchema: TitleAvailabilitySchema,
  target: "discovery",
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: false,
  handler: (service, input) => service.getWhereToWatch(input.contentId),
});

export const getRecommendationsTool = defineTool({
  name: "get_recommendations",
  title: "Get recommendations",
  description:
    "Return provider-neutral recommendations across simulated streaming services, optionally narrowed by genre. Does not require a connection.",
  inputSchema: RecommendCriteriaInputSchema,
  outputSchema: TitleAvailabilityListSchema,
  target: "discovery",
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: false,
  handler: (service, input) => service.getRecommendations(input.genre),
});
