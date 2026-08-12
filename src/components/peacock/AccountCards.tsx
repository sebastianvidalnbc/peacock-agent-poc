import type {
  AccountSummary,
  Capability,
  Entitlements,
  Subscription,
} from "../../peacock/types";
import { CardShell, KV, StatusBadge } from "./CardShell";

const PROVIDER: Record<string, string> = { peacock_direct: "Peacock (direct)", apple: "Apple" };
const ADS: Record<string, string> = { ads: "Ad-supported", fewer_ads: "Fewer ads", no_ads: "No ads" };

export function AccountCard({ data }: { data: AccountSummary }) {
  return (
    <CardShell title="Your account">
      <KV k="Name" v={data.displayName} />
      <KV k="Email" v={data.email} />
      <KV k="Member since" v={data.memberSince} />
      <KV k="Plan" v={data.planName} />
      <KV k="Billing" v={PROVIDER[data.billingProvider]} />
      <KV k="Status" v={<StatusBadge status={data.status} />} />
    </CardShell>
  );
}

export function SubscriptionCard({ data }: { data: Subscription }) {
  return (
    <CardShell title="Your subscription">
      <KV k="Plan" v={data.plan.name} />
      <KV k="Price" v={data.priceLabel} />
      <KV k="Billing" v={`${PROVIDER[data.billingProvider]} · ${data.billingInterval}`} />
      <KV k="Status" v={<StatusBadge status={data.status} />} />
      <KV k="Renews" v={data.renewsOn ?? "—"} />
      {data.managedExternally && (
        <p className="meta" style={{ margin: 0 }}>
          Managed externally — changes are made in the billing provider's settings.
        </p>
      )}
      <div className="chips">
        {data.plan.features.map((f) => (
          <span className="chip" key={f}>
            {f}
          </span>
        ))}
      </div>
    </CardShell>
  );
}

export function EntitlementsCard({ data }: { data: Entitlements }) {
  return (
    <CardShell title="What your plan includes">
      <KV k="Downloads" v={data.downloads ? "Yes" : "No"} />
      <KV k="Ads" v={ADS[data.adsLevel]} />
      <KV k="Simultaneous streams" v={String(data.simultaneousStreams)} />
      <KV k="Max video quality" v={data.maxVideoQuality} />
      <KV k="Offline devices" v={String(data.offlineDevices)} />
    </CardShell>
  );
}

export function CapabilitiesCard({ data }: { data: Capability[] }) {
  return (
    <CardShell title="What I can help with">
      {data.map((c) => (
        <div className="cap" key={c.id}>
          <span className={`mark ${c.available ? "yes" : "no"}`} aria-hidden="true">
            {c.available ? "✓" : "—"}
          </span>
          <div>
            <div>{c.label}</div>
            <div className="reason">
              {c.description}
              {!c.available && c.reason ? ` (${c.reason})` : ""}
            </div>
          </div>
        </div>
      ))}
    </CardShell>
  );
}
