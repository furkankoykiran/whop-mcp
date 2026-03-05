// ============================================================
//  Memberships & Licenses – MCP Tool Handlers
// ============================================================

import { z } from "zod";
import { whopGet, whopPost, whopPatch, formatApiError, safeDate } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Membership, PaginatedResponse } from "../types.js";

export function registerMembershipTools(server: McpServer): void {
    // ── list_memberships ─────────────────────────────────────

    server.tool(
        "list_memberships",
        "List all memberships for your Whop company with optional filters.",
        {
            product_id: z.string().optional().describe("Filter by product ID."),
            plan_id: z.string().optional().describe("Filter by plan ID."),
            user_id: z.string().optional().describe("Filter by user ID."),
            status: z
                .enum(["active", "trialing", "past_due", "unpaid", "canceled", "expired"])
                .optional()
                .describe("Filter by membership status."),
            valid: z.boolean().optional().describe("Filter by validity (true = currently active)."),
            page: z.number().int().positive().optional().default(1).describe("Page number."),
            per: z.number().int().min(1).max(100).optional().default(25).describe("Items per page."),
        },
        async (args) => {
            try {
                const data = await whopGet<PaginatedResponse<Membership>>("/memberships", {
                    ...args,
                });
                const memberships = data.data;
                const pagination = data.pagination;

                const lines = [
                    `**Memberships** (Page ${pagination.current_page}/${pagination.total_page}, Total: ${pagination.total_count})`,
                    "",
                    ...memberships.map(
                        (m) =>
                            `- **${m.id}** | User: ${m.user_id} | Product: ${m.product_id} | Status: \`${m.status}\` | Valid: ${m.valid} | Expires: ${m.expires_at ? safeDate(m.expires_at) : "Never"}`
                    ),
                ];

                if (memberships.length === 0) lines.push("No memberships found for the given filters.");

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── get_membership ───────────────────────────────────────

    server.tool(
        "get_membership",
        "Get detailed information about a specific membership by its ID.",
        {
            membership_id: z.string().describe("The membership ID (e.g. mem_xxxx)."),
        },
        async ({ membership_id }) => {
            try {
                const m = await whopGet<Membership>(`/memberships/${membership_id}`);
                const text = [
                    `**Membership: ${m.id}**`,
                    `- User ID: ${m.user_id}`,
                    `- Email: ${m.email ?? "N/A"}`,
                    `- Product ID: ${m.product_id}`,
                    `- Plan ID: ${m.plan_id ?? "N/A"}`,
                    `- Status: \`${m.status}\``,
                    `- Valid: ${m.valid}`,
                    `- License Key: ${m.license_key ?? "N/A"}`,
                    `- Quantity: ${m.quantity}`,
                    `- Wallet Address: ${m.wallet_address ?? "N/A"}`,
                    `- Discord Account: ${m.discord_account_id ?? "N/A"}`,
                    `- Expires At: ${m.expires_at ? safeDate(m.expires_at) : "Never"}`,
                    `- Renewal Period: ${m.renewal_period_start ? safeDate(m.renewal_period_start) : "N/A"} → ${m.renewal_period_end ? safeDate(m.renewal_period_end) : "N/A"}`,
                    `- Created: ${m.created_at ? safeDate(m.created_at) : "N/A"}`,
                    `- Manage URL: ${m.manage_url}`,
                ].join("\n");
                return { content: [{ type: "text", text }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── validate_license ─────────────────────────────────────

    server.tool(
        "validate_license",
        "Validate a license key and check if it maps to an active, valid membership.",
        {
            license_key: z.string().describe("The license key string to validate."),
        },
        async ({ license_key }) => {
            try {
                // Search memberships by license_key via query param
                const data = await whopGet<PaginatedResponse<Membership>>("/memberships", {
                    license_key,
                });
                const matches = data.data.filter((m) => m.license_key === license_key);

                if (matches.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `❌ License key \`${license_key}\` was not found in any membership.`,
                            },
                        ],
                    };
                }

                const m = matches[0]!;
                const isValid = m.valid && m.status === "active";

                return {
                    content: [
                        {
                            type: "text",
                            text: [
                                `${isValid ? "✅" : "❌"} License Key: \`${license_key}\``,
                                `- Valid: **${m.valid}**`,
                                `- Status: \`${m.status}\``,
                                `- Membership ID: ${m.id}`,
                                `- User ID: ${m.user_id}`,
                                `- Product ID: ${m.product_id}`,
                                `- Expires At: ${safeDate(m.expires_at)}`,
                            ].join("\n"),
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── add_free_days ────────────────────────────────────────

    server.tool(
        "add_free_days",
        "Extend a membership by adding free days to it.",
        {
            membership_id: z.string().describe("The membership ID to extend."),
            days: z.number().int().positive().describe("Number of free days to add."),
        },
        async ({ membership_id, days }) => {
            try {
                const result = await whopPost<Membership>(
                    `/memberships/${membership_id}/add_free_days`,
                    { days }
                );
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Added ${days} free day(s) to membership **${result.id}**.\n- New Expiry: ${safeDate(result.expires_at)}`,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── cancel_membership ────────────────────────────────────

    server.tool(
        "cancel_membership",
        "Cancel a membership at period end (member retains access until expiry).",
        {
            membership_id: z.string().describe("The membership ID to cancel."),
        },
        async ({ membership_id }) => {
            try {
                const result = await whopPost<Membership>(
                    `/memberships/${membership_id}/cancel`
                );
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Membership **${result.id}** has been canceled.\n- Status: \`${result.status}\`\n- Active until: ${result.expires_at ? safeDate(result.expires_at) : "N/A"}`,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── terminate_membership ─────────────────────────────────

    server.tool(
        "terminate_membership",
        "Immediately terminate a membership and revoke all access. This is permanent.",
        {
            membership_id: z.string().describe("The membership ID to terminate immediately."),
        },
        async ({ membership_id }) => {
            try {
                const result = await whopPost<Membership>(
                    `/memberships/${membership_id}/terminate`
                );
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Membership **${result.id}** has been immediately terminated.\n- Status: \`${result.status}\``,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── update_membership ────────────────────────────────────

    server.tool(
        "update_membership",
        "Update metadata or notes on a membership record.",
        {
            membership_id: z.string().describe("The membership ID to update."),
            metadata: z
                .record(z.string(), z.unknown())
                .optional()
                .describe("Key-value metadata to store on the membership."),
        },
        async ({ membership_id, metadata }) => {
            try {
                const result = await whopPatch<Membership>(`/memberships/${membership_id}`, {
                    metadata,
                });
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Membership **${result.id}** updated successfully.`,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );
}
