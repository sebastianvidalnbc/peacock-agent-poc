import { useEffect, useRef, useState, type KeyboardEvent } from "react";

/**
 * Modern ChatGPT-style mobile composer: a rounded floating field with an
 * auto-growing textarea, an integrated send button, and a "+" tools menu that
 * frames Peacock as one capability available to the assistant. Enter sends;
 * Shift+Enter inserts a newline.
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
  const toolsRef = useRef<HTMLDivElement>(null);

  function submit() {
    const text = value.trim();
    if (!text || disabled) return;
    setValue("");
    onSend(text);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
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

  return (
    <div className="composer">
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

        <label htmlFor="composer-input" className="sr-only">
          Ask anything
        </label>
        <textarea
          id="composer-input"
          placeholder="Ask anything"
          value={value}
          onChange={(e) => setValue(e.target.value)}
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
