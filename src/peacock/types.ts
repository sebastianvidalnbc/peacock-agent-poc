import type { z } from "zod";
import type {
  AccountSummarySchema,
  AdsLevelSchema,
  AvailabilitySchema,
  BillingIntervalSchema,
  BillingProviderSchema,
  CancellationPreviewSchema,
  CapabilitySchema,
  CatalogTitleSchema,
  EntitlementsSchema,
  OfferTypeSchema,
  PlanChangePreviewSchema,
  PlanSchema,
  PlanTierSchema,
  PlaybackDestinationSchema,
  PreviewInfoSchema,
  PreviewTypeSchema,
  StreamingProviderSchema,
  SubscriptionSchema,
  SubscriptionStatusSchema,
  TitleAvailabilitySchema,
  TitleTypeSchema,
  ActionResultSchema,
  VideoQualitySchema,
  WatchHistoryEntrySchema,
} from "./schemas";

/**
 * Domain types for the prototype, derived from the Zod schemas so that the
 * schema definitions remain the single source of truth.
 */

export type AdsLevel = z.infer<typeof AdsLevelSchema>;
export type BillingProvider = z.infer<typeof BillingProviderSchema>;
export type BillingInterval = z.infer<typeof BillingIntervalSchema>;
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusSchema>;
export type PlanTier = z.infer<typeof PlanTierSchema>;
export type VideoQuality = z.infer<typeof VideoQualitySchema>;
export type TitleType = z.infer<typeof TitleTypeSchema>;

export type Plan = z.infer<typeof PlanSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type Entitlements = z.infer<typeof EntitlementsSchema>;
export type AccountSummary = z.infer<typeof AccountSummarySchema>;
export type CatalogTitle = z.infer<typeof CatalogTitleSchema>;
export type StreamingProvider = z.infer<typeof StreamingProviderSchema>;
export type OfferType = z.infer<typeof OfferTypeSchema>;
export type Availability = z.infer<typeof AvailabilitySchema>;
export type TitleAvailability = z.infer<typeof TitleAvailabilitySchema>;
export type WatchHistoryEntry = z.infer<typeof WatchHistoryEntrySchema>;
export type Capability = z.infer<typeof CapabilitySchema>;
export type PreviewType = z.infer<typeof PreviewTypeSchema>;
export type PreviewInfo = z.infer<typeof PreviewInfoSchema>;
export type PlaybackDestination = z.infer<typeof PlaybackDestinationSchema>;

export type PlanChangePreview = z.infer<typeof PlanChangePreviewSchema>;
export type CancellationPreview = z.infer<typeof CancellationPreviewSchema>;
export type ActionResult = z.infer<typeof ActionResultSchema>;

/** Error thrown by the service when a personal action needs a connection. */
export class PeacockNotConnectedError extends Error {
  constructor(message = "Peacock is not connected.") {
    super(message);
    this.name = "PeacockNotConnectedError";
  }
}

/** Error thrown when an action is not permitted for the current persona. */
export class PeacockActionUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PeacockActionUnavailableError";
  }
}
