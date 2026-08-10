import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "record_donation",
  title: "Record a donation",
  description:
    "Record a new donation for an existing donor. Use list_donors first to find the donor id.",
  inputSchema: {
    donor_id: z.string().describe("The donor id the donation belongs to."),
    amount: z.number().describe("Donation amount in rupees."),
    donation_date: z.string().optional().describe("Donation date as YYYY-MM-DD. Defaults to today."),
    receipt_number: z.string().optional().describe("Receipt number, if one was issued."),
    notes: z.string().optional().describe("Optional note about the donation."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ donor_id, amount, donation_date, receipt_number, notes }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!(amount > 0)) {
      return { content: [{ type: "text", text: "Amount must be greater than zero" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("donations")
      .insert({
        donor_id,
        amount,
        donation_date: donation_date ?? new Date().toISOString().slice(0, 10),
        receipt_number: receipt_number ?? null,
        notes: notes ?? null,
      })
      .select("id, amount, donation_date, receipt_number")
      .single();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { donation: data },
    };
  },
});
