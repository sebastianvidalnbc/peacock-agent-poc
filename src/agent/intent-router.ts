/**
 * Lightweight, extensible intent router for the Phase 1 conversational
 * simulator. No external LLM is used. Rules are ordered; the first match wins.
 * Add new phrasings by extending the keyword lists / patterns below.
 */

import { extractTitleFromText, extractProvider, type KnownProvider } from "../data/catalog";
import type { TitleAvailability } from "../peacock/types";

/**
 * The routed intent for a turn. The discriminated union below (`IntentBody`)
 * carries the kind-specific fields; every variant additionally carries an
 * optional `explicitApp` set when the turn began with an explicit app mention
 * (`@PeacockTV`). The agent uses it to (a) route public discovery through
 * Peacock capabilities rather than provider-neutral discovery, and (b) surface
 * "Invocation: explicit Peacock" in the debug trace. It never implies auth.
 */
export type Intent = IntentBody & { explicitApp?: ExplicitApp };

type IntentBody =
  | { kind: "capabilities" }
  | { kind: "add_to_watchlist"; titleQuery: string }
  | { kind: "remove_from_watchlist"; titleQuery: string }
  | { kind: "get_watchlist" }
  /**
   * A RED commerce action under current OpenAI plugin guidance (selling,
   * initiating, upgrading, reactivating, displaying plans, checking out). The
   * agent refuses with an explanation and performs zero mutation.
   */
  | { kind: "commerce_prohibited"; topic: "upgrade" | "new_subscription" | "reactivation" | "display_plans" | "checkout" }
  /**
   * A YELLOW subscription-management action (cancel / downgrade / pause) that
   * OpenAI's published guidance does not explicitly resolve. The agent responds
   * with a clarification-required message and performs zero mutation.
   */
  | { kind: "commerce_clarify"; topic: "cancel" | "downgrade" | "pause" }
  /**
   * A GREEN entitlement-gap explanation: the user asks about a benefit their
   * plan lacks (ads, downloads, quality, streams). The agent explains the gap
   * from read-only entitlements and may link to an informational page — never a
   * checkout.
   */
  | { kind: "plan_gap"; benefit: "ads" | "downloads" | "quality" | "streams" }
  /** "What was I watching?" — the account's viewing history. */
  | { kind: "viewing_history" }
  /** "Show my Continue Watching" — the in-progress rail. */
  | { kind: "continue_watching" }
  /** "Resume my last show" — the single most recent in-progress title. */
  | { kind: "resume_last" }
  /** "Continue <Title>" / "Where did I leave off in X?" — resume a title. */
  | { kind: "resume_title"; contentId?: string }
  /** "What's next in X?" — next-episode lookup for a series. */
  | { kind: "next_episode"; contentId?: string }
  /** "Show me things I haven't finished" — the unfinished subset. */
  | { kind: "unfinished" }
  | { kind: "get_entitlements" }
  | { kind: "get_account" }
  | { kind: "get_subscription" }
  /** "I want to watch X" — offer the title with preview + connect/open. */
  | { kind: "watch_title"; contentId: string }
  /**
   * "Is X on Peacock?" — Peacock-specific availability for a title. `contentId`
   * may be omitted when the title is referred to by pronoun and resolved from
   * conversation context by the agent.
   */
  | { kind: "title_availability"; contentId?: string }
  /**
   * "Is X on <provider>?" for a non-Peacock provider — answered neutrally via
   * discovery, filtered to whether that provider carries the title. `contentId`
   * may be omitted when the title is referred to by pronoun (resolved from
   * context by the agent).
   */
  | { kind: "provider_availability"; contentId?: string; provider: KnownProvider }
  /** "Where can I watch X?" — cross-service availability for a title. */
  | { kind: "where_to_watch"; contentId?: string }
  /** "Find <something> across services" — cross-service discovery search. */
  | { kind: "discover"; query: string }
  /** "Which of these do I already have?" — resolved from last discovery. */
  | { kind: "which_do_i_have" }
  /** "Preview X" or, via context, "Can I preview it?". */
  | { kind: "preview_title"; contentId?: string }
  /** "Open X in Peacock" or, via context, "Open it in Peacock". */
  | { kind: "open_in_peacock"; contentId?: string }
  /** "Tell me more about X" or, via context, "Tell me more about it". */
  | { kind: "title_details"; contentId?: string }
  /**
   * The user picks a title from what was just shown — by name ("Poker Face
   * sounds good"), by ordinal ("the second one"), or by bare pronoun ("that
   * one"). The agent promotes it to the referenced title and confirms. `ordinal`
   * is 1-based; when both are absent the agent uses the last single result.
   */
  | { kind: "select_title"; contentId?: string; ordinal?: number }
  /** A discovery/recommendation ask. `criteria` is a resolved genre or "". */
  | { kind: "recommend"; criteria: string }
  /** An explicit catalog lookup with an extracted search term. */
  | { kind: "search_catalog"; query: string }
  /**
   * The request is recognisably in-domain (viewing/availability language) but a
   * required entity — the title — is missing and no context resolves it. The
   * agent asks a short clarification instead of the generic unsupported reply.
   */
  | { kind: "needs_title_clarification" }
  | { kind: "unknown" };

const has = (t: string, words: string[]) => words.some((w) => t.includes(w));

/**
 * An explicit app invocation parsed from a leading mention token. `@PeacockTV`
 * / `@Peacock` (any casing, optional following space) normalise to
 * `explicitApp: "peacock"`; the mention is stripped before intent matching so
 * the rest of the request routes normally, but through Peacock capabilities.
 * Explicit invocation never implies the account is authenticated — personal
 * actions still require a connection.
 */
export type ExplicitApp = "peacock";

export interface ParsedInvocation {
  explicitApp?: ExplicitApp;
  /** The request text with any leading app-mention token removed. */
  text: string;
}

const PEACOCK_MENTION = /^\s*@peacock(?:tv)?\b[\s,:-]*/i;

/**
 * Detect and strip a leading `@PeacockTV` / `@Peacock` mention. Only a leading
 * mention counts as an explicit invocation; a mid-sentence "@peacock" is left
 * untouched so it can't accidentally reroute a normal request.
 */
export function parseInvocation(input: string): ParsedInvocation {
  const m = input.match(PEACOCK_MENTION);
  if (m) return { explicitApp: "peacock", text: input.slice(m[0].length) };
  return { text: input };
}

/**
 * Normalise a raw user turn once, before any intent matching. Lowercases,
 * collapses runs of whitespace, normalises curly apostrophes to straight ones,
 * and strips trailing punctuation (including a space before a "?", so
 * "…peacock ?" behaves like "…peacock?"). Meaningful title words are preserved
 * — only surrounding noise is removed. Title extraction runs against the raw
 * input separately so casing/spacing there is never a factor.
 */
export function normalize(input: string): string {
  return input
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, " ")
    .replace(/\s*[?.!]+\s*$/g, "")
    .trim();
}

/** True when the text refers to a title only by pronoun ("it", "that", "this"). */
function refersByPronoun(t: string): boolean {
  return /\b(it|that|this|the show|the series|the title|the movie|the film)\b/.test(t);
}

/** Words that mark a positive selection/approval of a just-shown option. */
const APPROVAL =
  /\b(sounds (good|great|fun|perfect)|looks (good|great)|i like|i'?ll (watch|take|go with|do)|let'?s (do|go with|watch|try)|go with|i'?ll go with|pick|choose|i choose|that works|perfect|great choice|yeah|yes|sure)\b/;

/** Map ordinal words / digits to a 1-based index ("the second one" → 2). */
const ORDINALS: Record<string, number> = {
  first: 1, "1st": 1, one: 1,
  second: 2, "2nd": 2, two: 2,
  third: 3, "3rd": 3, three: 3,
  fourth: 4, "4th": 4, four: 4,
  fifth: 5, "5th": 5, five: 5,
  sixth: 6, "6th": 6, six: 6,
  last: -1,
};

/** Detect "the second one" / "that one" style ordinal picks. Returns a 1-based
 * index, -1 for "the last one", or undefined when no ordinal pick is present. */
function detectOrdinal(t: string): number | undefined {
  const m = t.match(/\bthe\s+(first|second|third|fourth|fifth|sixth|last|1st|2nd|3rd|4th|5th|6th)\b/);
  if (m) return ORDINALS[m[1]];
  if (/\bthe\s+last\s+(one|option|pick)\b/.test(t)) return -1;
  return undefined;
}

/**
 * Detect a selection of a just-shown result. Three shapes are accepted, in order
 * of specificity: a named title with approval phrasing ("Poker Face sounds
 * good", "I like Poker Face", "let's do Poker Face"); an ordinal pick ("the
 * second one", "the last one"); or a bare pronoun approval ("that one", "that
 * works", "yes"/"sure" on their own). Deliberately conservative: a named title
 * alone (no approval) is NOT a selection, so "Poker Face" still routes to a
 * watch offer, and action verbs (watch/preview/open/add) are handled elsewhere.
 */
function detectSelection(t: string, named: TitleAvailability | undefined): IntentBody | undefined {
  const approves = APPROVAL.test(t);
  const hasAction = has(t, ["preview", "trailer", "open", "watch", "stream", "play", "add", "put", "save", "remove", "where", "more about", "tell me more"]);
  if (hasAction) return undefined;
  if (named && approves) return { kind: "select_title", contentId: named.contentId };
  const ordinal = detectOrdinal(t);
  if (ordinal !== undefined) return { kind: "select_title", ordinal };
  // Bare pronoun/approval with no title: "that one", "that works", "yes"/"sure".
  if (/\b(that|this) (one|works|sounds good|looks good)\b/.test(t)) return { kind: "select_title" };
  if (approves && /\b(that|this|it)\b/.test(t)) return { kind: "select_title" };
  return undefined;
}

/**
 * Viewing/availability language: does the turn talk about watching, streaming,
 * or where something is available? Used both to broaden availability routing and
 * to decide, in the fallback, whether an entity-less request is still in-domain.
 */
function hasViewingLanguage(t: string): boolean {
  return (
    has(t, [
      "watch", "stream", "streaming", "available", "availability", "where can",
      "where do", "where else", "where is", "where's", "put on", "see it",
      "play", "on peacock", "on netflix", "on hulu", "on max", "on disney",
      "on prime", "on apple", "on paramount", "what service", "what services",
      "what platform", "have it", "carry", "carries",
    ]) || /\bdoes\b.*\bhave\b/.test(t)
  );
}

/**
 * True for availability questions in any natural phrasing: "is/are X on …",
 * "where can I watch X", "does <provider> have X", "is X streaming", "can I
 * stream X", "how do I watch X", "what service has X".
 */
function asksAvailability(t: string): boolean {
  if (/\bdoes\b.*\bhave\b/.test(t)) return true; // "does Peacock have X?"
  if (/\b(is|are)\b.*\b(streaming|available|on (peacock|netflix|hulu|max|disney|prime|apple|paramount))\b/.test(t))
    return true;
  if (/\b(can|could) i (watch|stream)\b/.test(t)) return true;
  if (/\bhow (do|can) i (watch|stream)\b/.test(t)) return true;
  if (/\bwhere (can|do|is|else|to|are)\b/.test(t)) return true;
  if (/\bwhat (service|services|platform|platforms)\b/.test(t)) return true;
  return false;
}

/** Strip a leading verb and trailing "to/on my watchlist" from an add/remove.
 * A leading politeness lead ("can you", "could you", "please", "would you") is
 * removed first so "can you add it to my watchlist" yields the pronoun "it",
 * which the agent then resolves from conversation context. */
function extractTitle(raw: string): string {
  return raw
    .replace(/^\s*(can|could|would|will)\s+you\s+(please\s+)?/i, "")
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

/**
 * Route a raw user turn to an intent. First strips any leading `@PeacockTV`
 * mention (recording it as an explicit invocation), routes the remaining text,
 * then stamps the invocation onto the result. For an explicit Peacock
 * invocation a bare title ("@PeacockTV The Traitors") is treated as a Peacock
 * catalog lookup rather than falling through to the generic reply, so explicit
 * discovery always reaches Peacock capabilities.
 */
export function routeIntent(input: string): Intent {
  const { explicitApp, text } = parseInvocation(input);
  const body = routeIntentBody(text);
  const intent: Intent = explicitApp ? explicitAppRoute(body, text) : body;
  if (explicitApp) intent.explicitApp = explicitApp;
  return intent;
}

/**
 * Adjust a routed intent for an explicit Peacock invocation. Public discovery
 * that came back generic (unknown / clarification) but names or fuzzily matches
 * a title becomes a Peacock catalog search, and a bare mention with no further
 * request lists Peacock capabilities. Everything else keeps its natural intent
 * (which the agent will route through Peacock because explicitApp is set).
 */
function explicitAppRoute(body: IntentBody, text: string): IntentBody {
  if (body.kind === "unknown" || body.kind === "needs_title_clarification") {
    const named = extractTitleFromText(text);
    if (named) return { kind: "search_catalog", query: named.title };
    const stripped = text.trim();
    if (stripped) return { kind: "search_catalog", query: extractSearchQuery(stripped) };
    return { kind: "capabilities" };
  }
  return body;
}

function routeIntentBody(input: string): IntentBody {
  // Normalise once for all keyword/phrase matching. Title extraction still runs
  // against the raw `input` so casing/spacing inside a title never matters.
  const t = normalize(input);

  if (
    has(t, [
      "what can you do", "what else can", "what else could", "how can you help",
      "what are you able", "what can peacock", "what can you help", "help me with",
      "what do you do", "capabilities",
    ]) && !/\bwatch\b/.test(t)
  )
    return { kind: "capabilities" };

  // "Which of these do I (already) have / can I watch with my account?" — a
  // follow-up on the previous cross-service discovery result. Checked early so
  // it isn't captured by the subscription/entitlements keyword rules.
  if (
    /\bwhich\b/.test(t) &&
    /\b(of (these|them|those)|do i (already )?(have|own)|already have|can i watch)\b/.test(t)
  )
    return { kind: "which_do_i_have" };

  // --- Title-oriented intents (content discovery + Peacock playback handoff) ---
  // A concrete title named in the text takes precedence for these verbs; some
  // follow-ups ("open it", "preview it") refer to the current title by pronoun
  // and are resolved from conversation context by the agent (contentId omitted).
  const named = extractTitleFromText(input);

  // Selection of a just-shown result: "Poker Face sounds good", "I like Poker
  // Face", "Let's do Poker Face", "that one", "the second one". This is a
  // choice, not an action verb (watch/preview/open/add handled later), so it is
  // only matched for approval/ordinal phrasing to avoid hijacking real requests.
  {
    const sel = detectSelection(t, named);
    if (sel) return sel;
  }

  // "Tell me more about it / about X" — title details.
  if (/\b(tell me more|more (info|information|details)|more about|what's it about|whats it about)\b/.test(t)) {
    if (named) return { kind: "title_details", contentId: named.contentId };
    if (refersByPronoun(t)) return { kind: "title_details" };
  }

  // --- Continue Watching / resume / viewing history (GREEN, account reads) ---
  // Checked before the playback handoff so "continue watching" (the rail) and
  // "what was I watching" resolve to viewing reads, while pronoun/title forms
  // like "continue watching it" / "continue Love Island" remain playback/resume.

  // "What's next in X?" / "next episode of X" — next-episode lookup.
  if (/\bnext (episode|ep|one)\b/.test(t) || /\bwhat'?s next\b/.test(t)) {
    if (named) return { kind: "next_episode", contentId: named.contentId };
    if (refersByPronoun(t) || has(t, ["watching"])) return { kind: "next_episode" };
  }

  // "Where did I leave off (in X)?" / "how far am I in X" — resume position.
  if (/\b(where did i|where'd i|did i) (leave off|left off|stop|get to)\b/.test(t) || /\bleave off\b/.test(t) || /\bpick up where\b/.test(t)) {
    if (named) return { kind: "resume_title", contentId: named.contentId };
    return { kind: "resume_last" };
  }

  // "Resume/continue my last show" / "keep watching my last one" — most recent.
  if (
    /\b(resume|continue|keep watching|pick up|go back to)\b/.test(t) &&
    has(t, ["last", "recent", "where i left", "my show", "my series", "last show", "last one", "last thing"])
  )
    return { kind: "resume_last" };

  // "What was I watching?" / "my viewing history" / "recently watched" — history.
  if (
    /\bwhat (was|were|have|had) i (watching|been watching|watched)\b/.test(t) ||
    has(t, ["viewing history", "watch history", "recently watched", "what i watched", "history of what"])
  )
    return { kind: "viewing_history" };

  // "Show me things I haven't finished" / "unfinished shows" — in-progress rail.
  if (
    /\b(haven'?t|have not|didn'?t|did not) finish(ed)?\b/.test(t) ||
    has(t, ["unfinished", "not finished", "still watching", "in progress", "half watched", "half-watched", "partially watched"])
  )
    return { kind: "unfinished" };

  // Bare "continue watching" / "keep watching" / "my continue watching" (the
  // rail) with no title and no pronoun → the Continue Watching list. A named
  // title ("continue Love Island") or pronoun ("continue watching it") falls
  // through to resume/playback below instead.
  if (
    (has(t, ["continue watching", "keep watching"]) || /\bcontinue$/.test(t)) &&
    !named &&
    !refersByPronoun(t) &&
    !has(t, ["in peacock", "peacock"])
  )
    return { kind: "continue_watching" };

  // "Continue <Title>" / "resume <Title>" (a named title, no "open…peacock"
  // playback phrasing) → resume that specific title from its saved position.
  if (named && /\b(resume|continue)\b/.test(t) && !has(t, ["open", "in peacock"]))
    return { kind: "resume_title", contentId: named.contentId };

  // "Open (it) in Peacock" / "continue watching it" / "play it". Also matches
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

  // Add-to-watchlist: either a leading add verb, or an "add … to (my) watchlist"
  // phrasing anywhere in the turn (so "can you add it to my watchlist?" counts).
  if (
    (/^(please\s+)?(add|put|save)\b/i.test(t) && (has(t, ["watchlist", "watch list", "list", "queue"]) || /^(add|put|save)\s+\w/i.test(t))) ||
    (/\b(add|put|save)\b/.test(t) && has(t, ["watchlist", "watch list", "my list", "my queue"]))
  )
    return { kind: "add_to_watchlist", titleQuery: extractTitle(input) };

  if (has(t, ["remove", "delete", "take off", "drop", "get rid of"]) && has(t, ["watchlist", "watch list", "list", "queue"]))
    return { kind: "remove_from_watchlist", titleQuery: extractTitle(input) };

  if (
    (has(t, ["what's on my", "whats on my", "show", "see", "view", "my", "check"]) && has(t, ["watchlist", "watch list"])) ||
    has(t, ["my list", "my queue", "saved shows", "saved titles", "on my list"])
  )
    return { kind: "get_watchlist" };

  // --- Subscription commerce, split by policy status ---
  // GREEN entitlement-gap explanations first: a benefit the user wants that a
  // higher plan would provide. These are answered by explaining the gap from
  // read-only entitlements (never a checkout), so they must win over the RED
  // "upgrade" matcher when the user frames it as a benefit ("fewer ads",
  // "want downloads", "can I get 4K").
  // Distinguish a plan-gap *want* ("can I get X", "I want X", "get rid of ads")
  // from an entitlement *question* ("do I get X", "does my plan include X"),
  // which stays with get_entitlements below. The `wants` guard requires an
  // acquisitive framing so bare "do I get downloads?" isn't captured here.
  const wants =
    /\b(can|could|how (can|do|would)) i (get|have|watch)\b/.test(t) ||
    /\bi (want|need|would like|wish i had|wish i could)\b/.test(t) ||
    /\b(get me|give me|switch to|move to|is there a way to)\b/.test(t);
  if (has(t, ["fewer ads", "less ads", "fewer commercials", "remove ads", "reduce ads", "without ads", "no ads", "get rid of ads", "ad free", "ad-free"]))
    return { kind: "plan_gap", benefit: "ads" };
  if (wants && has(t, ["download", "downloads", "offline"]))
    return { kind: "plan_gap", benefit: "downloads" };
  if (wants && has(t, ["4k", "uhd", "higher quality", "better quality"]))
    return { kind: "plan_gap", benefit: "quality" };
  if (/\b(more|extra|additional)\b.*\b(streams|screens|devices)\b/.test(t))
    return { kind: "plan_gap", benefit: "streams" };

  // RED — prohibited commerce. Never sold, initiated, promoted, or checked out.
  if (has(t, ["reactivate", "reactivation", "renew my subscription", "restart my subscription", "resubscribe", "come back to peacock"]))
    return { kind: "commerce_prohibited", topic: "reactivation" };
  if (has(t, ["sign up", "sign me up", "subscribe", "new subscription", "start a subscription", "create an account", "join peacock", "get peacock"]))
    return { kind: "commerce_prohibited", topic: "new_subscription" };
  if (has(t, ["upgrade", "higher tier", "higher plan", "premium plus", "top tier", "better plan"]))
    return { kind: "commerce_prohibited", topic: "upgrade" };
  if (
    (has(t, ["plans", "plan options", "available plans", "compare plans", "pricing options"]) &&
      has(t, ["show", "see", "what", "which", "buy", "options", "compare", "pricing"])) ||
    has(t, ["show me plans", "what plans", "which plans"])
  )
    return { kind: "commerce_prohibited", topic: "display_plans" };
  if (has(t, ["checkout", "check out", "buy a subscription", "pay for peacock", "purchase peacock", "enter my card", "payment details"]))
    return { kind: "commerce_prohibited", topic: "checkout" };

  // YELLOW — subscription management OpenAI guidance does not resolve. The
  // agent stops with a clarification-required message and mutates nothing.
  if (has(t, ["cancel"])) return { kind: "commerce_clarify", topic: "cancel" };
  if (has(t, ["downgrade", "cheaper plan", "lower tier", "lower plan", "cheaper subscription"])) return { kind: "commerce_clarify", topic: "downgrade" };
  if (has(t, ["pause my", "pause subscription", "pause my subscription", "hold my subscription", "freeze my subscription", "suspend my subscription"])) return { kind: "commerce_clarify", topic: "pause" };

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

  // --- Availability / where-to-watch (intent detected independently of the
  // title entity, which may be named or referred to by pronoun) ---
  // Entities: the concrete title (if any) and a named provider (if any) are
  // extracted separately so the intent and its parameters stay decoupled.
  const provider = extractProvider(t);
  // Availability is a *question* ("is/where/does … have …?") or is signalled by
  // an explicitly named provider ("… on Netflix"). Merely saying "watch X" is a
  // playback offer (watch_title), not an availability question — so bare viewing
  // language alone must NOT trigger this branch.
  const wantsAvailability = asksAvailability(t) || !!provider;

  if (wantsAvailability) {
    // A non-Peacock provider named → provider-specific availability, answered
    // neutrally via discovery filtered to that provider. Peacock keeps its own
    // richer preview/connect card path (title_availability) below.
    if (provider && provider !== "peacock") {
      if (named) return { kind: "provider_availability", contentId: named.contentId, provider };
      if (refersByPronoun(t)) return { kind: "provider_availability", provider };
    }
    // "Is X on Peacock?" — Peacock-specific availability question.
    if (provider === "peacock") {
      if (named) return { kind: "title_availability", contentId: named.contentId };
      if (refersByPronoun(t)) return { kind: "title_availability" };
    }
    // No provider singled out → provider-neutral cross-service where-to-watch.
    if (named) return { kind: "where_to_watch", contentId: named.contentId };
    if (refersByPronoun(t)) return { kind: "where_to_watch" };
    // In-domain viewing/availability language but no resolvable title → clarify
    // instead of falling through to the generic unsupported reply.
    return { kind: "needs_title_clarification" };
  }

  // A concrete catalog title named in the text → content-discovery intents.
  // Placed after account/subscription/watchlist rules so those still win for
  // management phrasings (e.g. "add X to my watchlist").
  if (named) {
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

  // Explicit cross-service discovery ("find X across services / anywhere / on
  // any service", "what can I stream everywhere") → provider-neutral search.
  if (
    has(t, ["find", "search", "look for", "show me", "pull up", "what can i stream", "what can i watch"]) &&
    has(t, ["across services", "across all services", "any service", "all services", "anywhere", "everywhere", "every service", "which services", "what services", "streaming services"])
  )
    return { kind: "discover", query: extractSearchQuery(input) };

  // Explicit catalog lookups with an extractable term.
  if (has(t, ["find", "search", "look for", "show me", "pull up", "is there"]))
    return { kind: "search_catalog", query: extractSearchQuery(input) };

  // A bare mood/genre word (e.g. "comedy", "something funny") is discovery.
  if (detectGenre(t))
    return { kind: "recommend", criteria: detectGenre(t) };

  // Recognisably in-domain viewing/availability language but nothing above
  // resolved a title or genre → ask a short clarification rather than the
  // generic unsupported reply. This keeps the fallback graceful for phrasings
  // like "watch something" or "is it streaming anywhere" that name no entity.
  if (hasViewingLanguage(t))
    return { kind: "needs_title_clarification" };

  return { kind: "unknown" };
}
