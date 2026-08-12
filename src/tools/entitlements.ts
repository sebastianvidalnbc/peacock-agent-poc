import { defineTool } from "./tool";
import {
  CapabilityListSchema,
  EmptyInputSchema,
  EntitlementsSchema,
} from "../peacock/schemas";

export const getEntitlementsTool = defineTool({
  name: "get_entitlements",
  title: "Get entitlements",
  description:
    "Return what the connected account's plan includes: downloads, ad level, simultaneous streams, max video quality, and offline device count.",
  inputSchema: EmptyInputSchema,
  outputSchema: EntitlementsSchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: true,
  handler: (service) => service.getEntitlements(),
});

export const getSupportedCapabilitiesTool = defineTool({
  name: "get_supported_capabilities",
  title: "Get supported capabilities",
  description:
    "List the account-related things this connector can help with, and whether each is available for the current context (e.g. externally-billed accounts).",
  inputSchema: EmptyInputSchema,
  outputSchema: CapabilityListSchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: false,
  handler: (service) => service.getSupportedCapabilities(),
});
