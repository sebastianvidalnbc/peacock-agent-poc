/**
 * Lightweight, extensible intent router for the Phase 1 conversational
 * simulator. No external LLM is used. Rules are ordered; the first match wins.
 * Add new phrasings by extending the keyword lists / patterns below.
 */

import { extractTitleFromText } from "../data/catalog";

export type Intent =
  | { kind: "capabilities" }
  | { kind: "add_to_watchlist"; titleQuery: string }
  | { kind: "remove_from_watchlist"; titleQuery: string }
  | { kind: "get_watchlist" }
  | { kind: "commerce_info"; topic: "cancel" | "downgrade" | "upgrade" | "ads" }
  | { kind: "get_entitlements" }
  | { kind: "get_account" }
  | { kind: "get_subscription" }
  /** "I want to watch X" — offer the title with preview + connect/open. */
  | { kind: "watch_title"; contentId: string }
  /** "Is X on Peacock?" / "Where can I watch X?" — availability for a title. */
  | { kind: "title_availability"; contentId: string }
  /** "Preview X" or, via context, "Can I preview it?". */
  | { kind: "preview_title"; contentId?: string }
  /** "Open X in Peacock" or, via context, "Open it in Peacock". */
  | { kind: "open_in_peacock"; contentId?: string }
  /** "Tell me more about X" or, via context, "Tell me more about it". */
  | { kind: "title_details"; contentId?: string }
  /** A discovery/recommendation ask. `criteria` is a resolved genre or "". */
  | { kind: "recommend"; criteria: string }
  /** An explicit catalog lookup with an extracted search term. */
  | { kind: "search_catalog"; query: string }
  | { kind: "unknown" };

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

/** True when the text refers to a title only by pronoun ("it", "that", "this"). */
function refersByPronoun(t: string): boolean {
  return /\b(it|that|this|the show|the series|the title)\b/.test(t);
}

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

  // --- Title-oriented intents (content discovery + Peacock playback handoff) ---
  // A concrete title named in the text takes precedence for these verbs; some
  // follow-ups ("open it", "preview it") refer to the current title by pronoun
  // and are resolved from conversation context by the agent (contentId omitted).
  const named = extractTitleFromText(input);

  // "Tell me more about it / about X" — title details.
  if (/\b(tell me more|more (info|information|details)|more about|what's it about|whats it about)\b/.test(t)) {
    if (named) return { kind: "title_details", contentId: named.contentId };
    if (refersByPronoun(t)) return { kind: "title_details" };
  }

  // "Open (it) in Peacock" / "continue watching (it)" / "play it". Also matches
  // "Open <Title> in Peacock" (the resume text used after connecting).
  if (
    has(t, ["open in peacock", "open it in peacock", "open peacock", "continue watching", "continue in peacock", "play it", "start watching", "watch it now"]) ||
    (has(t, ["open"]) && has(t, ["peacock"]))
  ) {
    if (named) return { kind: "open_in_peacock", contentId: named.contentId };
    return { kind: "open_in_peacock" };
  }

  // "Preview (it)" / "watch a preview" / "can I preview it". (Never a watchlist
  // management action, so this is safe to resolve early.)
  if (has(t, ["preview", "trailer"]) && !has(t, ["watchlist", "watch list"])) {
    if (named) return { kind: "preview_title", contentId: named.contentId };
    return { kind: "preview_title" };
  }

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

  // A concrete catalog title named in the text → content-discovery intents.
  // Placed after account/subscription/watchlist rules so those still win for
  // management phrasings (e.g. "add X to my watchlist").
  if (named) {
    // "Is X on Peacock?" / "Where can I watch X?" — availability question.
    if (
      /\b(is|are|where|can i|how (do|can) i)\b/.test(t) &&
      has(t, ["on peacock", "available", "where can", "where do", "where to", "how do i watch", "how can i watch"])
    )
      return { kind: "title_availability", contentId: named.contentId };
    // Explicit catalog-lookup verbs keep their existing search behaviour so a
    // named title doesn't hijack "find X" / "search for X".
    const isSearchPhrasing = has(t, ["find", "search", "look for", "pull up", "is there"]);
    // Watch/playback phrasing → offer the title with preview + connect/open.
    if (
      !isSearchPhrasing &&
      (has(t, ["watch", "stream", "put on", "see", "start watching", "play"]) ||
        // A bare named title (no other actionable verb) also opens the offer.
        t === named.title.toLowerCase())
    )
      return { kind: "watch_title", contentId: named.contentId };
  }

  // Context follow-ups that name no title but refer to the current one by
  // pronoun ("open it in Peacock", "tell me more about it").
  if (has(t, ["open in peacock", "open peacock", "continue watching", "play it", "start watching", "watch it now"]) && refersByPronoun(t))
    return { kind: "open_in_peacock" };
  if (/\b(tell me more|more (info|information|details)|more about|what's it about|whats it about)\b/.test(t) && refersByPronoun(t))
    return { kind: "title_details" };

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
