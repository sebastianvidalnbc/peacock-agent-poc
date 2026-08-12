import type { Plan } from "../peacock/types";

/**
 * Fictional Peacock-inspired plans. Prices and feature limits are illustrative
 * placeholders for the prototype only — they are NOT real Peacock pricing or
 * entitlement rules.
 */
export const PLANS: Record<string, Plan> = {
  peacock_select: {
    id: "peacock_select",
    name: "Peacock Select (Demo)",
    tier: "mid",
    priceMonthly: 7.99,
    priceAnnual: null,
    adsLevel: "ads",
    downloads: false,
    description:
      "Mid-tier demo plan with ad-supported streaming and no offline downloads.",
    features: [
      "Ad-supported streaming",
      "Stream on 2 devices at once",
      "Up to 1080p video",
    ],
  },
  peacock_premium_plus: {
    id: "peacock_premium_plus",
    name: "Peacock Premium+ (Demo)",
    tier: "top",
    priceMonthly: 13.99,
    priceAnnual: 139.99,
    adsLevel: "fewer_ads",
    downloads: true,
    description:
      "Top-tier demo plan with fewer ads, offline downloads, and higher video quality.",
    features: [
      "Fewer ads",
      "Download to watch offline",
      "Stream on 3 devices at once",
      "Up to 4K where available",
    ],
  },
};

export const DEFAULT_PLAN_ID = "peacock_select";

export function getPlan(planId: string): Plan {
  const plan = PLANS[planId];
  if (!plan) {
    throw new Error(`Unknown plan id: ${planId}`);
  }
  return plan;
}

export function listPlans(): Plan[] {
  return Object.values(PLANS);
}
