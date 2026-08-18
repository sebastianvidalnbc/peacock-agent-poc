import { defineTool } from "./tool";
import { EmptyInputSchema, SubscriptionSchema } from "../peacock/schemas";

export const getSubscriptionTool = defineTool({
  name: "get_subscription",
  title: "Get subscription",
  description:
    "Return the connected account's current subscription: plan, status, billing provider, billing interval, price, and next renewal date.",
  inputSchema: EmptyInputSchema,
  outputSchema: SubscriptionSchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: true,
  authModes: ["oauth2"],
  readOnlyHint: true,
  openWorldHint: false,
  handler: (service) => service.getSubscription(),
});
