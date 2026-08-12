import { useEffect, useRef } from "react";
import type { AssistantAction, ChatMessage } from "../../agent/types";
import { INITIAL_GREETING, STARTER_PROMPTS } from "../../agent/capabilities";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";

export function ChatWindow({
  messages,
  pending,
  debug,
  previewOpenIds,
  onSend,
  onAction,
}: {
  messages: ChatMessage[];
  pending: boolean;
  debug: boolean;
  /** Message ids whose inline title-offer preview is currently shown. */
  previewOpenIds: ReadonlySet<string>;
  onSend: (text: string) => void;
  onAction: (action: AssistantAction, messageId: string) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const empty = messages.length === 0;

  return (
    <>
      {empty ? (
        <div className="chat empty" role="log" aria-live="polite" aria-label="Conversation">
          <div className="welcome">
            <h1 className="greeting">{INITIAL_GREETING}</h1>
            <div className="starters">
              {STARTER_PROMPTS.map((p) => (
                <button key={p} className="starter" onClick={() => onSend(p)} disabled={pending}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div ref={endRef} />
        </div>
      ) : (
        <div className="chat" role="log" aria-live="polite" aria-label="Conversation">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              debug={debug}
              previewOpen={previewOpenIds.has(m.id)}
              onAction={onAction}
            />
          ))}

          {pending && (
            <div className="msg assistant">
              <div className="avatar" aria-hidden="true" />
              <div className="col">
                <span className="typing" aria-label="Working">
                  <i /><i /><i />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      )}
      <Composer onSend={onSend} disabled={pending} />
    </>
  );
}
