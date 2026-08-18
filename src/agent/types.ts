import type {
  AccountSummary,
  Capability,
  CatalogTitle,
  Entitlements,
  NextEpisode,
  PlaybackDestination,
  PreviewInfo,
  Subscription,
  TitleAvailability,
  ViewingProgress,
} from "../peacock/types";
import type { PolicyStatus } from "../policy/policy";
import type { AuthMode } from "../tools/access";

/**
 * The Access Inspector descriptor for a turn: the effective MCP auth mode
 * (Guest vs connected) and its short label. Client-side chrome only — surfaced
 * alongside the intent/policy inspectors, never part of MCP tool output.
 */
export interface AccessInfo {
  mode: AuthMode;
  label: string;
}

/**
 * A cross-service availability row as rendered in the UI: the raw title plus a
 * flag the agent sets when the user's connected Peacock account already covers
 * it (connection present and the title is on Peacock). This is the only place
 * "ownership" is inferred, and only for Peacock — never for other providers.
 */
export interface DiscoveryRow {
  title: TitleAvailability;
  /** True when the connected Peacock account already provides this title. */
  ownedOnPeacock: boolean;
}

/** Structured Peacock content rendered as a card beneath an assistant reply. */
export type PeacockCard =
  | { kind: "account"; data: AccountSummary }
  | { kind: "subscription"; data: Subscription }
  | { kind: "entitlements"; data: Entitlements }
  | { kind: "capabilities"; data: Capability[] }
  | { kind: "watchlist"; data: CatalogTitle[] }
  | { kind: "search"; data: CatalogTitle[] }
  | { kind: "title"; data: CatalogTitle }
  /**
   * A content-discovery offer for a single title: shows availability, an
   * optional inline preview, and a connect/open call to action for the Peacock
   * playback handoff.
   */
  | { kind: "title_offer"; data: CatalogTitle; preview?: PreviewInfo }
  /** A confirmed Peacock playback handoff destination for a title. */
  | { kind: "handoff"; data: CatalogTitle; destination: PlaybackDestination }
  /**
   * Cross-service "where to watch" for a single title: a neutral list of
   * provider rows. The Peacock row is distinguished, and marked as owned when
   * the connected account covers it.
   */
  | { kind: "where_to_watch"; data: TitleAvailability; ownedOnPeacock: boolean; connected: boolean }
  /** A cross-service discovery result: several titles with availability. */
  | { kind: "discovery"; rows: DiscoveryRow[]; connected: boolean }
  /**
   * Continue Watching / resume: one or more in-progress titles from the
   * connected account's simulated viewing state, with a resume call to action.
   * `nextEpisode` is populated for a "what's next in X?" answer.
   */
  | {
      kind: "continue_watching";
      items: ViewingProgress[];
      title: CatalogTitle;
      nextEpisode?: NextEpisode;
    }
  | { kind: "connect" };

/**
 * An interactive action offered by the assistant. `connect` starts the
 * simulated authorization; `preview` toggles an inline preview player; `open`
 * requests the Peacock playback handoff for a title.
 */
export interface AssistantAction {
  id: string;
  kind: "connect" | "preview" | "open" | "resume" | "plans_info";
  label: string;
  /** Original user text to re-run automatically once connected. */
  resumeText?: string;
  /** Title the action applies to (for preview/open/resume). */
  contentId?: string;
}

/**
 * A compact, debug-only trace of how a turn was routed: the resolved intent, the
 * title and provider entities that were extracted (if any), and the tool that
 * ran. Surfaced only when the prototype's debug ("show tool activity") mode is
 * on, and never part of the assistant's user-facing copy.
 */
export interface DebugTrace {
  intent: string;
  /**
   * How the turn was invoked: "explicit Peacock" when the user began with an
   * `@PeacockTV` mention, otherwise "implicit". Mirrors the brief's debug lines.
   */
  invocation: "explicit Peacock" | "implicit";
  title?: string;
  provider?: string;
  tool?: string;
}

/** The assistant's structured reply to a single user turn. */
export interface AgentResponse {
  text: string;
  card?: PeacockCard;
  actions?: AssistantAction[];
  /** Name of the tool invoked, for the prototype's tool-activity indicator. */
  toolName?: string;
  /** Debug-only routing trace, populated by the agent for the intent inspector. */
  debug?: DebugTrace;
  /**
   * Policy Inspector classification for this turn (client-side chrome only).
   * Never included in MCP structured tool output.
   */
  policy?: PolicyStatus;
  /** Governing OpenAI doc identifier for the policy status, when known. */
  policySource?: string;
  /**
   * Access Inspector descriptor for this turn (Guest / noauth vs Connected
   * Peacock / oauth2). Client-side chrome only; never part of MCP tool output.
   */
  access?: AccessInfo;
}

export type ChatRole = "user" | "assistant";

/** A message in the chat transcript. */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  card?: PeacockCard;
  actions?: AssistantAction[];
  toolName?: string;
  /** Debug-only routing trace, shown in the intent inspector when debug is on. */
  debug?: DebugTrace;
  /** Policy Inspector classification for this turn (client-side chrome only). */
  policy?: PolicyStatus;
  /** Governing OpenAI doc identifier for the policy status, when known. */
  policySource?: string;
  /** Access Inspector descriptor for this turn (client-side chrome only). */
  access?: AccessInfo;
}
