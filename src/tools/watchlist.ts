import { defineTool } from "./tool";
import {
  ContentIdInputSchema,
  EmptyInputSchema,
  WatchlistSchema,
} from "../peacock/schemas";

export const getWatchlistTool = defineTool({
  name: "get_watchlist",
  title: "Get watchlist",
  description: "Return the connected account's current watchlist as a list of titles.",
  inputSchema: EmptyInputSchema,
  outputSchema: WatchlistSchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: true,
  authModes: ["oauth2"],
  readOnlyHint: true,
  openWorldHint: false,
  handler: (service) => service.getWatchlist(),
});

export const addToWatchlistTool = defineTool({
  name: "add_to_watchlist",
  title: "Add to watchlist",
  description:
    "Add a title (by content id) to the connected account's watchlist. Returns the updated watchlist. Idempotent — adding an existing title is a no-op.",
  inputSchema: ContentIdInputSchema,
  outputSchema: WatchlistSchema,
  mutates: true,
  requiresConfirmation: false,
  requiresAuth: true,
  authModes: ["oauth2"],
  readOnlyHint: false,
  // A watchlist add is a reversible personal write, not a destructive update.
  destructiveHint: false,
  openWorldHint: true,
  handler: (service, input) => service.addToWatchlist(input.contentId),
});

export const removeFromWatchlistTool = defineTool({
  name: "remove_from_watchlist",
  title: "Remove from watchlist",
  description:
    "Remove a title (by content id) from the connected account's watchlist. Returns the updated watchlist.",
  inputSchema: ContentIdInputSchema,
  outputSchema: WatchlistSchema,
  mutates: true,
  requiresConfirmation: false,
  requiresAuth: true,
  authModes: ["oauth2"],
  readOnlyHint: false,
  // Reversible: the title can be re-added, so not a destructive update.
  destructiveHint: false,
  openWorldHint: true,
  handler: (service, input) => service.removeFromWatchlist(input.contentId),
});
