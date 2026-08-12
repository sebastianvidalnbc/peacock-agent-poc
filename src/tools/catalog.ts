import { defineTool } from "./tool";
import {
  CatalogTitleSchema,
  ContentIdInputSchema,
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
  handler: (service, input) => service.searchCatalog(input.query),
});

export const getTitleDetailsTool = defineTool({
  name: "get_title_details",
  title: "Get title details",
  description:
    "Return full details for a single catalog title by its content id. Does not require a connection.",
  inputSchema: ContentIdInputSchema,
  outputSchema: CatalogTitleSchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: false,
  handler: (service, input) => service.getTitleDetails(input.contentId),
});
