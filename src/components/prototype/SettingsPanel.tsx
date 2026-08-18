import { useEffect, useRef } from "react";
import { listPersonas } from "../../data/personas";
import { ABOUT_LINES, THINGS_TO_TRY } from "../../agent/capabilities";

/**
 * Prototype settings, grouped into sections: the simulated demo account,
 * developer view, scenario reset controls, and prototype disclosures. All
 * Peacock-specific prototype controls live here rather than in the app header.
 *
 * The dialog is constrained to the viewport with an internally scrollable body
 * and a persistent (sticky) header close button, so every action stays
 * reachable regardless of viewport height. Escape and backdrop clicks close it,
 * focus is moved into the dialog on open and contained while open, and focus is
 * returned to the previously focused element (the settings button) on close.
 */
export function SettingsPanel({
  open,
  connectedPersonaId,
  debug,
  policyMode,
  onSelectPersona,
  onToggleDebug,
  onTogglePolicy,
  onDisconnect,
  onReset,
  onClear,
  onTryPrompt,
  onClose,
}: {
  open: boolean;
  connectedPersonaId: string | null;
  debug: boolean;
  /** Whether the OpenAI Policy Inspector badges are shown on assistant turns. */
  policyMode: boolean;
  onSelectPersona: (personaId: string) => void;
  onToggleDebug: () => void;
  onTogglePolicy: () => void;
  onDisconnect: () => void;
  onReset: () => void;
  onClear: () => void;
  /** Send one of the Peacock-specific example prompts into the conversation. */
  onTryPrompt: (prompt: string) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Focus management + Escape handling + focus containment, while open.
  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const items = Array.from(focusable).filter((el) => !el.hasAttribute("disabled"));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="overlay sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="sheet settings-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-header">
          <h2 id="settings-title">Prototype settings</h2>
          <button
            className="iconbtn dialog-close"
            aria-label="Close prototype settings"
            onClick={onClose}
            ref={closeRef}
          >
            ×
          </button>
        </div>

        <div className="sheet-body">
          <section className="settings-section">
            <h3>Demo account</h3>
            <p className="note">
              {connectedPersonaId
                ? "Peacock is connected to a simulated demo account."
                : "Peacock is not connected. Choose a demo account to connect."}
            </p>
            <div className="settings-list">
              {listPersonas().map((p) => (
                <button
                  key={p.id}
                  className={`persona btn ghost${connectedPersonaId === p.id ? " selected" : ""}`}
                  aria-pressed={connectedPersonaId === p.id}
                  onClick={() => onSelectPersona(p.id)}
                >
                  <span>
                    <span className="name">{p.displayName}</span>
                    <span className="blurb">{p.blurb}</span>
                  </span>
                  <span aria-hidden="true">{connectedPersonaId === p.id ? "✓" : "→"}</span>
                </button>
              ))}
              {connectedPersonaId && (
                <button className="btn" onClick={onDisconnect}>
                  Disconnect Peacock
                </button>
              )}
            </div>
          </section>

          <section className="settings-section">
            <h3>Things to try</h3>
            <p className="note">
              Peacock-specific example prompts. Tap one to send it into the conversation.
            </p>
            <div className="settings-list">
              {THINGS_TO_TRY.map((prompt) => (
                <button
                  key={prompt}
                  className="btn action"
                  onClick={() => onTryPrompt(prompt)}
                >
                  <span className="name">{prompt}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3>Developer</h3>
            <label className="toggle">
              <input type="checkbox" checked={debug} onChange={onToggleDebug} />
              <span>Show tool activity in replies</span>
            </label>
            <label className="toggle">
              <input type="checkbox" checked={policyMode} onChange={onTogglePolicy} />
              <span>Show OpenAI policy status</span>
            </label>
            <p className="note">
              Tags each assistant reply GREEN / YELLOW / RED against OpenAI's published plugin
              guidance, for stakeholder review.
            </p>
          </section>

          <section className="settings-section">
            <h3>Scenario</h3>
            <div className="settings-list">
              <button className="btn action" onClick={onReset}>
                <span className="name">Reset scenario</span>
                <span className="blurb">
                  Restore the selected demo account to its original fixture state and clear the
                  conversation.
                </span>
              </button>
              <button className="btn action" onClick={onClear}>
                <span className="name">Clear all local state</span>
                <span className="blurb">
                  Remove prototype persistence and return everything to the initial disconnected
                  state.
                </span>
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h3>About</h3>
            {ABOUT_LINES.map((line) => (
              <p className="note" key={line}>
                {line}
              </p>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
