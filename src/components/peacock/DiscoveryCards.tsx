import type { ReactNode } from "react";
import type {
  Availability,
  OfferType,
  StreamingProvider,
  TitleAvailability,
} from "../../peacock/types";
import type { DiscoveryRow } from "../../agent/types";

/**
 * Provider-neutral display labels. These are plain text only — no third-party
 * brand assets or logos are bundled, keeping the prototype trademark-safe.
 */
const PROVIDER_LABEL: Record<StreamingProvider, string> = {
  peacock: "Peacock",
  netflix: "Netflix",
  hulu: "Hulu",
  max: "Max",
  disney_plus: "Disney+",
  prime_video: "Prime Video",
  apple_tv_plus: "Apple TV+",
};

const OFFER_LABEL: Record<OfferType, string> = {
  subscription: "Subscription",
  free_ads: "Free with ads",
  rent: "Rent",
  buy: "Buy",
};

function offerDetail(a: Availability): string {
  const parts = [OFFER_LABEL[a.offerType]];
  if (a.priceLabel) parts.push(a.priceLabel);
  if (a.quality) parts.push(a.quality);
  return parts.join(" · ");
}

/**
 * Neutral, cross-service card frame. Deliberately does NOT use the Peacock
 * CardShell: cross-service discovery is provider-neutral, so it carries no
 * Peacock source mark or branding. Peacock appears only as one row among others.
 */
function NeutralShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="disc-card" aria-label={title}>
      <div className="disc-body">
        <h3 className="card-title">{title}</h3>
        {children}
      </div>
    </section>
  );
}

/** A single provider row within a where-to-watch list. */
function ProviderRow({ a, owned }: { a: Availability; owned: boolean }) {
  const isPeacock = a.provider === "peacock";
  return (
    <div className={`provider-row${isPeacock ? " peacock" : ""}`}>
      <div className="provider-main">
        <span className="provider-name">{PROVIDER_LABEL[a.provider]}</span>
        <span className="meta">{offerDetail(a)}</span>
      </div>
      {owned && isPeacock && <span className="badge good">You have this</span>}
    </div>
  );
}

/** Sort so Peacock leads, then the rest keep their catalog order. */
function orderedAvailability(av: Availability[]): Availability[] {
  return [...av].sort((x, y) =>
    x.provider === "peacock" ? -1 : y.provider === "peacock" ? 1 : 0,
  );
}

/**
 * Cross-service "where to watch" for a single title: a neutral list of provider
 * rows. When the account is connected and Peacock covers the title, the Peacock
 * row is marked "You have this".
 */
export function WhereToWatchCard({
  data,
  ownedOnPeacock,
}: {
  data: TitleAvailability;
  ownedOnPeacock: boolean;
  connected: boolean;
}) {
  return (
    <NeutralShell title={`Where to watch ${data.title}`}>
      {data.availability.length === 0 ? (
        <p className="meta">No streaming availability found in this demo.</p>
      ) : (
        <div className="provider-list">
          {orderedAvailability(data.availability).map((a) => (
            <ProviderRow key={a.provider} a={a} owned={ownedOnPeacock} />
          ))}
        </div>
      )}
    </NeutralShell>
  );
}

/** A compact per-title summary row within a multi-title discovery result. */
function DiscoveryTitleRow({ row }: { row: DiscoveryRow }) {
  const { title, ownedOnPeacock } = row;
  const providers = orderedAvailability(title.availability);
  return (
    <div className="disc-title">
      <div className="disc-title-head">
        <span className="title-row-name">{title.title}</span>
        {ownedOnPeacock && <span className="badge good">You have this</span>}
      </div>
      <div className="meta">
        {title.type === "series" ? "Series" : "Film"} · {title.year} · {title.rating}
      </div>
      <div className="chips">
        {providers.map((a) => (
          <span
            key={a.provider}
            className={`chip${a.provider === "peacock" ? " on-peacock" : ""}`}
          >
            {PROVIDER_LABEL[a.provider]}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * A cross-service discovery result: several titles, each with the services that
 * carry it. Provider-neutral; Peacock rows are only distinguished when owned.
 */
export function DiscoveryCard({ rows }: { rows: DiscoveryRow[]; connected: boolean }) {
  return (
    <NeutralShell title="Across streaming services">
      {rows.length === 0 ? (
        <p className="meta">No matching titles across the simulated services.</p>
      ) : (
        <div className="disc-title-list">
          {rows.map((r) => (
            <DiscoveryTitleRow key={r.title.contentId} row={r} />
          ))}
        </div>
      )}
    </NeutralShell>
  );
}
