import type {
  Availability,
  NextEpisode,
  PlaybackDestination,
  PreviewInfo,
  StreamingProvider,
  TitleAvailability,
} from "../peacock/types";

/**
 * Illustrative demo catalog. Synopses are synthetic placeholders written for
 * the prototype and are not official descriptions. It mixes recognisable,
 * Peacock-relevant title names (so the assistant can be exercised with familiar
 * prompts like "The Traitors" or "Poker Face") with obviously synthetic demo
 * names. All synopses, identifiers, artwork refs, and deep-link refs are
 * mock/prototype values regardless of how well-known the title name is.
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

/**
 * Display label for any provider the agent can recognise in free text,
 * including "paramount_plus" — which is understood as a provider term for
 * routing even though no fixture currently carries it.
 */
export function providerLabel(provider: string): string {
  if (provider === "paramount_plus") return "Paramount+";
  return PROVIDER_LABELS[provider as StreamingProvider] ?? provider;
}

/** Build a mock deep-link ref for a provider + title (prototype only). */
function link(provider: StreamingProvider, contentId: string): string {
  return `mock://${provider}/watch/${contentId}`;
}

/**
 * Compact factory for the expanded demo catalog. `on` lists the providers that
 * carry the title (as subscription offers by default); this keeps the fixtures
 * readable while still producing full TitleAvailability records.
 *
 * `synthetic` (default true) marks obviously invented demo names, whose synopsis
 * gets a "(Demo title.)" suffix. Recognisable, real Peacock-relevant titles pass
 * `synthetic: false` so their synopsis reads naturally; every synopsis remains a
 * short synthetic placeholder, not an official description (see the file header).
 * When a title is on Peacock it is also marked preview- and playback-capable so
 * the Peacock offer/preview/handoff flows work for any of them.
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
  synthetic = true,
): TitleAvailability {
  const availability: Availability[] = on.map((provider) => ({
    provider,
    offerType: "subscription",
    quality: provider === "netflix" || provider === "disney_plus" ? "4K" : "1080p",
    deepLinkRef: link(provider, contentId),
  }));
  const onPeacock = on.includes("peacock");
  const t: TitleAvailability = {
    contentId,
    title,
    type,
    genres,
    year,
    rating,
    synopsis: synthetic ? `${synopsis} (Demo title.)` : synopsis,
    downloadable,
    availability,
  };
  if (onPeacock) {
    t.availableOnPeacock = true;
    t.previewAvailable = true;
    t.playbackAvailable = true;
  }
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
  demo("ttl_jaws", "Jaws", "film", ["Thriller", "Adventure"], 1975, "PG", "A beach town's police chief hunts a great white shark terrorising the waters.", true, ["peacock", "prime_video", "apple_tv_plus"]),
  demo("ttl_shrek", "Shrek", "film", ["Comedy", "Adventure"], 2001, "PG", "A grumpy ogre and a talkative donkey set out to rescue a princess.", true, ["hulu", "prime_video"]),
  demo("ttl_bridesmaids", "Bridesmaids", "film", ["Comedy"], 2011, "R", "A maid of honour's life unravels as she leads her best friend's wedding party.", true, ["peacock", "netflix"]),

  // --- Recognisable Peacock-relevant titles ---------------------------------
  // Real title names used so the assistant can be exercised with familiar
  // prompts. Synopses are still short synthetic placeholders, not official
  // descriptions (see the file header). Peacock is one provider among several
  // and is never treated as preferred by default.
  demo("ttl_the_traitors", "The Traitors", "series", ["Reality", "Competition"], 2023, "TV-14", "Contestants scheme in a castle as hidden traitors pick off the faithful one by one.", false, ["peacock"], false),
  demo("ttl_the_office", "The Office", "series", ["Comedy", "Sitcom"], 2005, "TV-14", "A mockumentary crew follows the staff of a mid-size paper company and its oblivious boss.", true, ["peacock"], false),
  demo("ttl_parks_and_rec", "Parks and Recreation", "series", ["Comedy", "Sitcom"], 2009, "TV-14", "An endlessly upbeat public official schemes to improve her small Indiana town.", true, ["peacock"], false),
  demo("ttl_yellowstone", "Yellowstone", "series", ["Drama", "Western"], 2018, "TV-MA", "A ranching dynasty defends its land against developers, rivals, and its own feuds.", true, ["peacock"], false),
  demo("ttl_suits", "Suits", "series", ["Drama", "Legal"], 2011, "TV-14", "A brilliant college dropout fakes his credentials to work at a top law firm.", true, ["peacock"], false),
  demo("ttl_brooklyn_nine_nine", "Brooklyn Nine-Nine", "series", ["Comedy", "Crime"], 2013, "TV-14", "An immature but talented detective clashes with his by-the-book new captain.", true, ["peacock"], false),
  demo("ttl_dr_death", "Dr. Death", "series", ["Drama", "Crime"], 2021, "TV-MA", "A charismatic surgeon leaves a trail of maimed patients as colleagues fight to stop him.", true, ["peacock"], false),
  demo("ttl_bel_air", "Bel-Air", "series", ["Drama"], 2022, "TV-14", "A dramatic reimagining follows a teen from West Philadelphia sent to live with wealthy relatives.", true, ["peacock"], false),
  demo("ttl_poker_face_2", "Mrs. Davis", "series", ["Sci-Fi", "Comedy"], 2023, "TV-MA", "A nun sets out on a quest to destroy a world-controlling artificial intelligence.", true, ["peacock"], false),
  demo("ttl_ted", "Ted", "series", ["Comedy"], 2024, "TV-MA", "A foul-mouthed living teddy bear causes chaos for the family that raised him.", true, ["peacock"], false),
  demo("ttl_oppenheimer", "Oppenheimer", "film", ["Drama", "History"], 2023, "R", "The theoretical physicist races to build the atomic bomb and lives with the fallout.", true, ["peacock"], false),
  demo("ttl_nope", "Nope", "film", ["Thriller", "Sci-Fi"], 2022, "R", "Ranch siblings try to capture evidence of a menacing presence in the sky above their home.", true, ["peacock"], false),
  demo("ttl_the_fall_guy", "The Fall Guy", "film", ["Action", "Comedy"], 2024, "PG-13", "A stuntman is pulled back into danger to find a missing movie star.", true, ["peacock"], false),
  demo("ttl_five_nights", "Five Nights at Freddy's", "film", ["Horror", "Thriller"], 2023, "PG-13", "A troubled night guard discovers the animatronics at a shuttered pizzeria come alive after dark.", true, ["peacock"], false),
  demo("ttl_migration", "Migration", "film", ["Animation", "Comedy"], 2023, "PG", "A cautious duck family embarks on a chaotic journey south for the winter.", true, ["peacock"], false),
  demo("ttl_wicked_little", "Wicked Little Letters", "film", ["Comedy", "Mystery"], 2024, "R", "A quiet seaside town is scandalised by a stream of anonymous, foul-mouthed letters.", true, ["peacock"], false),
  demo("ttl_apples_never_fall", "Apples Never Fall", "series", ["Drama", "Mystery"], 2024, "TV-MA", "A family unravels when their matriarch disappears without a trace.", true, ["peacock"], false),
  demo("ttl_days_of_our_lives", "Days of Our Lives", "series", ["Drama"], 1965, "TV-14", "The intertwined lives, loves, and rivalries of the residents of a fictional midwestern town.", false, ["peacock"], false),
  demo("ttl_below_deck", "Below Deck", "series", ["Reality"], 2013, "TV-14", "The crew of a luxury charter yacht juggles demanding guests and shipboard drama.", false, ["peacock"], false),
  demo("ttl_real_housewives", "The Real Housewives of Beverly Hills", "series", ["Reality"], 2010, "TV-14", "Affluent friends navigate lavish lifestyles, alliances, and explosive fallouts.", false, ["peacock"], false),
  demo("ttl_top_chef", "Top Chef", "series", ["Reality", "Competition"], 2006, "TV-14", "Talented cooks battle through high-pressure culinary challenges for the title.", false, ["peacock"], false),
  demo("ttl_saturday_night_live", "Saturday Night Live", "series", ["Comedy", "Variety"], 1975, "TV-14", "A live late-night sketch show skewers the week's news with a rotating host.", false, ["peacock"], false),
  demo("ttl_law_and_order_svu", "Law & Order: SVU", "series", ["Drama", "Crime"], 1999, "TV-14", "An elite squad investigates sexually based offenses in New York City.", true, ["peacock"], false),
  demo("ttl_the_continental", "The Continental", "series", ["Action", "Thriller"], 2023, "TV-MA", "A young operative fights to seize control of a legendary hotel for assassins.", true, ["peacock"], false),
  demo("ttl_twisters", "Twisters", "film", ["Action", "Adventure"], 2024, "PG-13", "Rival storm chasers collide as an unprecedented outbreak of tornadoes tears across the plains.", true, ["peacock"], false),
  demo("ttl_abigail", "Abigail", "film", ["Horror", "Thriller"], 2024, "R", "Kidnappers discover the little girl they abducted is far more dangerous than she seems.", true, ["peacock"], false),
  demo("ttl_kung_fu_panda_4", "Kung Fu Panda 4", "film", ["Animation", "Comedy"], 2024, "PG", "The Dragon Warrior must train a successor while facing a shape-shifting new foe.", true, ["peacock"], false),
  demo("ttl_the_holdovers", "The Holdovers", "film", ["Comedy", "Drama"], 2023, "R", "A cranky teacher is stuck babysitting the students with nowhere to go over winter break.", true, ["peacock"], false),
  demo("ttl_meet_the_parents", "Meet the Parents", "film", ["Comedy"], 2000, "PG-13", "A nervous nurse endures a disastrous weekend trying to impress his girlfriend's stern father.", true, ["peacock"], false),
  demo("ttl_jurassic_park", "Jurassic Park", "film", ["Adventure", "Sci-Fi"], 1993, "PG-13", "A theme park of cloned dinosaurs spirals out of control during a preview tour.", true, ["peacock"], false),
  demo("ttl_back_to_the_future", "Back to the Future", "film", ["Adventure", "Sci-Fi"], 1985, "PG", "A teenager is accidentally sent thirty years into the past in a time-travelling car.", true, ["peacock"], false),
  demo("ttl_pitch_perfect", "Pitch Perfect", "film", ["Comedy", "Music"], 2012, "PG-13", "A reluctant freshman joins an a cappella group determined to win the national title.", true, ["peacock", "netflix"], false),
  demo("ttl_wicked", "Wicked", "film", ["Musical", "Fantasy"], 2024, "PG", "Two young women forge an unlikely friendship on their way to becoming the witches of Oz.", true, ["peacock"], false),
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

/**
 * Best-effort single-title resolver used when adding by name. Resolution order:
 * exact canonical title → canonical/alias substring (longest wins) → substring
 * containment → conservative fuzzy (typo-tolerant). This lets "add Traiters to
 * my watchlist" still resolve The Traitors without matching unrelated titles.
 */
export function resolveTitleByName(name: string): TitleAvailability | undefined {
  const q = name.trim().toLowerCase();
  if (!q) return undefined;
  const exact = CATALOG.find((t) => t.title.toLowerCase() === q);
  if (exact) return exact;
  const viaAlias = extractTitleFromText(q);
  if (viaAlias) return viaAlias;
  const contains = CATALOG.find((t) => t.title.toLowerCase().includes(q));
  if (contains) return contains;
  return fuzzyResolveTitle(q);
}

/**
 * Common alternate names users type for a title, keyed by contentId. The
 * canonical title always wins as the resolved result; aliases only widen what
 * text will match. This is the single, reusable place to teach the agent
 * colloquial title names — e.g. "Love Island" for "Love Island USA" — without
 * duplicating fixtures. Aliases are matched case-insensitively as whole
 * substrings, using the same longest-match rule as canonical titles.
 */
export const TITLE_ALIASES: Record<string, string[]> = {
  ttl_love_island_usa: ["Love Island"],
  ttl_the_traitors: ["Traitors"],
  ttl_parks_and_rec: ["Parks and Rec", "Parks & Rec", "Parks & Recreation"],
  ttl_brooklyn_nine_nine: ["Brooklyn 99", "Brooklyn Nine Nine", "B99"],
  ttl_law_and_order_svu: ["Law and Order SVU", "SVU", "Law & Order Special Victims Unit"],
  ttl_saturday_night_live: ["SNL"],
  ttl_real_housewives: ["Real Housewives of Beverly Hills", "RHOBH"],
  ttl_five_nights: ["Five Nights at Freddys", "FNAF"],
  ttl_kung_fu_panda_4: ["Kung Fu Panda"],
  ttl_back_to_the_future: ["Back to the Future Part I"],
};

/**
 * All (canonical title + aliases) match candidates, precomputed as lowercase
 * strings paired with the title they resolve to. Sorted longest-first so the
 * most specific match wins (e.g. "Love Island USA" beats "Love Island").
 */
const TITLE_MATCH_INDEX: { needle: string; title: TitleAvailability }[] = CATALOG.flatMap(
  (title) => {
    const names = [title.title, ...(TITLE_ALIASES[title.contentId] ?? [])];
    return names.map((name) => ({ needle: name.toLowerCase(), title }));
  },
).sort((a, b) => b.needle.length - a.needle.length);

/**
 * Normalise a title-ish string for fuzzy comparison: lowercase, strip all
 * punctuation (so "Brooklyn Nine-Nine" ≈ "brooklyn nine nine" and "Freddy's" ≈
 * "freddys"), collapse whitespace, and drop a leading article. Used only for the
 * conservative fuzzy layer — exact/alias substring matching runs first.
 */
export function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^the\s+/, "");
}

/** Same candidate set as TITLE_MATCH_INDEX, keyed by normalised name. */
const TITLE_NORM_INDEX: { norm: string; title: TitleAvailability }[] = TITLE_MATCH_INDEX
  .map(({ needle, title }) => ({ norm: normalizeTitle(needle), title }))
  .filter((e) => e.norm.length > 0);

/** Levenshtein edit distance between two short strings. */
function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Conservative fuzzy resolution of a bare, normalised query against known
 * (canonical + alias) names. Only used after exact and alias substring matching
 * fail, and only against a short candidate query (a title on its own, not a full
 * sentence). Tolerances are deliberately tight so unrelated titles never match:
 *
 *   - exact normalised equality always wins;
 *   - otherwise, for queries of at least 5 characters, accept a single closest
 *     candidate within an edit distance of 1 (short titles) or 2 (10+ chars),
 *     and only when that best candidate is unambiguously closer than the next.
 */
function fuzzyResolveQuery(query: string): TitleAvailability | undefined {
  const q = normalizeTitle(query);
  if (!q) return undefined;
  const exact = TITLE_NORM_INDEX.find((e) => e.norm === q);
  if (exact) return exact.title;
  if (q.length < 5) return undefined;
  const maxDistance = q.length >= 10 ? 2 : 1;
  let best: { title: TitleAvailability; dist: number } | undefined;
  // Second-best distance among candidates for a *different* title, so multiple
  // names for the same title (canonical + alias, both normalising equally) never
  // count as an ambiguous tie.
  let secondDist = Infinity;
  for (const { norm, title } of TITLE_NORM_INDEX) {
    // Skip candidates whose length is too different to be within tolerance.
    if (Math.abs(norm.length - q.length) > maxDistance) continue;
    const dist = editDistance(q, norm);
    if (!best || dist < best.dist) {
      if (best && best.title.contentId !== title.contentId) secondDist = Math.min(secondDist, best.dist);
      best = { title, dist };
    } else if (title.contentId !== best.title.contentId && dist < secondDist) {
      secondDist = dist;
    }
  }
  if (best && best.dist <= maxDistance && best.dist < secondDist) return best.title;
  return undefined;
}

/** Longest normalised title name, in tokens — bounds the sliding-window search. */
const MAX_TITLE_TOKENS = TITLE_NORM_INDEX.reduce(
  (max, e) => Math.max(max, e.norm.split(" ").length),
  1,
);

/**
 * Fuzzy resolution over a possibly-sentence-length query. Tries the whole query
 * first (so a bare "Poker Fase" resolves), then slides a token window across the
 * text — bounded by the longest known title — so a typo embedded in a sentence
 * ("where can i watch poker fase") still resolves. Every candidate window is run
 * through the same tight per-window tolerance in fuzzyResolveQuery, so unrelated
 * text never matches. The longest windows are tried first for specificity.
 */
function fuzzyResolveTitle(query: string): TitleAvailability | undefined {
  const whole = fuzzyResolveQuery(query);
  if (whole) return whole;
  const tokens = normalizeTitle(query).split(" ").filter(Boolean);
  if (tokens.length < 2) return undefined;
  for (let size = Math.min(MAX_TITLE_TOKENS, tokens.length); size >= 1; size--) {
    for (let i = 0; i + size <= tokens.length; i++) {
      const window = tokens.slice(i, i + size).join(" ");
      if (window.length < 5) continue;
      const hit = fuzzyResolveQuery(window);
      if (hit) return hit;
    }
  }
  return undefined;
}

/**
 * Resolve a whole user sentence to a specific catalog title by finding the
 * longest known title name (canonical or alias) that appears as a substring of
 * the text. This lets the agent extract "Love Island USA" from "I want to watch
 * Love Island USA" — and "Love Island" from "Can I watch Love Island on
 * Peacock?" — without passing the entire sentence into a literal catalog search.
 * The returned record is always the canonical TitleAvailability.
 *
 * Matching order: exact canonical/alias substring first (longest wins); then, if
 * nothing matches, a conservative fuzzy pass over the whole text so a light
 * typo ("Poker Fase", "Traiters") still resolves without pulling in unrelated
 * titles.
 */
export function extractTitleFromText(text: string): TitleAvailability | undefined {
  const t = text.toLowerCase();
  for (const { needle, title } of TITLE_MATCH_INDEX) {
    if (t.includes(needle)) return title;
  }
  return fuzzyResolveTitle(text);
}

/**
 * The streaming providers this prototype understands in free text, mapped from
 * the various ways a user might type them to the canonical provider id. Matched
 * case-insensitively. "paramount_plus" is recognised as a provider term even
 * though no fixture carries it yet, so a "Is X on Paramount+?" question routes
 * as a provider-availability question rather than falling through.
 */
export type KnownProvider = StreamingProvider | "paramount_plus";

const PROVIDER_TERMS: { needle: string; provider: KnownProvider }[] = (
  [
    { needle: "peacock", provider: "peacock" },
    { needle: "netflix", provider: "netflix" },
    { needle: "hulu", provider: "hulu" },
    { needle: "disney+", provider: "disney_plus" },
    { needle: "disney plus", provider: "disney_plus" },
    { needle: "disney", provider: "disney_plus" },
    { needle: "prime video", provider: "prime_video" },
    { needle: "amazon prime", provider: "prime_video" },
    { needle: "prime", provider: "prime_video" },
    { needle: "apple tv+", provider: "apple_tv_plus" },
    { needle: "apple tv plus", provider: "apple_tv_plus" },
    { needle: "apple tv", provider: "apple_tv_plus" },
    { needle: "appletv", provider: "apple_tv_plus" },
    { needle: "paramount+", provider: "paramount_plus" },
    { needle: "paramount plus", provider: "paramount_plus" },
    { needle: "paramount", provider: "paramount_plus" },
    { needle: "max", provider: "max" },
  ] satisfies { needle: string; provider: KnownProvider }[]
)
  // Longest term first so "prime video" wins over "prime", "disney plus" over
  // "disney", etc.
  .sort((a, b) => b.needle.length - a.needle.length);

/**
 * Extract a streaming provider named anywhere in the text, independent of any
 * title. Case-insensitive. Returns undefined when no provider is mentioned, so
 * a generic "where can I watch X?" stays provider-neutral.
 */
export function extractProvider(text: string): KnownProvider | undefined {
  const t = text.toLowerCase();
  for (const { needle, provider } of PROVIDER_TERMS) {
    if (t.includes(needle)) return provider;
  }
  return undefined;
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
  ttl_poker_face: {
    contentId: "ttl_poker_face",
    previewAvailable: true,
    previewType: "trailer",
    durationSeconds: 45,
    previewSource: "mock://preview/poker-face",
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

/**
 * Simulated next-episode lookup for series, keyed by contentId. Answers
 * "what's next in X?" for Continue Watching. `hasNext: false` marks a series
 * whose demo data has no further episode after the user's last-watched point.
 * All values are prototype fixtures — not real episode metadata.
 */
const NEXT_EPISODE: Record<string, NextEpisode> = {
  ttl_love_island_usa: {
    contentId: "ttl_love_island_usa",
    title: "Love Island USA",
    seasonNumber: 8,
    episodeNumber: 12,
    episodeTitle: "The Dumping",
    hasNext: true,
  },
  ttl_deep_space_diner: {
    contentId: "ttl_deep_space_diner",
    title: "Deep Space Diner",
    seasonNumber: 1,
    episodeNumber: 5,
    episodeTitle: "Closing Time",
    hasNext: true,
  },
};

/** Return next-episode metadata for a series, or null when none is modelled. */
export function getNextEpisodeData(contentId: string): NextEpisode | null {
  return NEXT_EPISODE[contentId] ?? null;
}
