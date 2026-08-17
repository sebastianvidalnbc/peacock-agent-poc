/**
 * Compact, quiet mobile conversation header. The left menu opens Prototype
 * Settings (the only entry point for developer controls); the centre shows a
 * neutral assistant label; the right starts a new conversation. No Peacock,
 * persona, or debug state ever appears in the shell.
 */
export function AppBar({
  onOpenSettings,
  onNewChat,
}: {
  onOpenSettings: () => void;
  onNewChat: () => void;
}) {
  return (
    <header className="appbar">
      <button
        className="iconbtn"
        onClick={onOpenSettings}
        aria-label="Open menu and prototype settings"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="appbar-title" aria-label="AI Assistant">
        <span>AI Assistant</span>
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <button className="iconbtn" onClick={onNewChat} aria-label="New chat">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M12 20h9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </header>
  );
}
