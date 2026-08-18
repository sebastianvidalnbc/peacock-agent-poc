import { defineTool } from "./tool";
import { AccountSummarySchema, EmptyInputSchema } from "../peacock/schemas";

export const getAccountSummaryTool = defineTool({
  name: "get_account_summary",
  title: "Get account summary",
  description:
    "Return a high-level summary of the connected Peacock account: display name, membership date, status, plan name, and billing provider.",
  inputSchema: EmptyInputSchema,
  outputSchema: AccountSummarySchema,
  mutates: false,
  requiresConfirmation: false,
  requiresAuth: true,
  authModes: ["oauth2"],
  readOnlyHint: true,
  openWorldHint: false,
  handler: (service) => service.getAccountSummary(),
});
