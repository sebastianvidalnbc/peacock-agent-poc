import { z } from "zod";

/**
 * Shared domain schemas for the Peacock connector prototype.
 *
 * These Zod schemas are the single source of truth for domain shapes.
 * `types.ts` derives TypeScript types from them, and the MCP-compatible
 * tool layer reuses them for input/output validation. Everything here is
 * SIMULATED — no real Peacock API, credential, or pricing rule is modelled.
 */

export const AdsLevelSchema = z.enum(["ads", "fewer_ads", "no_ads"]);
export const BillingProviderSchema = z.enum(["peacock_direct", "apple"]);
export const BillingIntervalSchema = z.enum(["monthly", "annual"]);
export const SubscriptionStatusSchema = z.enum(["active", "cancelled", "lapsed"]);
export const PlanTierSchema = z.enum(["mid", "top"]);
export const VideoQualitySchema = z.enum(["720p", "1080p", "4K"]);
export const TitleTypeSchema = z.enum(["series", "film"]);

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: PlanTierSchema,
  priceMonthly: z.number(),
  priceAnnual: z.number().nullable(),
  adsLevel: AdsLevelSchema,
  downloads: z.boolean(),
  description: z.string(),
  features: z.array(z.string()),
});

export const SubscriptionSchema = z.object({
  status: SubscriptionStatusSchema,
  plan: PlanSchema,
  billingProvider: BillingProviderSchema,
  billingInterval: BillingIntervalSchema,
  renewsOn: z.string().nullable(),
  managedExternally: z.boolean(),
  priceLabel: z.string(),
});

export const EntitlementsSchema = z.object({
  planName: z.string(),
  downloads: z.boolean(),
  adsLevel: AdsLevelSchema,
  simultaneousStreams: z.number(),
  maxVideoQuality: VideoQualitySchema,
  offlineDevices: z.number(),
});

export const AccountSummarySchema = z.object({
  personaId: z.string(),
  displayName: z.string(),
  email: z.string(),
  memberSince: z.string(),
  status: SubscriptionStatusSchema,
  planName: z.string(),
  billingProvider: BillingProviderSchema,
});

export const CatalogTitleSchema = z.object({
  contentId: z.string(),
  title: z.string(),
  type: TitleTypeSchema,
  genres: z.array(z.string()),
  year: z.number(),
  rating: z.string(),
  synopsis: z.string(),
  downloadable: z.boolean(),
  // Discovery / playback-handoff metadata (all simulated, mock-safe). Optional
  // so existing catalog fixtures remain valid without these fields.
  availableOnPeacock: z.boolean().optional(),
  artworkRef: z.string().optional(),
  previewAvailable: z.boolean().optional(),
  playbackAvailable: z.boolean().optional(),
});

/**
 * Cross-service discovery schemas (Phase 2B). Provider-neutral and fully
 * simulated: no real availability API, brand asset, or deep link is modelled.
 * "peacock" is one provider among several — the assistant only treats it as
 * "owned" when the user's account context (connection + entitlement) justifies
 * it, never by default.
 */
export const StreamingProviderSchema = z.enum([
  "peacock",
  "netflix",
  "hulu",
  "max",
  "disney_plus",
  "prime_video",
  "apple_tv_plus",
]);

export const OfferTypeSchema = z.enum(["subscription", "free_ads", "rent", "buy"]);

export const AvailabilitySchema = z.object({
  provider: StreamingProviderSchema,
  offerType: OfferTypeSchema,
  /** Simulated maximum quality for this offer (label only). */
  quality: VideoQualitySchema.optional(),
  /** Simulated price label for rent/buy offers (e.g. "$3.99"). */
  priceLabel: z.string().optional(),
  /** Mock deep-link/destination for the prototype (not a real link). */
  deepLinkRef: z.string(),
});

/** A catalog title enriched with cross-service availability rows. */
export const TitleAvailabilitySchema = CatalogTitleSchema.extend({
  availability: z.array(AvailabilitySchema),
});

export const TitleAvailabilityListSchema = z.array(TitleAvailabilitySchema);

/** Criteria for a provider-neutral recommendation request. */
export const RecommendCriteriaInputSchema = z.object({
  genre: z.string().optional(),
});

// Simulated, prototype-safe preview capability for a title. Never references a
// real production media URL — only a mock source/identifier.
export const PreviewTypeSchema = z.enum(["clip", "trailer"]);
export const PreviewInfoSchema = z.object({
  contentId: z.string(),
  previewAvailable: z.boolean(),
  previewType: PreviewTypeSchema.nullable(),
  durationSeconds: z.number(),
  /** Mock preview source or preview identifier (no real Peacock media URL). */
  previewSource: z.string().nullable(),
});

// Simulated playback handoff destination for a title.
export const PlaybackDestinationSchema = z.object({
  contentId: z.string(),
  destination: z.literal("Peacock"),
  /** Whether an active Peacock connection/account context is required. */
  connectionRequired: z.boolean(),
  /** Mock deep-link/destination for the prototype (not a real production link). */
  destinationUrl: z.string(),
  actionLabel: z.string(),
});

export const WatchHistoryEntrySchema = z.object({
  contentId: z.string(),
  title: z.string(),
  watchedOn: z.string(),
  progressPct: z.number(),
});

export const CapabilitySchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  available: z.boolean(),
  reason: z.string().optional(),
});

export const WatchlistSchema = z.array(CatalogTitleSchema);
export const CapabilityListSchema = z.array(CapabilitySchema);
export const SearchResultsSchema = z.array(CatalogTitleSchema);

// Simulated commerce previews (defined for the service contract; not wired
// into Phase 1 tools/agent). Kept separate from any OpenAI production policy.
export const PlanChangePreviewSchema = z.object({
  previewId: z.string(),
  targetPlan: PlanSchema,
  currentPlanName: z.string(),
  priceLabel: z.string(),
  effectiveDate: z.string(),
  note: z.string(),
});

export const CancellationPreviewSchema = z.object({
  previewId: z.string(),
  accessUntil: z.string(),
  note: z.string(),
});

export const ActionResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

/**
 * Simulated per-title viewing progress for the connected account. Read-only in
 * this prototype (Continue Watching / resume / viewing history). All values are
 * fixture-derived; no real Peacock viewing telemetry is modelled.
 */
export const ViewingProgressSchema = z.object({
  contentId: z.string(),
  title: z.string(),
  seasonNumber: z.number().optional(),
  episodeNumber: z.number().optional(),
  episodeTitle: z.string().optional(),
  progressSeconds: z.number(),
  durationSeconds: z.number(),
  completed: z.boolean(),
  /** Simulated last-watched marker (ISO date). Not surfaced as a raw ID in UI. */
  lastWatchedAt: z.string().optional(),
});

export const ViewingHistorySchema = z.array(ViewingProgressSchema);

/** Next-episode metadata for a series, resolved from mock fixtures. */
export const NextEpisodeSchema = z.object({
  contentId: z.string(),
  title: z.string(),
  seasonNumber: z.number(),
  episodeNumber: z.number(),
  episodeTitle: z.string(),
  /** Whether the demo has a next episode after the user's last-watched point. */
  hasNext: z.boolean(),
});

// Common tool inputs
export const ContentIdInputSchema = z.object({ contentId: z.string() });
export const SearchInputSchema = z.object({ query: z.string() });
export const EmptyInputSchema = z.object({});
