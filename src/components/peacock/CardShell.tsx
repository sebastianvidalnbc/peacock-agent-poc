import type { ReactNode } from "react";
import type { SubscriptionStatus } from "../../peacock/types";

/** Peacock-sourced card frame. A source eyebrow attributes the data to Peacock. */
export function CardShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card" aria-label={`${title} (from Peacock)`}>
      <header className="card-top">
        <span className="stripe" aria-hidden="true" />
        <div className="card-heading">
          <span className="card-source">Peacock</span>
          <span className="card-title">{title}</span>
        </div>
      </header>
      <div className="card-body">{children}</div>
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
