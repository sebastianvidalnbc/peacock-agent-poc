import type {
  AccountSummary,
  Capability,
  CatalogTitle,
  Entitlements,
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
  | { kind: "connect" };

/** An interactive action offered by the assistant (Phase 1: connect only). */
export interface AssistantAction {
  id: string;
  kind: "connect";
  label: string;
  /** Original user text to re-run automatically once connected. */
  resumeText?: string;
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
