import type { CatalogTitle, PlaybackDestination, PreviewInfo } from "../peacock/types";

/**
 * Illustrative demo catalog. Synopses are synthetic placeholders written for
 * the prototype and are not official descriptions. "Poker Face" is included so
 * the sample "add to watchlist" flow works with a recognisable title; the
 * remaining entries use obviously synthetic demo names.
 *
 * "Love Island USA" carries extra discovery metadata (availability, artwork,
 * preview, playback) to drive the content-discovery + Peacock playback-handoff
 * scenario. All identifiers, artwork refs, and URLs below are mock/prototype
 * values — not real Peacock internal ids, assets, or endpoints.
 */
export const CATALOG: CatalogTitle[] = [
  {
    contentId: "ttl_love_island_usa",
    title: "Love Island USA",
    type: "series",
    genres: ["Reality", "Romance"],
    year: 2024,
    rating: "TV-14",
    synopsis:
      "Singles looking for love live together in a sun-soaked villa, coupling up and competing to stay in the game. (Demo synopsis — not an official description.)",
    downloadable: true,
    availableOnPeacock: true,
    artworkRef: "mock://artwork/love-island-usa",
    previewAvailable: true,
    playbackAvailable: true,
  },
  {
    contentId: "ttl_poker_face",
    title: "Poker Face",
    type: "series",
    genres: ["Comedy", "Mystery", "Crime"],
    year: 2023,
    rating: "TV-MA",
    synopsis:
      "A sharp-witted drifter with a knack for spotting lies stumbles into a new mystery each week. (Demo synopsis.)",
    downloadable: true,
  },
  {
    contentId: "ttl_laugh_track_city",
    title: "Laugh Track City",
    type: "series",
    genres: ["Comedy", "Sitcom"],
    year: 2021,
    rating: "TV-14",
    synopsis:
      "An ensemble workplace comedy set in a struggling public-access TV station. (Demo title.)",
    downloadable: true,
  },
  {
    contentId: "ttl_deep_space_diner",
    title: "Deep Space Diner",
    type: "series",
    genres: ["Comedy", "Sci-Fi"],
    year: 2022,
    rating: "TV-PG",
    synopsis:
      "The only all-night diner on a remote space station serves up laughs and cosmic mishaps. (Demo title.)",
    downloadable: false,
  },
  {
    contentId: "ttl_midnight_harbor",
    title: "Midnight Harbor",
    type: "series",
    genres: ["Drama", "Thriller"],
    year: 2020,
    rating: "TV-MA",
    synopsis:
      "Secrets surface in a quiet coastal town when a detective returns home. (Demo title.)",
    downloadable: true,
  },
  {
    contentId: "ttl_summit_run",
    title: "Summit Run",
    type: "film",
    genres: ["Action", "Adventure"],
    year: 2019,
    rating: "PG-13",
    synopsis:
      "A team of climbers races an incoming storm to the top of a legendary peak. (Demo title.)",
    downloadable: true,
  },
  {
    contentId: "ttl_the_understudy",
    title: "The Understudy",
    type: "film",
    genres: ["Comedy", "Romance"],
    year: 2018,
    rating: "PG-13",
    synopsis:
      "A last-minute stand-in accidentally becomes the star of the season. (Demo title.)",
    downloadable: false,
  },
  {
    contentId: "ttl_paper_kingdoms",
    title: "Paper Kingdoms",
    type: "series",
    genres: ["Drama", "History"],
    year: 2017,
    rating: "TV-14",
    synopsis:
      "Rival families battle for control of a 19th-century printing empire. (Demo title.)",
    downloadable: true,
  },
  {
    contentId: "ttl_stellar_bake_off",
    title: "Stellar Bake-Off",
    type: "series",
    genres: ["Reality", "Comedy"],
    year: 2023,
    rating: "TV-PG",
    synopsis:
      "Amateur bakers compete in gravity-defying challenges aboard a floating kitchen. (Demo title.)",
    downloadable: false,
  },
];

const CATALOG_BY_ID: Record<string, CatalogTitle> = Object.fromEntries(
  CATALOG.map((t) => [t.contentId, t]),
);

export function findTitleById(contentId: string): CatalogTitle | undefined {
  return CATALOG_BY_ID[contentId];
}

/** Lightweight fuzzy-ish lookup by title/genre substring for the prototype. */
export function searchCatalogData(query: string): CatalogTitle[] {
  const q = query.trim().toLowerCase();
  // An empty/generic query browses the catalog (e.g. "what should I watch?").
  if (!q) return [...CATALOG];
  return CATALOG.filter((t) => {
    if (t.title.toLowerCase().includes(q)) return true;
    if (t.genres.some((g) => g.toLowerCase().includes(q))) return true;
    if (t.synopsis.toLowerCase().includes(q)) return true;
    return false;
  });
}

/** Best-effort single-title resolver used when adding by name. */
export function resolveTitleByName(name: string): CatalogTitle | undefined {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  const exact = CATALOG.find((t) => t.title.toLowerCase() === q);
  if (exact) return exact;
  return CATALOG.find((t) => t.title.toLowerCase().includes(q));
}

/**
 * Resolve a whole user sentence to a specific catalog title by finding the
 * longest catalog title that appears as a substring of the text. This lets the
 * agent extract "Love Island USA" from "I want to watch Love Island USA"
 * without passing the entire sentence into a literal catalog search.
 */
export function extractTitleFromText(text: string): CatalogTitle | undefined {
  const t = text.toLowerCase();
  let best: CatalogTitle | undefined;
  for (const title of CATALOG) {
    if (t.includes(title.title.toLowerCase())) {
      if (!best || title.title.length > best.title.length) best = title;
    }
  }
  return best;
}

/**
 * Simulated, prototype-safe preview capability per title. previewSource is a
 * mock identifier only — the UI renders a simulated player, never a real asset.
 */
const PREVIEWS: Record<string, PreviewInfo> = {
  ttl_love_island_usa: {
    contentId: "ttl_love_island_usa",
    previewAvailable: true,
    previewType: "clip",
    durationSeconds: 30,
    previewSource: "mock://preview/love-island-usa",
  },
};

export function getPreviewData(contentId: string): PreviewInfo {
  return (
    PREVIEWS[contentId] ?? {
      contentId,
      previewAvailable: false,
      previewType: null,
      durationSeconds: 0,
      previewSource: null,
    }
  );
}

/**
 * Simulated Peacock playback-handoff destination per title. destinationUrl is a
 * mock deep link for the prototype — not a real production Peacock link.
 */
const PLAYBACK: Record<string, PlaybackDestination> = {
  ttl_love_island_usa: {
    contentId: "ttl_love_island_usa",
    destination: "Peacock",
    connectionRequired: true,
    destinationUrl: "mock://peacock/watch/love-island-usa",
    actionLabel: "Open in Peacock",
  },
};

export function getPlaybackData(contentId: string): PlaybackDestination {
  return (
    PLAYBACK[contentId] ?? {
      contentId,
      destination: "Peacock",
      connectionRequired: true,
      destinationUrl: `mock://peacock/watch/${contentId}`,
      actionLabel: "Open in Peacock",
    }
  );
}
