import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_donations",
  title: "List donations",
  description:
    "List donations in a date range, newest first, with donor names, receipt numbers and the total for the range.",
  inputSchema: {
    from_date: z.string().optional().describe("Start date, inclusive, as YYYY-MM-DD."),
    to_date: z.string().optional().describe("End date, inclusive, as YYYY-MM-DD."),
    limit: z.number().int().optional().describe("Maximum number of donations to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from_date, to_date, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("donations")
      .select("id, amount, donation_date, receipt_number, notes, donors(name, phone)")
      .order("donation_date", { ascending: false })
      .limit(Math.min(Math.max(limit ?? 50, 1), 500));

    if (from_date) query = query.gte("donation_date", from_date);
    if (to_date) query = query.lte("donation_date", to_date);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = (data ?? []).map((d: Record<string, unknown>) => ({
      id: d.id as string,
      date: d.donation_date as string,
      amount: Number(d.amount ?? 0),
      receipt_number: (d.receipt_number as string) ?? null,
      donor: (d.donors as { name?: string } | null)?.name ?? null,
      notes: (d.notes as string) ?? null,
    }));
    const total = rows.reduce((sum, r) => sum + r.amount, 0);

    return {
      content: [{ type: "text", text: JSON.stringify({ donations: rows, total }, null, 2) }],
      structuredContent: { donations: rows, total, count: rows.length },
    };
  },
});
