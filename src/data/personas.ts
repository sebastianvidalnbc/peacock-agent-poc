import type {
  BillingInterval,
  BillingProvider,
  SubscriptionStatus,
  WatchHistoryEntry,
} from "../peacock/types";

/**
 * Fixed baseline state for each demo persona. All names, emails, and history
 * are obviously synthetic. Mutable per-session changes (watchlist edits, plan
 * changes) live in the prototype store as overlays on top of these fixtures.
 */
export interface PersonaFixture {
  id: string;
  displayName: string;
  email: string;
  memberSince: string;
  planId: string;
  billingProvider: BillingProvider;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  watchlist: string[];
  watchHistory: WatchHistoryEntry[];
  blurb: string;
}

export const PERSONAS: Record<string, PersonaFixture> = {
  alex: {
    id: "alex",
    displayName: "Alex Demo",
    email: "alex.demo@example.com",
    memberSince: "2022-03-14",
    planId: "peacock_select",
    billingProvider: "peacock_direct",
    billingInterval: "monthly",
    status: "active",
    watchlist: ["ttl_midnight_harbor", "ttl_summit_run"],
    watchHistory: [
      { contentId: "ttl_laugh_track_city", title: "Laugh Track City", watchedOn: "2024-11-02", progressPct: 100 },
      { contentId: "ttl_paper_kingdoms", title: "Paper Kingdoms", watchedOn: "2024-11-20", progressPct: 42 },
    ],
    blurb: "Mid-tier plan · billed by Peacock · ads · no downloads",
  },
  jordan: {
    id: "jordan",
    displayName: "Jordan Demo",
    email: "jordan.demo@example.com",
    memberSince: "2021-07-01",
    planId: "peacock_premium_plus",
    billingProvider: "peacock_direct",
    billingInterval: "annual",
    status: "active",
    watchlist: ["ttl_deep_space_diner", "ttl_stellar_bake_off", "ttl_paper_kingdoms"],
    watchHistory: [
      { contentId: "ttl_summit_run", title: "Summit Run", watchedOn: "2024-10-15", progressPct: 100 },
    ],
    blurb: "Top-tier plan · billed by Peacock · fewer ads · downloads · annual",
  },
  taylor: {
    id: "taylor",
    displayName: "Taylor Demo",
    email: "taylor.demo@example.com",
    memberSince: "2023-01-09",
    planId: "peacock_premium_plus",
    billingProvider: "apple",
    billingInterval: "monthly",
    status: "active",
    watchlist: ["ttl_the_understudy"],
    watchHistory: [
      { contentId: "ttl_deep_space_diner", title: "Deep Space Diner", watchedOn: "2024-12-01", progressPct: 66 },
    ],
    blurb: "Active plan · billed externally through Apple · some actions unavailable",
  },
  morgan: {
    id: "morgan",
    displayName: "Morgan Demo",
    email: "morgan.demo@example.com",
    memberSince: "2020-05-22",
    planId: "peacock_select",
    billingProvider: "peacock_direct",
    billingInterval: "monthly",
    status: "lapsed",
    watchlist: [],
    watchHistory: [
      { contentId: "ttl_midnight_harbor", title: "Midnight Harbor", watchedOn: "2023-08-11", progressPct: 100 },
      { contentId: "ttl_the_understudy", title: "The Understudy", watchedOn: "2023-09-03", progressPct: 88 },
    ],
    blurb: "Previously subscribed · currently lapsed · has prior watch history",
  },
};

export const PERSONA_ORDER = ["alex", "jordan", "taylor", "morgan"];

export function getPersonaFixture(personaId: string): PersonaFixture {
  const p = PERSONAS[personaId];
  if (!p) throw new Error(`Unknown persona id: ${personaId}`);
  return p;
}

export function listPersonas(): PersonaFixture[] {
  return PERSONA_ORDER.map((id) => PERSONAS[id]);
}
