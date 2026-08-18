import type {
  BillingInterval,
  BillingProvider,
  SubscriptionStatus,
  ViewingProgress,
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
  /**
   * Simulated per-title viewing progress, newest first. Drives Continue
   * Watching / resume / viewing-history reads. Read-only in this prototype.
   */
  viewing: ViewingProgress[];
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
    viewing: [
      {
        contentId: "ttl_love_island_usa",
        title: "Love Island USA",
        seasonNumber: 8,
        episodeNumber: 11,
        episodeTitle: "Recoupling Night",
        progressSeconds: 1180,
        durationSeconds: 2640,
        completed: false,
        lastWatchedAt: "2024-12-04",
      },
      {
        contentId: "ttl_paper_kingdoms",
        title: "Paper Kingdoms",
        progressSeconds: 2830,
        durationSeconds: 6720,
        completed: false,
        lastWatchedAt: "2024-11-20",
      },
      {
        contentId: "ttl_laugh_track_city",
        title: "Laugh Track City",
        seasonNumber: 2,
        episodeNumber: 6,
        episodeTitle: "The Pledge Drive",
        progressSeconds: 1500,
        durationSeconds: 1500,
        completed: true,
        lastWatchedAt: "2024-11-02",
      },
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
    viewing: [
      {
        contentId: "ttl_deep_space_diner",
        title: "Deep Space Diner",
        seasonNumber: 1,
        episodeNumber: 4,
        episodeTitle: "Table for None",
        progressSeconds: 640,
        durationSeconds: 1620,
        completed: false,
        lastWatchedAt: "2024-12-02",
      },
      {
        contentId: "ttl_summit_run",
        title: "Summit Run",
        progressSeconds: 5940,
        durationSeconds: 5940,
        completed: true,
        lastWatchedAt: "2024-10-15",
      },
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
    viewing: [
      {
        contentId: "ttl_the_understudy",
        title: "The Understudy",
        progressSeconds: 2100,
        durationSeconds: 5400,
        completed: false,
        lastWatchedAt: "2024-12-05",
      },
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
    viewing: [
      {
        contentId: "ttl_midnight_harbor",
        title: "Midnight Harbor",
        seasonNumber: 1,
        episodeNumber: 8,
        episodeTitle: "Last Light",
        progressSeconds: 3120,
        durationSeconds: 3120,
        completed: true,
        lastWatchedAt: "2023-08-11",
      },
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
