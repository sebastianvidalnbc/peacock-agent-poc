import { defineTool } from "./tool";
import {
  ContentIdInputSchema,
  EmptyInputSchema,
  NextEpisodeSchema,
  ViewingHistorySchema,
  ViewingProgressSchema,
} from "../peacock/schemas";

/**
 * Continue Watching / resume / viewing-history tools. All are read-only,
 * account-scoped reads of the connected persona's simulated viewing state
 * (GREEN under current OpenAI plugin guidance). They never mutate progress and
 * never reach outside the account, so openWorldHint is false.
 */

export const getViewingHistoryTool = defineTool({
  name: "get_viewing_history",
  title: "Get viewing history",
  description:
    "Return the connected account's simulated viewing history (per-title progress, newest first), including completed and in-progress titles.",
  inputSchema: EmptyInputSchema,
  outputSchema: ViewingHistorySchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: true,
  authModes: ["oauth2"],
  readOnlyHint: true,
  openWorldHint: false,
  handler: (service) => service.getViewingHistory(),
});

export const getContinueWatchingTool = defineTool({
  name: "get_continue_watching",
  title: "Get Continue Watching",
  description:
    "Return the connected account's in-progress titles for a Continue Watching rail (the not-yet-completed subset of viewing history), newest first.",
  inputSchema: EmptyInputSchema,
  outputSchema: ViewingHistorySchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: true,
  authModes: ["oauth2"],
  readOnlyHint: true,
  openWorldHint: false,
  handler: (service) => service.getContinueWatching(),
});

export const getResumePositionTool = defineTool({
  name: "get_resume_position",
  title: "Get resume position",
  description:
    "Return where the connected account left off in a single title (progress and duration in seconds, and completion), or null when there is no saved position.",
  inputSchema: ContentIdInputSchema,
  outputSchema: ViewingProgressSchema.nullable(),
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: true,
  authModes: ["oauth2"],
  readOnlyHint: true,
  openWorldHint: false,
  handler: (service, input) => service.getResumePosition(input.contentId),
});

export const getNextEpisodeTool = defineTool({
  name: "get_next_episode",
  title: "Get next episode",
  description:
    "Return next-episode metadata for a series after the account's last-watched point (season, episode number and title), or null when none is modelled.",
  inputSchema: ContentIdInputSchema,
  outputSchema: NextEpisodeSchema.nullable(),
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: true,
  authModes: ["oauth2"],
  readOnlyHint: true,
  openWorldHint: false,
  handler: (service, input) => service.getNextEpisode(input.contentId),
});
