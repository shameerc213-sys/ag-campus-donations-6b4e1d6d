import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_donors",
  title: "List donors",
  description:
    "List or search campus donors by name, phone or address. Optionally filter by cluster name.",
  inputSchema: {
    search: z.string().optional().describe("Text to match against donor name, phone or address."),
    cluster: z.string().optional().describe("Cluster name to filter by."),
    limit: z.number().int().optional().describe("Maximum number of donors to return (default 25)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, cluster, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("donors")
      .select("id, name, phone, address, location, clusters(name), sub_clusters(name)")
      .order("name")
      .limit(Math.min(Math.max(limit ?? 25, 1), 200));

    if (search) {
      const term = search.replace(/[%,]/g, " ").trim();
      query = query.or(`name.ilike.%${term}%,phone.ilike.%${term}%,address.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const rows = (data ?? [])
      .map((d: Record<string, unknown>) => ({
        id: d.id as string,
        name: d.name as string,
        phone: (d.phone as string) ?? null,
        address: (d.address as string) ?? null,
        cluster: (d.clusters as { name?: string } | null)?.name ?? null,
        sub_cluster: (d.sub_clusters as { name?: string } | null)?.name ?? null,
      }))
      .filter((d) => !cluster || (d.cluster ?? "").toLowerCase().includes(cluster.toLowerCase()));

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { donors: rows, count: rows.length },
    };
  },
});
