import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/** The canonical explicit-invocation token inserted by the "@" picker. */
const PEACOCK_MENTION = "@PeacockTV";
/** Matches a leading Peacock mention so the composer can badge it. */
const LEADING_MENTION = /^\s*@peacock(?:tv)?\b/i;
/** True when the caret sits right after a lone "@" (start or after space). */
const AT_TRIGGER = /(^|\s)@$/;

/**
 * Modern ChatGPT-style mobile composer: a rounded floating field with an
 * auto-growing textarea, an integrated send button, and a "+" tools menu that
 * frames Peacock as one capability available to the assistant. Typing "@"
 * offers a lightweight mention picker that inserts an "@PeacockTV" token to
 * explicitly route a request through Peacock. Enter sends; Shift+Enter inserts a
 * newline.
 */
export function Composer({
  onSend,
  disabled,
  peacockConnected,
  onPeacockTool,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
  peacockConnected: boolean;
  onPeacockTool: () => void;
}) {
  const [value, setValue] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);
  const mentionRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasMention = LEADING_MENTION.test(value);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    setMentionOpen(false);
    onSend(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function onChange(next: string) {
    setValue(next);
    // Offer the Peacock mention as soon as the user types a lone "@".
    setMentionOpen(AT_TRIGGER.test(next));
  }

  // Replace the triggering "@" with the Peacock token, keeping any text the
  // user had already typed before it, and refocus the field for a fast flow.
  function insertPeacockMention() {
    setValue((prev) => `${prev.replace(/@$/, "")}${PEACOCK_MENTION} `.replace(/^\s+/, ""));
    setMentionOpen(false);
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function onInput(e: { currentTarget: HTMLTextAreaElement }) {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  // Close the tools menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    function onDocDown(e: MouseEvent) {
      if (!toolsRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Close the "@" mention picker on outside click or Escape.
  useEffect(() => {
    if (!mentionOpen) return;
    function onDocDown(e: MouseEvent) {
      if (!mentionRef.current?.contains(e.target as Node)) setMentionOpen(false);
    }
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") setMentionOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [mentionOpen]);

  return (
    <div className="composer">
      {hasMention && (
        <div className="mention-chip-row" aria-hidden="true">
          <span className="mention-chip">
            <span className="mention-chip-mark" />
            {PEACOCK_MENTION}
          </span>
          <span className="mention-chip-note">routing this request through Peacock</span>
        </div>
      )}
      <div className="composer-field">
        <div className="tools" ref={toolsRef}>
          <button
            type="button"
            className="tools-trigger"
            aria-label="Add attachment or tool"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          {menuOpen && (
            <div className="tools-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="tools-item"
                onClick={() => {
                  setMenuOpen(false);
                  onPeacockTool();
                }}
              >
                <span className="tools-mark" aria-hidden="true" />
                <span className="tools-label">Peacock</span>
                <span className={`tools-state${peacockConnected ? " on" : ""}`}>
                  {peacockConnected ? "Connected" : "Connect"}
                </span>
              </button>
              <button type="button" role="menuitem" className="tools-item" disabled>
                <span className="tools-mark neutral" aria-hidden="true" />
                <span className="tools-label">Add photo</span>
              </button>
              <button type="button" role="menuitem" className="tools-item" disabled>
                <span className="tools-mark neutral" aria-hidden="true" />
                <span className="tools-label">Add file</span>
              </button>
            </div>
          )}
        </div>

        <div className="mention" ref={mentionRef}>
          {mentionOpen && (
            <div className="mention-menu" role="menu" aria-label="Mention an app">
              <button
                type="button"
                role="menuitem"
                className="tools-item"
                onClick={insertPeacockMention}
              >
                <span className="tools-mark" aria-hidden="true" />
                <span className="tools-label">Peacock</span>
                <span className="tools-state">@PeacockTV</span>
              </button>
            </div>
          )}
        </div>

        <label htmlFor="composer-input" className="sr-only">
          Ask anything
        </label>
        <textarea
          id="composer-input"
          ref={textareaRef}
          placeholder="Ask anything"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onInput={onInput}
          onKeyDown={onKeyDown}
          rows={1}
        />
        <button
          className="send"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          title="Send"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M12 20V5M6 11l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
