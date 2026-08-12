import type { CatalogTitle } from "../peacock/types";

/**
 * Illustrative demo catalog. Synopses are synthetic placeholders written for
 * the prototype and are not official descriptions. "Poker Face" is included so
 * the sample "add to watchlist" flow works with a recognisable title; the
 * remaining entries use obviously synthetic demo names.
 */
export const CATALOG: CatalogTitle[] = [
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
