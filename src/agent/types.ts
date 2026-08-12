import type {
  AccountSummary,
  Capability,
  CatalogTitle,
  Entitlements,
  PlaybackDestination,
  PreviewInfo,
  Subscription,
} from "../peacock/types";

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
  | { kind: "connect" };

/**
 * An interactive action offered by the assistant. `connect` starts the
 * simulated authorization; `preview` toggles an inline preview player; `open`
 * requests the Peacock playback handoff for a title.
 */
export interface AssistantAction {
  id: string;
  kind: "connect" | "preview" | "open";
  label: string;
  /** Original user text to re-run automatically once connected. */
  resumeText?: string;
  /** Title the action applies to (for preview/open). */
  contentId?: string;
}

/** The assistant's structured reply to a single user turn. */
export interface AgentResponse {
  text: string;
  card?: PeacockCard;
  actions?: AssistantAction[];
  /** Name of the tool invoked, for the prototype's tool-activity indicator. */
  toolName?: string;
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
}
