import { useEffect, useRef } from "react";
import { PeacockMark } from "../peacock/CardShell";

/**
 * Simulated Peacock authorization presented as a mobile app-authorization
 * sheet rather than a developer modal. No real username, password, MFA, or
 * payment details are ever requested. Continuing connects the default demo
 * persona (handled by the caller) so the original request can resume. Demo
 * persona selection is never exposed here — it lives only in Prototype
 * Settings.
 */
const GRANTS = [
  "View your Peacock account",
  "View subscription information",
  "Access your watchlist",
  "Manage your watchlist",
];

export function PeacockAuthDialog({
  open,
  onContinue,
  onCancel,
}: {
  open: boolean;
  onContinue: () => void;
  onCancel: () => void;
}) {
  const continueRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    continueRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCancel();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="overlay sheet-overlay" role="presentation" onClick={onCancel}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="peacock-auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber" aria-hidden="true" />
        <div className="sheet-body">
          <div className="auth-brand">
            <PeacockMark />
            <span className="card-source">Peacock</span>
          </div>
          <h2 id="peacock-auth-title">Connect Peacock</h2>
          <p className="note">
            Let your AI assistant use your Peacock account to:
          </p>
          <ul className="grants">
            {GRANTS.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
          <p className="note">
            Simulated connection — no username, password, MFA, or payment details are requested.
          </p>
          <div className="sheet-actions">
            <button className="btn primary block" onClick={onContinue} ref={continueRef}>
              Connect Peacock
            </button>
            <button className="btn ghost block" onClick={onCancel}>
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
