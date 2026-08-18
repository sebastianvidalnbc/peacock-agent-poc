import type { AssistantAction, ChatMessage } from "../../agent/types";
import { PeacockCard } from "../peacock/PeacockCard";
import { policyLabelFor } from "../../policy/policy";

export function MessageBubble({
  message,
  debug,
  policyMode = false,
  previewOpen = false,
  onAction,
}: {
  message: ChatMessage;
  debug: boolean;
  /** Whether the OpenAI Policy Inspector badge should be shown for this turn. */
  policyMode?: boolean;
  /** Whether the inline preview for this message's title_offer card is shown. */
  previewOpen?: boolean;
  onAction: (action: AssistantAction, messageId: string) => void;
}) {
  const isUser = message.role === "user";
  // Highlight a leading @PeacockTV / @Peacock mention in a user turn so the
  // explicit invocation reads as a distinct token rather than plain text.
  const mention = isUser ? message.text.match(/^\s*(@peacock(?:tv)?)\b/i) : null;
  return (
    <div className={`msg ${isUser ? "user" : "assistant"}`}>
      <div className="col">
        {message.text && (
          <div className={isUser ? "bubble" : "prose"}>
            {mention ? (
              <>
                <span className="msg-mention">{mention[1]}</span>
                {message.text.slice(mention[0].length)}
              </>
            ) : (
              message.text
            )}
          </div>
        )}
        {message.card && <PeacockCard card={message.card} previewOpen={previewOpen} />}
        {policyMode && !isUser && message.policy && (
          <div className={`policy-badge policy-${message.policy}`} aria-label="OpenAI policy status">
            <span className="policy-dot" aria-hidden="true" />
            {policyLabelFor(message.policy)}
            {message.policySource ? ` · ${message.policySource}` : ""}
          </div>
        )}
        {message.actions && message.actions.length > 0 && (
          <div className="actions">
            {message.actions.map((a, i) => {
              // Emphasize at most two actions (primary + secondary) per card,
              // per OpenAI Plugin UI guidance; any extra actions render as ghost.
              const emphasis = i === 0 ? "primary" : i === 1 ? "secondary" : "ghost";
              // Peacock-accent the primary CTA only for Peacock playback handoffs
              // (open / resume) — never for neutral or informational actions.
              const accent =
                i === 0 && (a.kind === "open" || a.kind === "resume") ? " primary-accent" : "";
              return (
                <button
                  key={a.id}
                  className={`btn ${emphasis}${accent}`}
                  onClick={() => onAction(a, message.id)}
                >
                  {a.label}
                </button>
              );
            })}
          </div>
        )}
        {debug && message.toolName && (
          <div className="tool-chip" aria-label="Tool activity">
            <span className="tool-dot" aria-hidden="true" />
            Peacock · {message.toolName} · Completed
          </div>
        )}
        {(debug || policyMode) && !isUser && message.access && (
          <div className="access-inspector" aria-label="Access inspector">
            <span className="ii-item">
              <span className="ii-key">Access</span> {message.access.label}
            </span>
          </div>
        )}
        {debug && !isUser && message.debug && (
          <div className="intent-inspector" aria-label="Intent inspector">
            <span className="ii-item">
              <span className="ii-key">Invocation</span> {message.debug.invocation}
            </span>
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
