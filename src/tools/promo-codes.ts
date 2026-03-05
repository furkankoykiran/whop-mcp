// ============================================================
//  Promo Codes – MCP Tool Handlers
// ============================================================

import { z } from "zod";
import { whopGet, whopPost, whopPatch, whopDelete, formatApiError } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { PromoCode, PaginatedResponse } from "../types.js";

export function registerPromoCodeTools(server: McpServer): void {
    // ── list_promo_codes ─────────────────────────────────────

    server.tool(
        "list_promo_codes",
        "List all promo codes for your Whop company, with optional filters.",
        {
            status: z
                .enum(["active", "inactive", "expired"])
                .optional()
                .describe("Filter promo codes by status."),
            page: z.number().int().positive().optional().default(1).describe("Page number."),
            per: z.number().int().min(1).max(100).optional().default(25).describe("Items per page."),
        },
        async (args) => {
            try {
                const data = await whopGet<PaginatedResponse<PromoCode>>("/promo_codes", {
                    ...args,
                });
                const codes = data.data;

                const lines = [
                    `**Promo Codes** (Page ${data.pagination.current_page}/${data.pagination.total_pages}, Total: ${data.pagination.total_count})`,
                    "",
                    ...codes.map(
                        (c) =>
                            `- **\`${c.code}\`** (\`${c.id}\`) | ${c.discount_type === "dollar" ? `$${(c.discount_amount / 100).toFixed(2)}` : `${c.discount_amount}%`} off | Status: \`${c.status}\` | Used: ${c.used_count}${c.quantity !== null ? `/${c.quantity}` : ""} | Expires: ${c.expiry_date ? new Date(c.expiry_date * 1000).toISOString() : "Never"}`
                    ),
                ];

                if (codes.length === 0) lines.push("No promo codes found.");

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── get_promo_code ───────────────────────────────────────

    server.tool(
        "get_promo_code",
        "Get detailed information about a specific promo code by its ID.",
        {
            promo_code_id: z.string().describe("The promo code ID (e.g. promo_xxxx)."),
        },
        async ({ promo_code_id }) => {
            try {
                const c = await whopGet<PromoCode>(`/promo_codes/${promo_code_id}`);
                const text = [
                    `**Promo Code: \`${c.code}\`** (\`${c.id}\`)`,
                    `- Discount: ${c.discount_type === "dollar" ? `${(c.discount_amount / 100).toFixed(2)} ${(c.currency ?? "USD").toUpperCase()}` : `${c.discount_amount}%`}`,
                    `- Status: \`${c.status}\``,
                    `- Used: ${c.used_count} / ${c.unlimited ? "Unlimited" : (c.quantity ?? "N/A")}`,
                    `- Expiry: ${c.expiry_date ? new Date(c.expiry_date * 1000).toISOString() : "Never"}`,
                    `- Products: ${c.products?.join(", ") ?? "All"}`,
                    `- Plans: ${c.plans?.join(", ") ?? "All"}`,
                    `- Created: ${new Date(c.created_at * 1000).toISOString()}`,
                ].join("\n");
                return { content: [{ type: "text", text }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── create_promo_code ────────────────────────────────────

    server.tool(
        "create_promo_code",
        "Create a new promo code with discount configuration.",
        {
            code: z
                .string()
                .min(1)
                .max(32)
                .describe("The promo code string customers will enter at checkout (e.g. SAVE20)."),
            discount_type: z
                .enum(["percentage", "dollar"])
                .describe("Type of discount: percentage (%) or dollar ($)."),
            discount_amount: z
                .number()
                .positive()
                .describe("Discount value. For percentage, use 0-100. For dollar, use amount in cents."),
            currency: z
                .string()
                .optional()
                .describe("Currency code for dollar discounts (e.g. USD). Required for dollar type."),
            quantity: z
                .number()
                .int()
                .positive()
                .optional()
                .describe("Max number of times this code can be used. Omit for unlimited."),
            expiry_date: z
                .string()
                .optional()
                .describe("Expiry date as ISO 8601 string (e.g. 2025-12-31). Omit for no expiry."),
            product_ids: z
                .array(z.string())
                .optional()
                .describe("Restrict code to specific product IDs. Omit for all products."),
            plan_ids: z
                .array(z.string())
                .optional()
                .describe("Restrict code to specific plan IDs. Omit for all plans."),
        },
        async (args) => {
            try {
                const body: Record<string, unknown> = {
                    code: args.code,
                    discount_type: args.discount_type,
                    discount_amount: args.discount_amount,
                };
                if (args.currency) body["currency"] = args.currency;
                if (args.quantity !== undefined) body["quantity"] = args.quantity;
                if (args.expiry_date) body["expiry_date"] = Math.floor(new Date(args.expiry_date).getTime() / 1000);
                if (args.product_ids) body["products"] = args.product_ids;
                if (args.plan_ids) body["plans"] = args.plan_ids;

                const c = await whopPost<PromoCode>("/promo_codes", body);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Promo code **\`${c.code}\`** created!\n- ID: \`${c.id}\`\n- Discount: ${c.discount_type === "dollar" ? `${(c.discount_amount / 100).toFixed(2)} ${(c.currency ?? "USD").toUpperCase()}` : `${c.discount_amount}%`}\n- Status: \`${c.status}\`\n- Uses: ${c.unlimited ? "Unlimited" : c.quantity}`,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── update_promo_code ────────────────────────────────────

    server.tool(
        "update_promo_code",
        "Update an existing promo code (e.g. disable it or change expiry).",
        {
            promo_code_id: z.string().describe("The promo code ID to update."),
            status: z.enum(["active", "inactive"]).optional().describe("New status."),
            quantity: z.number().int().positive().optional().describe("New usage limit."),
            expiry_date: z.string().optional().describe("New expiry date as ISO 8601 string."),
        },
        async ({ promo_code_id, status, quantity, expiry_date }) => {
            try {
                const body: Record<string, unknown> = {};
                if (status !== undefined) body["status"] = status;
                if (quantity !== undefined) body["quantity"] = quantity;
                if (expiry_date !== undefined)
                    body["expiry_date"] = Math.floor(new Date(expiry_date).getTime() / 1000);

                const c = await whopPatch<PromoCode>(`/promo_codes/${promo_code_id}`, body);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Promo code **\`${c.code}\`** (\`${c.id}\`) updated.\n- Status: \`${c.status}\`\n- Expires: ${c.expiry_date ? new Date(c.expiry_date * 1000).toISOString() : "Never"}`,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── delete_promo_code ────────────────────────────────────

    server.tool(
        "delete_promo_code",
        "Permanently delete a promo code. This cannot be undone.",
        {
            promo_code_id: z.string().describe("The promo code ID to delete."),
        },
        async ({ promo_code_id }) => {
            try {
                await whopDelete(`/promo_codes/${promo_code_id}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Promo code \`${promo_code_id}\` has been deleted.`,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );
}
