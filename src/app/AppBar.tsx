/** Neutral assistant header. Peacock only appears once it's relevant in-chat. */
export function AppBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  return (
    <header className="appbar">
      <div className="brand">
        <span className="dot" aria-hidden="true" />
        <span>AI Assistant</span>
      </div>
      <div className="spacer" />
      <button
        className="iconbtn ghost"
        onClick={onOpenSettings}
        aria-label="Prototype settings"
        title="Prototype settings"
      >
        ⚙️
      </button>
    </header>
  );
}
