import { useEffect, useRef } from "react";
import type { AssistantAction, ChatMessage } from "../../agent/types";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";

export function ChatWindow({
  messages,
  pending,
  debug,
  policyMode,
  previewOpenIds,
  peacockConnected,
  onSend,
  onAction,
  onPeacockTool,
}: {
  messages: ChatMessage[];
  pending: boolean;
  debug: boolean;
  /** Whether the OpenAI Policy Inspector badges are shown on assistant turns. */
  policyMode: boolean;
  /** Message ids whose inline title-offer preview is currently shown. */
  previewOpenIds: ReadonlySet<string>;
  /** Whether a Peacock persona is connected (drives the composer tools menu). */
  peacockConnected: boolean;
  onSend: (text: string) => void;
  onAction: (action: AssistantAction, messageId: string) => void;
  /** Invoked from the composer "+" menu when the user taps Peacock. */
  onPeacockTool: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastRole = messages.length ? messages[messages.length - 1].role : null;

  // Keep the newest turn in a readable position. When the user sends, pin the
  // bottom so their message is visible above the composer; assistant replies
  // then grow downward without a jarring jump back to the very bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (lastRole === "user" || pending) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages.length, pending, lastRole]);

  const empty = messages.length === 0;

  return (
    <>
      <div
        className={`chat${empty ? " empty" : ""}`}
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        ref={scrollRef}
      >
        {empty ? (
          // Neutral empty state: the composer is the only affordance. No
          // greeting, starter prompts, or capability hints — capabilities are
          // revealed only after the user expresses an intent.
          <div className="welcome" aria-hidden="true" />
        ) : (
          <div className="thread">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                debug={debug}
                policyMode={policyMode}
                previewOpen={previewOpenIds.has(m.id)}
                onAction={onAction}
              />
            ))}

            {pending && (
              <div className="msg assistant">
                <span className="typing" aria-label="Assistant is thinking">
                  <i /><i /><i />
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <Composer
        onSend={onSend}
        disabled={pending}
        peacockConnected={peacockConnected}
        onPeacockTool={onPeacockTool}
      />
    </>
  );
}
