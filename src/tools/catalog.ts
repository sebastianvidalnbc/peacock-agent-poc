import { defineTool } from "./tool";
import {
  CatalogTitleSchema,
  ContentIdInputSchema,
  PlaybackDestinationSchema,
  PreviewInfoSchema,
  SearchInputSchema,
  SearchResultsSchema,
} from "../peacock/schemas";

export const searchCatalogTool = defineTool({
  name: "search_catalog",
  title: "Search catalog",
  description:
    "Search the demo Peacock catalog by title, genre, or keyword and return matching titles. Does not require a connection.",
  inputSchema: SearchInputSchema,
  outputSchema: SearchResultsSchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: false,
  authModes: ["noauth", "oauth2"],
  readOnlyHint: true,
  openWorldHint: true,
  handler: (service, input) => service.searchCatalog(input.query),
});

export const getTitleDetailsTool = defineTool({
  name: "get_title_details",
  title: "Get title details",
  description:
    "Return full details for a single catalog title by its content id, including Peacock availability and whether a preview or playback handoff exists. Does not require a connection.",
  inputSchema: ContentIdInputSchema,
  outputSchema: CatalogTitleSchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: false,
  authModes: ["noauth", "oauth2"],
  readOnlyHint: true,
  openWorldHint: true,
  handler: (service, input) => service.getTitleDetails(input.contentId),
});

export const getPreviewTool = defineTool({
  name: "get_preview",
  title: "Get preview",
  description:
    "Return simulated, prototype-safe preview availability and metadata for a title (type, duration, mock preview identifier). Does not stream a real asset and does not require a connection.",
  inputSchema: ContentIdInputSchema,
  outputSchema: PreviewInfoSchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: false,
  authModes: ["noauth", "oauth2"],
  readOnlyHint: true,
  openWorldHint: false,
  handler: (service, input) => service.getPreview(input.contentId),
});

export const getPlaybackDestinationTool = defineTool({
  name: "get_playback_destination",
  title: "Get playback destination",
  description:
    "Return the simulated Peacock playback-handoff destination for a title, including whether a Peacock connection is required and a mock deep-link. The destination is simulated for the prototype.",
  inputSchema: ContentIdInputSchema,
  outputSchema: PlaybackDestinationSchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: false,
  // Dual-mode: a Guest gets the public open-destination; a connected account
  // gets the same handoff with account-aware context layered on by the agent.
  authModes: ["noauth", "oauth2"],
  readOnlyHint: true,
  // Handoff to the external Peacock app — an open-world interaction.
  openWorldHint: true,
  handler: (service, input) => service.getPlaybackDestination(input.contentId),
});
