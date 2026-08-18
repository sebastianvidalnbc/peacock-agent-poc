import type { ReactNode } from "react";
import type { SubscriptionStatus } from "../../peacock/types";

/** Small Peacock source mark — brand colour appears only inside artifacts. */
export function PeacockMark() {
  return <span className="peacock-mark" aria-hidden="true" />;
}

/**
 * Peacock-sourced artifact frame — an app/tool result embedded in the chat.
 *
 * Branding de-duplication (OpenAI Plugin UI guidance): the ChatGPT host already
 * attributes the widget to Peacock, so the in-card source row (mark + "Peacock"
 * label) is suppressed by default to avoid duplicating the app name inside the
 * widget. The accessible name still credits Peacock via the section aria-label.
 * Pass `showSource` when a card is rendered outside host attribution and needs
 * to carry its own source mark. An optional footer exposes the primary action.
 */
export function CardShell({
  title,
  children,
  footer,
  showSource = false,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Render the in-card Peacock source row. Default false to de-dupe branding. */
  showSource?: boolean;
}) {
  return (
    <section className="card" aria-label={`${title} — from Peacock`}>
      {showSource && (
        <header className="card-top">
          <PeacockMark />
          <span className="card-source">Peacock</span>
        </header>
      )}
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        {children}
      </div>
      {footer && <footer className="card-foot">{footer}</footer>}
    </section>
  );
}

export function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="kv">
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: SubscriptionStatus }) {
  const tone = status === "active" ? "good" : status === "lapsed" ? "warn" : "bad";
  return <span className={`badge ${tone}`}>{status}</span>;
}
