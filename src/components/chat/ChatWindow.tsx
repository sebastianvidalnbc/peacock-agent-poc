import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AssistantAction, ChatMessage } from "../../agent/types";
import { MessageBubble } from "./MessageBubble";
import { Composer } from "./Composer";

/** Px from the bottom within which we consider the user to be "following". */
const FOLLOW_THRESHOLD = 120;
/** Px of breathing room left above an aligned assistant turn. */
const TOP_GUTTER = 12;

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
  const threadRef = useRef<HTMLDivElement>(null);
  // Ref to the DOM node of the newest turn, so we can align its *start* near
  // the top of the viewport rather than always jumping to the absolute bottom.
  const lastTurnRef = useRef<HTMLDivElement>(null);
  const [nearBottom, setNearBottom] = useState(true);
  const empty = messages.length === 0;
  const last = messages.length ? messages[messages.length - 1] : null;
  const lastRole = last?.role ?? null;

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= FOLLOW_THRESHOLD;
  }, []);

  // Track whether the user is following the latest turn or has scrolled up.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setNearBottom(isNearBottom());
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isNearBottom]);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Align the start of the newest turn near the top of the viewport. If the
  // turn is shorter than the viewport this naturally rests at the bottom. Only
  // ever scrolls the conversation container — never the document.
  const alignLatestTurn = useCallback((smooth = true) => {
    const el = scrollRef.current;
    const turn = lastTurnRef.current;
    if (!el) return;
    if (!turn) {
      scrollToBottom(smooth);
      return;
    }
    const target = Math.min(
      Math.max(0, turn.offsetTop - TOP_GUTTER),
      el.scrollHeight - el.clientHeight,
    );
    el.scrollTo({ top: target, behavior: smooth ? "smooth" : "auto" });
  }, [scrollToBottom]);

  // Reset to the initial state whenever the conversation is cleared (New chat /
  // Reset scenario / Clear). Does not touch connection/account state.
  useLayoutEffect(() => {
    if (empty) {
      setNearBottom(true);
      const el = scrollRef.current;
      if (el) el.scrollTop = 0;
    }
  }, [empty]);

  // Autoscroll on new turns. User sends -> pin bottom (their message sits above
  // the composer). Assistant thinking/reply -> align the start of the turn near
  // the top so long responses are never hidden below the fold. Only auto-follow
  // if the user was already near the latest turn.
  useLayoutEffect(() => {
    if (empty) return;
    if (lastRole === "user") {
      scrollToBottom(true);
      setNearBottom(true);
      return;
    }
    if (nearBottom) alignLatestTurn(true);
  }, [messages.length, pending, lastRole, empty, nearBottom, scrollToBottom, alignLatestTurn]);

  // Cards, previews, carousels and images can grow after first paint. While the
  // user is following, keep the newest turn's start in view as it settles.
  useEffect(() => {
    const thread = threadRef.current;
    if (!thread || empty) return;
    const ro = new ResizeObserver(() => {
      if (nearBottom) alignLatestTurn(false);
    });
    ro.observe(thread);
    return () => ro.disconnect();
  }, [empty, nearBottom, alignLatestTurn]);

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
          <div className="thread" ref={threadRef}>
            {messages.map((m, i) => {
              const isLast = i === messages.length - 1;
              return (
                <div key={m.id} ref={isLast ? lastTurnRef : undefined}>
                  <MessageBubble
                    message={m}
                    debug={debug}
                    policyMode={policyMode}
                    previewOpen={previewOpenIds.has(m.id)}
                    onAction={onAction}
                  />
                </div>
              );
            })}

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
      <div className="composer-wrap">
        {!empty && !nearBottom && (
          <button
            type="button"
            className="jump-latest"
            onClick={() => scrollToBottom(true)}
            aria-label="Jump to latest message"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Latest
          </button>
        )}
        <Composer
          onSend={onSend}
          disabled={pending}
          peacockConnected={peacockConnected}
          onPeacockTool={onPeacockTool}
        />
      </div>
    </>
  );
}
