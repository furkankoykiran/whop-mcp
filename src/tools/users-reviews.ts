// ============================================================
//  Users & Reviews – MCP Tool Handlers
// ============================================================

import { z } from "zod";
import { whopGet, formatApiError } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WhopUser, Review, PaginatedResponse } from "../types.js";

export function registerUserReviewTools(server: McpServer): void {
    // ── get_user ─────────────────────────────────────────────

    server.tool(
        "get_user",
        "Look up a Whop user by their username or numeric user ID.",
        {
            identifier: z
                .string()
                .describe("Username (e.g. john) or user ID (e.g. user_xxxx) to look up."),
        },
        async ({ identifier }) => {
            try {
                const user = await whopGet<WhopUser>(`/users/${identifier}`);
                const text = [
                    `**User: @${user.username}** (\`${user.id}\`)`,
                    `- Name: ${user.name ?? "N/A"}`,
                    `- Email: ${user.email ?? "N/A"}`,
                    `- Twitter: ${user.twitter_username ? `@${user.twitter_username}` : "N/A"}`,
                    `- Discord ID: ${user.discord_id ?? "N/A"}`,
                    `- Profile: ${user.profile_pic_url ?? "N/A"}`,
                    `- Joined: ${new Date(user.created_at * 1000).toISOString()}`,
                ].join("\n");
                return { content: [{ type: "text", text }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── search_users_by_email ─────────────────────────────────

    server.tool(
        "search_users_by_email",
        "Search for Whop users who have purchased from your company, filtered by email address.",
        {
            email: z.string().email().describe("Email address to search for."),
        },
        async ({ email }) => {
            try {
                // The Whop API supports email filtering on memberships
                const data = await whopGet<PaginatedResponse<{ user_id: string; email: string; id: string; product_id: string; status: string }>>("/memberships", {
                    email,
                    per: 50,
                });
                const matches = data.data;

                if (matches.length === 0) {
                    return {
                        content: [
                            {
                                type: "text",
                                text: `No users found with email \`${email}\`.`,
                            },
                        ],
                    };
                }

                const lines = [
                    `**Users matching email \`${email}\`** (${matches.length} membership record(s)):`,
                    "",
                    ...matches.map(
                        (m) =>
                            `- User ID: \`${m.user_id}\` | Membership: \`${m.id}\` | Product: \`${m.product_id}\` | Status: \`${m.status}\``
                    ),
                ];

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── list_reviews ─────────────────────────────────────────

    server.tool(
        "list_reviews",
        "Fetch the latest customer reviews left for your Whop company or a specific product.",
        {
            product_id: z.string().optional().describe("Filter reviews by product ID."),
            min_rating: z
                .number()
                .int()
                .min(1)
                .max(5)
                .optional()
                .describe("Filter reviews with rating >= this value (1-5)."),
            page: z.number().int().positive().optional().default(1).describe("Page number."),
            per: z.number().int().min(1).max(100).optional().default(25).describe("Items per page."),
        },
        async (args) => {
            try {
                const params: Record<string, string | number | boolean | undefined> = {
                    page: args.page,
                    per: args.per,
                };
                if (args.product_id) params["product_id"] = args.product_id;

                const data = await whopGet<PaginatedResponse<Review>>("/reviews", params);
                let reviews = data.data;

                // Client-side filter for min_rating since API may not support it
                if (args.min_rating !== undefined) {
                    reviews = reviews.filter((r) => r.rating >= (args.min_rating ?? 1));
                }

                const stars = (rating: number) => "⭐".repeat(rating);
                const lines = [
                    `**Reviews** (Page ${data.pagination.current_page}/${data.pagination.total_pages}, Total: ${data.pagination.total_count})`,
                    "",
                    ...reviews.map(
                        (r) =>
                            `- ${stars(r.rating)} | User: \`${r.user_id}\`${r.username ? ` (@${r.username})` : ""} | Product: \`${r.product_id}\` | "${r.message ?? "No comment"}" | ${new Date(r.created_at * 1000).toISOString()}`
                    ),
                ];

                if (reviews.length === 0) lines.push("No reviews found with the given filters.");

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── get_review_stats ─────────────────────────────────────

    server.tool(
        "get_review_stats",
        "Get aggregate review statistics for your company: average rating, distribution by star count.",
        {
            product_id: z.string().optional().describe("Scope stats to a specific product ID."),
        },
        async (args) => {
            try {
                const params: Record<string, string | number | boolean | undefined> = { per: 100 };
                if (args.product_id) params["product_id"] = args.product_id;

                const data = await whopGet<PaginatedResponse<Review>>("/reviews", params);
                const reviews = data.data;

                if (reviews.length === 0) {
                    return {
                        content: [{ type: "text", text: "No reviews found to compute statistics." }],
                    };
                }

                const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                let sum = 0;
                for (const r of reviews) {
                    dist[r.rating] = (dist[r.rating] ?? 0) + 1;
                    sum += r.rating;
                }
                const avg = sum / reviews.length;

                const lines = [
                    `## 📊 Review Statistics${args.product_id ? ` (Product: \`${args.product_id}\`)` : ""}`,
                    "",
                    `- **Avg Rating**: ${avg.toFixed(2)} / 5.0 ⭐`,
                    `- **Total Reviews (sample)**: ${reviews.length} / ${data.pagination.total_count}`,
                    "",
                    "### Star Distribution",
                    ...([5, 4, 3, 2, 1] as const).map((star) => {
                        const count = dist[star] ?? 0;
                        const pct = ((count / reviews.length) * 100).toFixed(1);
                        const bar = "█".repeat(Math.round((count / reviews.length) * 20));
                        return `- ${"⭐".repeat(star)}: ${bar} ${count} (${pct}%)`;
                    }),
                    "",
                    "> Note: Stats based on up to 100 most recent reviews.",
                ];

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );
}
