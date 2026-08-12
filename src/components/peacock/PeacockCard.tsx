import type { PeacockCard as PeacockCardData } from "../../agent/types";
import {
  AccountCard,
  CapabilitiesCard,
  EntitlementsCard,
  SubscriptionCard,
} from "./AccountCards";
import { ConnectCard, SearchCard, TitleCard, WatchlistCard } from "./MediaCards";

/** Renders the structured Peacock card attached to an assistant message. */
export function PeacockCard({ card }: { card: PeacockCardData }) {
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
    case "connect":
      return <ConnectCard />;
    default:
      return null;
  }
}
