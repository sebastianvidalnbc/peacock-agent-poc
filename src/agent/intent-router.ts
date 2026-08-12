/**
 * Lightweight, extensible intent router for the Phase 1 conversational
 * simulator. No external LLM is used. Rules are ordered; the first match wins.
 * Add new phrasings by extending the keyword lists / patterns below.
 */

export type Intent =
  | { kind: "capabilities" }
  | { kind: "add_to_watchlist"; titleQuery: string }
  | { kind: "remove_from_watchlist"; titleQuery: string }
  | { kind: "get_watchlist" }
  | { kind: "commerce_info"; topic: "cancel" | "downgrade" | "upgrade" | "ads" }
  | { kind: "get_entitlements" }
  | { kind: "get_account" }
  | { kind: "get_subscription" }
  /** A discovery/recommendation ask. `criteria` is a resolved genre or "". */
  | { kind: "recommend"; criteria: string }
  /** An explicit catalog lookup with an extracted search term. */
  | { kind: "search_catalog"; query: string }
  | { kind: "unknown" };

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

/** Strip a leading verb and trailing "to/on my watchlist" from an add/remove. */
function extractTitle(raw: string): string {
  return raw
    .replace(/^\s*(please\s+)?(add|put|save|remove|delete|drop|take)\s+(off\s+)?/i, "")
    .replace(/\s+(to|on|from|off)\s+(my\s+)?(watch\s?list|list|queue)\s*[.!?]*$/i, "")
    .replace(/\s+(to|on|from)\s+(my\s+)?(watch\s?list|list|queue)/i, "")
    .replace(/[.!?]+$/g, "")
    .trim();
}

/** Maps colloquial mood/genre words to a catalog genre term. */
const GENRE_HINTS: Record<string, string> = {
  funny: "comedy",
  hilarious: "comedy",
  laugh: "comedy",
  comedy: "comedy",
  sitcom: "comedy",
  scary: "thriller",
  spooky: "thriller",
  suspense: "thriller",
  thriller: "thriller",
  drama: "drama",
  dramatic: "drama",
  action: "action",
  adventure: "adventure",
  romance: "romance",
  romantic: "romance",
  "sci-fi": "sci-fi",
  scifi: "sci-fi",
  "science fiction": "sci-fi",
  mystery: "mystery",
  crime: "crime",
  reality: "reality",
  history: "history",
  historical: "history",
};

/** Return a resolved genre term if any mood/genre hint appears in the text. */
export function detectGenre(t: string): string {
  for (const [hint, genre] of Object.entries(GENRE_HINTS)) {
    if (t.includes(hint)) return genre;
  }
  return "";
}

/** True for open-ended discovery phrasings ("what should I watch", "I'm bored"). */
function isRecommendationAsk(t: string): boolean {
  return (
    /what (should|shall|can|could|do|to|would|will) (i|we|you)\b.*\bwatch/.test(t) ||
    /\b(something|anything)\b.*\b(to watch|good|worth watching)\b/.test(t) ||
    /\b(recommend|suggest)\b/.test(t) ||
    /\b(any )?(recommendations|suggestions|ideas)\b/.test(t) ||
    /\b(i'?m|im|feeling|so) bored\b/.test(t) ||
    /\banything good\b/.test(t) ||
    /\bwhat'?s good\b/.test(t) ||
    /\bhelp me (find|pick|choose)\b/.test(t) ||
    /\bwhat to watch\b/.test(t)
  );
}

/**
 * Extract a concrete search term from an explicit catalog query, stripping the
 * command verb and filler so "find Poker Face" yields "poker face".
 */
export function extractSearchQuery(input: string): string {
  const t = input.toLowerCase().trim();
  const m = t.match(
    /(?:find|search for|search|look for|show me|pull up|is there)\s+(?:me\s+)?(?:any\s+)?(?:some\s+)?(?:the\s+)?(.+)/,
  );
  const raw = m ? m[1] : t;
  const cleaned = raw
    .replace(/\b(please|for me|to watch|on peacock|in the catalog|available)\b/g, "")
    .replace(/[?.!]+$/g, "")
    .trim();
  const genre = detectGenre(cleaned);
  if (genre) return genre;
  return cleaned;
}

export function routeIntent(input: string): Intent {
  const t = input.toLowerCase().trim();

  if (
    has(t, [
      "what can you do", "what else can", "what else could", "how can you help",
      "what are you able", "what can peacock", "what can you help", "help me with",
      "what do you do", "capabilities",
    ]) && !/\bwatch\b/.test(t)
  )
    return { kind: "capabilities" };

  if (/^(please\s+)?(add|put|save)\b/i.test(t) && (has(t, ["watchlist", "watch list", "list", "queue"]) || /^(add|put|save)\s+\w/i.test(t)))
    return { kind: "add_to_watchlist", titleQuery: extractTitle(input) };

  if (has(t, ["remove", "delete", "take off", "drop", "get rid of"]) && has(t, ["watchlist", "watch list", "list", "queue"]))
    return { kind: "remove_from_watchlist", titleQuery: extractTitle(input) };

  if (
    (has(t, ["what's on my", "whats on my", "show", "see", "view", "my", "check"]) && has(t, ["watchlist", "watch list"])) ||
    has(t, ["my list", "my queue", "saved shows", "saved titles", "on my list"])
  )
    return { kind: "get_watchlist" };

  if (has(t, ["cancel"])) return { kind: "commerce_info", topic: "cancel" };
  if (has(t, ["downgrade", "cheaper plan", "lower tier"])) return { kind: "commerce_info", topic: "downgrade" };
  if (has(t, ["upgrade", "higher tier"])) return { kind: "commerce_info", topic: "upgrade" };
  if (has(t, ["fewer ads", "less ads", "remove ads", "reduce ads", "without ads", "no ads"])) return { kind: "commerce_info", topic: "ads" };

  if (
    has(t, [
      "download", "offline", "include", "included", "features", "what do i get",
      "what does my plan", "how many streams", "simultaneous", "video quality",
      "resolution", "4k", "hd", "how many screens", "how many devices", "perks", "benefits",
    ])
  )
    return { kind: "get_entitlements" };

  if (has(t, ["account summary", "my account", "account details", "account info", "who am i", "my profile", "member since"]))
    return { kind: "get_account" };

  if (
    has(t, [
      "plan", "subscription", "subscribed", "paying", "pay for", "billing", "billed",
      "how much", "cost", "price", "renew", "renewal", "next payment", "what tier",
    ])
  )
    return { kind: "get_subscription" };

  // Open-ended discovery → recommendation intent (not a literal search).
  if (isRecommendationAsk(t))
    return { kind: "recommend", criteria: detectGenre(t) };

  // Explicit catalog lookups with an extractable term.
  if (has(t, ["find", "search", "look for", "show me", "pull up", "is there"]))
    return { kind: "search_catalog", query: extractSearchQuery(input) };

  // A bare mood/genre word (e.g. "comedy", "something funny") is discovery.
  if (detectGenre(t))
    return { kind: "recommend", criteria: detectGenre(t) };

  return { kind: "unknown" };
}
