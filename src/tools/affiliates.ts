// ============================================================
//  Affiliates – MCP Tool Handlers
// ============================================================

import { z } from "zod";
import { whopGet, formatApiError, safeDate } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Affiliate, PaginatedResponse } from "../types.js";

export function registerAffiliateTools(server: McpServer): void {
    // ── list_affiliates ──────────────────────────────────────

    server.tool(
        "list_affiliates",
        "List all affiliate partners for your Whop company with their commission and earnings data.",
        {
            status: z
                .enum(["active", "inactive", "pending"])
                .optional()
                .describe("Filter affiliates by status."),
            page: z.number().int().positive().optional().default(1).describe("Page number."),
            per: z.number().int().min(1).max(100).optional().default(25).describe("Items per page."),
        },
        async (args) => {
            try {
                const data = await whopGet<PaginatedResponse<Affiliate>>("/affiliates", {
                    ...args,
                });
                const affiliates = data.data;

                const lines = [
                    `**Affiliates** (Page ${data.pagination.current_page}/${data.pagination.total_page}, Total: ${data.pagination.total_count})`,
                    "",
                    ...affiliates.map(
                        (a) =>
                            `- \`${a.id}\` | User: \`${a.user_id}\` | Code: **${a.affiliate_code}** | Commission: ${a.commission_type === "percentage" ? `${a.commission_value}%` : `$${(a.commission_value / 100).toFixed(2)}`} | Status: \`${a.status}\` | Total Earnings: $${(a.total_earnings / 100).toFixed(2)} | Sales: ${a.total_sales}`
                    ),
                ];

                if (affiliates.length === 0) lines.push("No affiliates found.");

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── get_affiliate ────────────────────────────────────────

    server.tool(
        "get_affiliate",
        "Get detailed statistics for a specific affiliate partner by their affiliate ID.",
        {
            affiliate_id: z.string().describe("The affiliate ID (e.g. aff_xxxx)."),
        },
        async ({ affiliate_id }) => {
            try {
                const a = await whopGet<Affiliate>(`/affiliates/${affiliate_id}`);
                const text = [
                    `**Affiliate: ${a.affiliate_code}** (\`${a.id}\`)`,
                    `- User ID: ${a.user_id}`,
                    `- Status: \`${a.status}\``,
                    `- Commission: ${a.commission_type === "percentage" ? `${a.commission_value}%` : `$${(a.commission_value / 100).toFixed(2)}`} (${a.commission_type})`,
                    `- Total Earnings: $${(a.total_earnings / 100).toFixed(2)}`,
                    `- Pending Earnings: $${(a.pending_earnings / 100).toFixed(2)}`,
                    `- Paid Earnings: $${(a.paid_earnings / 100).toFixed(2)}`,
                    `- Total Sales: ${a.total_sales}`,
                    `- Created: ${safeDate(a.created_at)}`,
                ].join("\n");
                return { content: [{ type: "text", text }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── get_affiliate_summary ────────────────────────────────

    server.tool(
        "get_affiliate_summary",
        "Get an aggregate summary of all affiliate performance: total sales, earnings, and top performers.",
        {},
        async () => {
            try {
                const data = await whopGet<PaginatedResponse<Affiliate>>("/affiliates", { per: 100 });
                const affiliates = data.data;

                if (affiliates.length === 0) {
                    return {
                        content: [{ type: "text", text: "No affiliates found in your program." }],
                    };
                }

                let totalEarnings = 0;
                let totalPending = 0;
                let totalSales = 0;

                for (const a of affiliates) {
                    totalEarnings += a.total_earnings;
                    totalPending += a.pending_earnings;
                    totalSales += a.total_sales;
                }

                const sorted = [...affiliates].sort((a, b) => b.total_earnings - a.total_earnings);
                const top5 = sorted.slice(0, 5);

                const lines = [
                    "## 🤝 Affiliate Program Summary",
                    "",
                    `| Metric | Value |`,
                    `|--------|-------|`,
                    `| Total Affiliates (sample) | ${affiliates.length} / ${data.pagination.total_count} |`,
                    `| Total Sales | ${totalSales} |`,
                    `| Total Earnings Paid Out | $${(totalEarnings / 100).toFixed(2)} |`,
                    `| Pending Payout | $${(totalPending / 100).toFixed(2)} |`,
                    "",
                    "### 🏆 Top 5 Affiliates by Earnings",
                    ...top5.map(
                        (a, i) =>
                            `${i + 1}. **${a.affiliate_code}** — $${(a.total_earnings / 100).toFixed(2)} earnings | ${a.total_sales} sales`
                    ),
                ];

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );
}
