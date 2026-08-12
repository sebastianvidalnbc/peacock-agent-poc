import { listPersonas } from "../../data/personas";
import { ABOUT_LINES } from "../../agent/capabilities";

/**
 * Prototype settings, grouped into sections: the simulated demo account,
 * developer view, scenario reset controls, and prototype disclosures. All
 * Peacock-specific prototype controls live here rather than in the app header.
 */
export function SettingsPanel({
  open,
  connectedPersonaId,
  debug,
  onSelectPersona,
  onToggleDebug,
  onDisconnect,
  onReset,
  onClear,
  onClose,
}: {
  open: boolean;
  connectedPersonaId: string | null;
  debug: boolean;
  onSelectPersona: (personaId: string) => void;
  onToggleDebug: () => void;
  onDisconnect: () => void;
  onReset: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title">Prototype settings</h2>

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
          <h3>Developer</h3>
          <label className="toggle">
            <input type="checkbox" checked={debug} onChange={onToggleDebug} />
            <span>Show tool activity in replies</span>
          </label>
        </section>

        <section className="settings-section">
          <h3>Scenario</h3>
          <div className="settings-list">
            <button className="btn" onClick={onReset}>
              Reset scenario (restore fixtures)
            </button>
            <button className="btn" onClick={onClear}>
              Clear all local state
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

        <div className="row">
          <button className="btn ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
