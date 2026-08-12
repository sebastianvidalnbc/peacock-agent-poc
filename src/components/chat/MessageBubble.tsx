import type { AssistantAction, ChatMessage } from "../../agent/types";
import { PeacockCard } from "../peacock/PeacockCard";

export function MessageBubble({
  message,
  debug,
  onAction,
}: {
  message: ChatMessage;
  debug: boolean;
  onAction: (action: AssistantAction) => void;
}) {
  const isUser = message.role === "user";
  return (
    <div className={`msg ${isUser ? "user" : "assistant"}`}>
      {!isUser && <div className="avatar" aria-hidden="true" />}
      <div className="col">
        <div className={isUser ? "bubble" : "prose"}>{message.text}</div>
        {message.card && <PeacockCard card={message.card} />}
        {message.actions && message.actions.length > 0 && (
          <div className="actions">
            {message.actions.map((a) => (
              <button key={a.id} className="btn primary" onClick={() => onAction(a)}>
                {a.label}
              </button>
            ))}
          </div>
        )}
        {debug && message.toolName && (
          <div className="tool-chip">Peacock · {message.toolName} · Completed</div>
        )}
      </div>
    </div>
  );
}
