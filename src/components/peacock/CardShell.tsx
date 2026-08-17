import type { ReactNode } from "react";
import type { SubscriptionStatus } from "../../peacock/types";

/** Small Peacock source mark — brand colour appears only inside artifacts. */
export function PeacockMark() {
  return <span className="peacock-mark" aria-hidden="true" />;
}

/**
 * Peacock-sourced artifact frame — an app/tool result embedded in the chat. A
 * quiet source row attributes the data to Peacock; an optional footer exposes
 * the primary next action for the artifact.
 */
export function CardShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="card" aria-label={`${title} — from Peacock`}>
      <header className="card-top">
        <PeacockMark />
        <span className="card-source">Peacock</span>
      </header>
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
