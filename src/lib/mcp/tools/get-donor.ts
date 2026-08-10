import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_donor",
  title: "Get donor details",
  description: "Get one donor's profile together with their donation history and total contributed.",
  inputSchema: {
    donor_id: z.string().describe("The donor id returned by list_donors."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ donor_id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: donor, error } = await supabase
      .from("donors")
      .select("id, name, phone, address, location, notes, clusters(name), sub_clusters(name)")
      .eq("id", donor_id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!donor) return { content: [{ type: "text", text: "Donor not found" }], isError: true };

    const { data: donations, error: donationsError } = await supabase
      .from("donations")
      .select("id, amount, donation_date, receipt_number, notes")
      .eq("donor_id", donor_id)
      .order("donation_date", { ascending: false });
    if (donationsError) {
      return { content: [{ type: "text", text: donationsError.message }], isError: true };
    }

    const total = (donations ?? []).reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
    const payload = { donor, donations: donations ?? [], total_amount: total };

    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
