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

// Common tool inputs
export const ContentIdInputSchema = z.object({ contentId: z.string() });
export const SearchInputSchema = z.object({ query: z.string() });
export const EmptyInputSchema = z.object({});
