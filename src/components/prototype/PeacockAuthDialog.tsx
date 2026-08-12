/**
 * Simulated, product-level Peacock authorization. No real username, password,
 * MFA, or payment details are ever requested. Continuing connects the default
 * demo persona (handled by the caller) so the original request can resume.
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
  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="peacock-auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="card-source">Peacock</span>
        <h2 id="peacock-auth-title">Connect Peacock to your AI assistant</h2>
        <p className="note">This will allow the assistant to:</p>
        <ul className="grants">
          {GRANTS.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        <p className="note">
          Simulated connection — no username, password, MFA, or payment details are requested.
        </p>
        <div className="row">
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={onContinue} autoFocus>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
