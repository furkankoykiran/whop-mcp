// ============================================================
//  Payments & Invoices – MCP Tool Handlers
// ============================================================

import { z } from "zod";
import { whopGet, whopPost, formatApiError, safeDate } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Payment, PaginatedResponse } from "../types.js";

export function registerPaymentTools(server: McpServer): void {
    // ── list_payments ────────────────────────────────────────

    server.tool(
        "list_payments",
        "List all payments for your Whop company with optional filters (status, product, date range, pagination).",
        {
            company_id: z
                .string()
                .optional()
                .describe("Filter by company ID (e.g. biz_xxxx). Uses your API key's company by default."),
            product_id: z.string().optional().describe("Filter by product ID."),
            plan_id: z.string().optional().describe("Filter by plan ID."),
            status: z
                .enum(["paid", "open", "void", "refunded", "disputed"])
                .optional()
                .describe("Filter by payment status."),
            billing_reason: z
                .enum(["subscription_create", "subscription_renew", "one_time_purchase"])
                .optional()
                .describe("Filter by billing reason."),
            user_id: z.string().optional().describe("Filter by user ID."),
            after_date: z.string().optional().describe("ISO 8601 start date filter (e.g. 2024-01-01)."),
            before_date: z.string().optional().describe("ISO 8601 end date filter (e.g. 2024-12-31)."),
            page: z.number().int().positive().optional().default(1).describe("Page number (default 1)."),
            per: z.number().int().min(1).max(100).optional().default(25).describe("Items per page (1-100, default 25)."),
        },
        async (args) => {
            try {
                const data = await whopGet<PaginatedResponse<Payment>>("/payments", {
                    ...args,
                });
                const payments = data.data;
                const pagination = data.pagination;

                const lines = [
                    `**Payments** (Page ${pagination.current_page}/${pagination.total_page}, Total: ${pagination.total_count})`,
                    "",
                    ...payments.map(
                        (p) =>
                            `- **${p.id}** | Status: \`${p.status}\` | Amount: ${(p.amount / 100).toFixed(2)} ${p.currency.toUpperCase()} | Billing: ${p.billing_reason} | Created: ${safeDate(p.created_at)}`
                    ),
                ];

                if (payments.length === 0) lines.push("No payments found for the given filters.");

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── get_payment ──────────────────────────────────────────

    server.tool(
        "get_payment",
        "Get detailed information about a specific payment by its ID.",
        {
            payment_id: z.string().describe("The payment ID (e.g. pay_xxxx)."),
        },
        async ({ payment_id }) => {
            try {
                const payment = await whopGet<Payment>(`/payments/${payment_id}`);
                const text = [
                    `**Payment: ${payment.id}**`,
                    `- Status: \`${payment.status}\``,
                    `- Amount: ${(payment.amount / 100).toFixed(2)} ${payment.currency.toUpperCase()}`,
                    `- Subtotal: ${(payment.subtotal / 100).toFixed(2)}`,
                    `- Fee: ${(payment.fee_amount / 100).toFixed(2)}`,
                    `- Tax: ${(payment.tax_amount / 100).toFixed(2)}`,
                    `- Discount: ${(payment.discount_amount / 100).toFixed(2)}`,
                    `- Refunded: ${(payment.refund_amount / 100).toFixed(2)}`,
                    `- Billing Reason: ${payment.billing_reason}`,
                    `- Payment Method: ${payment.payment_method}`,
                    `- User ID: ${payment.user_id}`,
                    `- Product ID: ${payment.product_id ?? "N/A"}`,
                    `- Plan ID: ${payment.plan_id ?? "N/A"}`,
                    `- Membership ID: ${payment.membership_id ?? "N/A"}`,
                    `- Created: ${safeDate(payment.created_at)}`,
                    `- Paid At: ${safeDate(payment.paid_at)}`,
                    `- Refunded At: ${safeDate(payment.refunded_at)}`,
                ].join("\n");
                return { content: [{ type: "text", text }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── refund_payment ───────────────────────────────────────

    server.tool(
        "refund_payment",
        "Issue a full or partial refund for a payment. Use with caution — this action cannot be undone.",
        {
            payment_id: z.string().describe("The payment ID to refund (e.g. pay_xxxx)."),
            amount: z
                .number()
                .positive()
                .optional()
                .describe("Refund amount in cents. Omit for a full refund."),
            reason: z
                .enum(["duplicate", "fraudulent", "requested_by_customer", "other"])
                .optional()
                .describe("Reason for the refund."),
        },
        async ({ payment_id, amount, reason }) => {
            try {
                const body: Record<string, unknown> = {};
                if (amount !== undefined) body["amount"] = amount;
                if (reason !== undefined) body["reason"] = reason;
                const result = await whopPost<Payment>(`/payments/${payment_id}/refund`, body);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Refund initiated for payment **${result.id}**.\n- New Status: \`${result.status}\`\n- Refunded Amount: ${(result.refund_amount / 100).toFixed(2)} ${result.currency.toUpperCase()}`,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── retry_payment ────────────────────────────────────────

    server.tool(
        "retry_payment",
        "Retry a failed payment attempt for a given payment ID.",
        {
            payment_id: z.string().describe("The payment ID to retry (e.g. pay_xxxx)."),
        },
        async ({ payment_id }) => {
            try {
                const result = await whopPost<Payment>(`/payments/${payment_id}/retry`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Retry triggered for payment **${result.id}**.\n- Status: \`${result.status}\``,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── void_payment ─────────────────────────────────────────

    server.tool(
        "void_payment",
        "Void an open or uncollected payment. The payment must not yet be collected.",
        {
            payment_id: z.string().describe("The payment ID to void (e.g. pay_xxxx)."),
        },
        async ({ payment_id }) => {
            try {
                const result = await whopPost<Payment>(`/payments/${payment_id}/void`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Payment **${result.id}** has been voided.\n- Status: \`${result.status}\``,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── get_financial_summary ──────────────────────────────

    server.tool(
        "get_financial_summary",
        "Get a high-level financial summary: total revenue, refunds, fees, and payment breakdown by status.",
        {
            company_id: z.string().optional().describe("Company ID to scope the summary."),
            after_date: z.string().optional().describe("ISO 8601 start date (e.g. 2024-01-01)."),
            before_date: z.string().optional().describe("ISO 8601 end date (e.g. 2024-12-31)."),
        },
        async (args) => {
            try {
                // Fetch first page to understand total count and aggregate
                const data = await whopGet<PaginatedResponse<Payment>>("/payments", {
                    ...args,
                    per: 100,
                });

                const allPayments = data.data;
                const statusBreakdown: Record<string, number> = {};
                let totalRevenue = 0;
                let totalRefunds = 0;
                let totalFees = 0;

                for (const p of allPayments) {
                    statusBreakdown[p.status] = (statusBreakdown[p.status] ?? 0) + 1;
                    if (p.status === "paid") totalRevenue += p.amount;
                    totalRefunds += p.refund_amount;
                    totalFees += p.fee_amount;
                }

                const currency = allPayments[0]?.currency?.toUpperCase() ?? "USD";

                const lines = [
                    "## 💰 Financial Summary",
                    "",
                    `| Metric | Value |`,
                    `|--------|-------|`,
                    `| Total Payments in Sample | ${allPayments.length} / ${data.pagination.total_count} |`,
                    `| Gross Revenue (paid) | ${(totalRevenue / 100).toFixed(2)} ${currency} |`,
                    `| Total Refunds | ${(totalRefunds / 100).toFixed(2)} ${currency} |`,
                    `| Total Platform Fees | ${(totalFees / 100).toFixed(2)} ${currency} |`,
                    `| Net Revenue | ${((totalRevenue - totalRefunds - totalFees) / 100).toFixed(2)} ${currency} |`,
                    "",
                    "### Status Breakdown",
                    ...Object.entries(statusBreakdown).map(
                        ([status, count]) => `- **${status}**: ${count} payment(s)`
                    ),
                    "",
                    "> Note: Summary is based on up to 100 most recent payments. Use filters or pagination for a broader date range.",
                ];

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );
}
