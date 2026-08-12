import { useState, type KeyboardEvent } from "react";

export function Composer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");

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

  return (
    <div className="composer">
      <div className="composer-field">
        <label htmlFor="composer-input" className="sr-only">
          Ask anything
        </label>
        <textarea
          id="composer-input"
          placeholder="Ask anything…"
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
          ↑
        </button>
      </div>
    </div>
  );
}
