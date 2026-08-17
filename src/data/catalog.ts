import type {
  Availability,
  PlaybackDestination,
  PreviewInfo,
  StreamingProvider,
  TitleAvailability,
} from "../peacock/types";

/**
 * Illustrative demo catalog. Synopses are synthetic placeholders written for
 * the prototype and are not official descriptions. "Poker Face" is included so
 * the sample "add to watchlist" flow works with a recognisable title; the
 * remaining entries use obviously synthetic demo names.
 *
 * Phase 2B: every title carries an `availability` array describing which
 * (simulated) streaming services offer it, so the assistant can answer
 * cross-service "where can I watch X?" questions. Peacock is one provider
 * among several — it is never treated as preferred by default. All identifiers,
 * artwork refs, deep-link refs, and URLs below are mock/prototype values — not
 * real provider internal ids, assets, or endpoints.
 */

/** Human-readable labels for the simulated streaming providers. */
export const PROVIDER_LABELS: Record<StreamingProvider, string> = {
  peacock: "Peacock",
  netflix: "Netflix",
  hulu: "Hulu",
  max: "Max",
  disney_plus: "Disney+",
  prime_video: "Prime Video",
  apple_tv_plus: "Apple TV+",
};

/** Build a mock deep-link ref for a provider + title (prototype only). */
function link(provider: StreamingProvider, contentId: string): string {
  return `mock://${provider}/watch/${contentId}`;
}

/**
 * Compact factory for the expanded demo catalog. `on` lists the providers that
 * carry the title (as subscription offers by default); this keeps ~26 extra
 * fixtures readable while still producing full TitleAvailability records.
 */
function demo(
  contentId: string,
  title: string,
  type: "series" | "film",
  genres: string[],
  year: number,
  rating: string,
  synopsis: string,
  downloadable: boolean,
  on: StreamingProvider[],
): TitleAvailability {
  const availability: Availability[] = on.map((provider) => ({
    provider,
    offerType: "subscription",
    quality: provider === "netflix" || provider === "disney_plus" ? "4K" : "1080p",
    deepLinkRef: link(provider, contentId),
  }));
  const t: TitleAvailability = {
    contentId,
    title,
    type,
    genres,
    year,
    rating,
    synopsis: `${synopsis} (Demo title.)`,
    downloadable,
    availability,
  };
  if (on.includes("peacock")) t.availableOnPeacock = true;
  return t;
}

/** Additional simulated titles spread across the streaming providers. */
const EXPANDED_CATALOG: TitleAvailability[] = [
  demo("ttl_neon_alley", "Neon Alley", "series", ["Sci-Fi", "Thriller"], 2024, "TV-MA", "A courier smuggles memories through a rain-soaked megacity.", true, ["netflix"]),
  demo("ttl_copper_creek", "Copper Creek", "series", ["Drama", "Western"], 2022, "TV-14", "A frontier town fractures when a railroad surveyor arrives.", true, ["peacock", "hulu"]),
  demo("ttl_the_last_ferry", "The Last Ferry", "film", ["Thriller", "Mystery"], 2021, "R", "Strangers stranded on a night crossing realise one of them is lying.", true, ["max"]),
  demo("ttl_sunday_gravy", "Sunday Gravy", "series", ["Comedy", "Drama"], 2023, "TV-14", "Three generations run a beloved but chaotic neighbourhood trattoria.", true, ["hulu", "peacock"]),
  demo("ttl_glacier_point", "Glacier Point", "film", ["Adventure", "Drama"], 2020, "PG-13", "Two estranged siblings retrace their father's final expedition.", true, ["disney_plus"]),
  demo("ttl_quantum_hearts", "Quantum Hearts", "series", ["Sci-Fi", "Romance"], 2024, "TV-14", "A physicist keeps meeting the same stranger across parallel timelines.", true, ["netflix", "prime_video"]),
  demo("ttl_the_understory", "The Understory", "series", ["Drama"], 2019, "TV-MA", "Park rangers uncover a decades-old secret beneath an old-growth forest.", false, ["peacock"]),
  demo("ttl_bright_lights_bakeshop", "Bright Lights Bakeshop", "series", ["Reality"], 2023, "TV-PG", "Rival pastry chefs open competing shops on the same small-town street.", false, ["hulu"]),
  demo("ttl_iron_meridian", "Iron Meridian", "film", ["Action", "Sci-Fi"], 2022, "PG-13", "A salvage pilot stumbles onto a derelict warship that isn't empty.", true, ["prime_video"]),
  demo("ttl_paper_lanterns", "Paper Lanterns", "film", ["Drama", "Romance"], 2018, "PG", "A festival photographer falls for the town she was only passing through.", false, ["max", "peacock"]),
  demo("ttl_the_gauntlet_house", "The Gauntlet House", "series", ["Reality"], 2024, "TV-14", "Contestants live together while clearing a mansion of nightly puzzles.", false, ["peacock"]),
  demo("ttl_cold_open", "Cold Open", "series", ["Comedy"], 2021, "TV-MA", "The writers' room of a failing late-night show fights to stay on air.", true, ["hulu"]),
  demo("ttl_dust_and_gold", "Dust and Gold", "film", ["Western", "Drama"], 2017, "R", "A retired marshal is pulled back for one last dangerous escort.", true, ["prime_video", "apple_tv_plus"]),
  demo("ttl_tidepool", "Tidepool", "series", ["Drama", "Mystery"], 2020, "TV-14", "A marine biologist returns to the island where her sister vanished.", true, ["max"]),
  demo("ttl_starling_academy", "Starling Academy", "series", ["Fantasy", "Adventure"], 2023, "TV-PG", "New students discover their boarding school sits on a hidden gateway.", true, ["disney_plus"]),
  demo("ttl_the_night_shift_chef", "The Night Shift Chef", "film", ["Comedy", "Romance"], 2022, "PG-13", "A diner cook and a food critic keep clashing after hours.", false, ["netflix"]),
  demo("ttl_signal_lost", "Signal Lost", "series", ["Thriller"], 2024, "TV-MA", "A remote research station goes dark, and the relief crew finds clues.", true, ["peacock", "max"]),
  demo("ttl_harvest_moon_road", "Harvest Moon Road", "series", ["Drama"], 2019, "TV-14", "A city lawyer inherits her grandmother's struggling orchard.", true, ["hulu", "peacock"]),
  demo("ttl_the_understudy_returns", "The Understudy Returns", "film", ["Comedy"], 2021, "PG-13", "The accidental star returns for a disastrous sequel production.", false, ["prime_video"]),
  demo("ttl_orbital", "Orbital", "film", ["Sci-Fi", "Thriller"], 2023, "PG-13", "A stranded crew races failing life support on a decaying station.", true, ["netflix"]),
  demo("ttl_marigold_street", "Marigold Street", "series", ["Drama", "Romance"], 2018, "TV-14", "Neighbours on one block navigate a changing city over a decade.", false, ["disney_plus"]),
  demo("ttl_the_reef_below", "The Reef Below", "series", ["Documentary"], 2024, "TV-G", "A simulated look at the tides, storms, and life of a coastal reef.", true, ["disney_plus", "peacock"]),
  demo("ttl_backspin", "Backspin", "film", ["Sports", "Drama"], 2020, "PG", "An ageing table-tennis champion coaches an unlikely prodigy.", true, ["hulu"]),
  demo("ttl_the_glasshouse", "The Glasshouse", "series", ["Mystery", "Drama"], 2022, "TV-MA", "A locked botanical estate hides the truth about its owner's fortune.", true, ["max", "peacock"]),
  demo("ttl_midnight_cartography", "Midnight Cartography", "film", ["Adventure", "Fantasy"], 2019, "PG-13", "A mapmaker discovers her charts redraw the coastline overnight.", false, ["prime_video"]),
  demo("ttl_second_service", "Second Service", "series", ["Reality"], 2023, "TV-PG", "Retired restaurateurs mentor first-time owners through opening week.", false, ["peacock"]),
];

export const CATALOG: TitleAvailability[] = [
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
    availability: [
      { provider: "peacock", offerType: "subscription", quality: "4K", deepLinkRef: link("peacock", "ttl_love_island_usa") },
    ],
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
    availability: [
      { provider: "peacock", offerType: "subscription", quality: "4K", deepLinkRef: link("peacock", "ttl_poker_face") },
      { provider: "prime_video", offerType: "buy", priceLabel: "$19.99", deepLinkRef: link("prime_video", "ttl_poker_face") },
    ],
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
    availability: [
      { provider: "peacock", offerType: "subscription", quality: "1080p", deepLinkRef: link("peacock", "ttl_laugh_track_city") },
      { provider: "hulu", offerType: "subscription", quality: "1080p", deepLinkRef: link("hulu", "ttl_laugh_track_city") },
    ],
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
    availability: [
      { provider: "netflix", offerType: "subscription", quality: "4K", deepLinkRef: link("netflix", "ttl_deep_space_diner") },
    ],
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
    availability: [
      { provider: "peacock", offerType: "subscription", quality: "1080p", deepLinkRef: link("peacock", "ttl_midnight_harbor") },
      { provider: "max", offerType: "subscription", quality: "4K", deepLinkRef: link("max", "ttl_midnight_harbor") },
    ],
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
    availability: [
      { provider: "prime_video", offerType: "rent", priceLabel: "$3.99", deepLinkRef: link("prime_video", "ttl_summit_run") },
      { provider: "apple_tv_plus", offerType: "rent", priceLabel: "$3.99", deepLinkRef: link("apple_tv_plus", "ttl_summit_run") },
    ],
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
    availability: [
      { provider: "hulu", offerType: "subscription", quality: "1080p", deepLinkRef: link("hulu", "ttl_the_understudy") },
    ],
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
    availability: [
      { provider: "peacock", offerType: "subscription", quality: "1080p", deepLinkRef: link("peacock", "ttl_paper_kingdoms") },
      { provider: "disney_plus", offerType: "subscription", quality: "4K", deepLinkRef: link("disney_plus", "ttl_paper_kingdoms") },
    ],
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
    availability: [
      { provider: "peacock", offerType: "subscription", quality: "1080p", deepLinkRef: link("peacock", "ttl_stellar_bake_off") },
    ],
  },
  ...EXPANDED_CATALOG,
];

const CATALOG_BY_ID: Record<string, TitleAvailability> = Object.fromEntries(
  CATALOG.map((t) => [t.contentId, t]),
);

export function findTitleById(contentId: string): TitleAvailability | undefined {
  return CATALOG_BY_ID[contentId];
}

/** Lightweight fuzzy-ish lookup by title/genre substring for the prototype. */
export function searchCatalogData(query: string): TitleAvailability[] {
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

/**
 * Cross-service search (Phase 2B): same matching as searchCatalogData but the
 * return type carries the full availability array so callers can render
 * where-to-watch information across providers.
 */
export function searchAcrossServicesData(query: string): TitleAvailability[] {
  return searchCatalogData(query);
}

/** Return the full availability record for a title, if known. */
export function getWhereToWatchData(contentId: string): TitleAvailability | undefined {
  return CATALOG_BY_ID[contentId];
}

/**
 * Provider-neutral recommendations. With a genre, return matching titles;
 * without one, return a small varied sample of the catalog.
 */
export function getRecommendationsData(genre?: string): TitleAvailability[] {
  const g = genre?.trim().toLowerCase();
  if (!g) return CATALOG.slice(0, 6);
  return CATALOG.filter((t) => t.genres.some((x) => x.toLowerCase() === g));
}

/** Best-effort single-title resolver used when adding by name. */
export function resolveTitleByName(name: string): TitleAvailability | undefined {
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
export function extractTitleFromText(text: string): TitleAvailability | undefined {
  const t = text.toLowerCase();
  let best: TitleAvailability | undefined;
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
