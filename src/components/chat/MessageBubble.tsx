import type { AssistantAction, ChatMessage } from "../../agent/types";
import { PeacockCard } from "../peacock/PeacockCard";

export function MessageBubble({
  message,
  debug,
  previewOpen = false,
  onAction,
}: {
  message: ChatMessage;
  debug: boolean;
  /** Whether the inline preview for this message's title_offer card is shown. */
  previewOpen?: boolean;
  onAction: (action: AssistantAction, messageId: string) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`msg ${isUser ? "user" : "assistant"}`}>
      <div className="col">
        {message.text && <div className={isUser ? "bubble" : "prose"}>{message.text}</div>}
        {message.card && <PeacockCard card={message.card} previewOpen={previewOpen} />}
        {message.actions && message.actions.length > 0 && (
          <div className="actions">
            {message.actions.map((a, i) => (
              <button
                key={a.id}
                className={`btn ${i === 0 ? "primary" : "ghost"}`}
                onClick={() => onAction(a, message.id)}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
        {debug && message.toolName && (
          <div className="tool-chip" aria-label="Tool activity">
            <span className="tool-dot" aria-hidden="true" />
            Peacock · {message.toolName} · Completed
          </div>
        )}
        {debug && !isUser && message.debug && (
          <div className="intent-inspector" aria-label="Intent inspector">
            <span className="ii-item">
              <span className="ii-key">Intent</span> {message.debug.intent}
            </span>
            {message.debug.title && (
              <span className="ii-item">
                <span className="ii-key">Title</span> {message.debug.title}
              </span>
            )}
            {message.debug.provider && (
              <span className="ii-item">
                <span className="ii-key">Provider</span> {message.debug.provider}
              </span>
            )}
            {message.debug.tool && (
              <span className="ii-item">
                <span className="ii-key">Tool</span> {message.debug.tool}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
