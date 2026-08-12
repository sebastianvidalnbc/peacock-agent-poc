import type { PeacockCard as PeacockCardData } from "../../agent/types";
import {
  AccountCard,
  CapabilitiesCard,
  EntitlementsCard,
  SubscriptionCard,
} from "./AccountCards";
import {
  ConnectCard,
  HandoffCard,
  SearchCard,
  TitleCard,
  TitleOfferCard,
  WatchlistCard,
} from "./MediaCards";

/** Renders the structured Peacock card attached to an assistant message. */
export function PeacockCard({
  card,
  previewOpen = false,
}: {
  card: PeacockCardData;
  /** Whether the inline preview for a title_offer card should be shown. */
  previewOpen?: boolean;
}) {
  switch (card.kind) {
    case "account":
      return <AccountCard data={card.data} />;
    case "subscription":
      return <SubscriptionCard data={card.data} />;
    case "entitlements":
      return <EntitlementsCard data={card.data} />;
    case "capabilities":
      return <CapabilitiesCard data={card.data} />;
    case "watchlist":
      return <WatchlistCard titles={card.data} />;
    case "search":
      return <SearchCard titles={card.data} />;
    case "title":
      return <TitleCard title={card.data} />;
    case "title_offer":
      return <TitleOfferCard title={card.data} preview={card.preview} previewOpen={previewOpen} />;
    case "handoff":
      return <HandoffCard title={card.data} destination={card.destination} />;
    case "connect":
      return <ConnectCard />;
    default:
      return null;
  }
}
