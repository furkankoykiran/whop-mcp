// ============================================================
//  Products & Experiences & Plans – MCP Tool Handlers
// ============================================================

import { z } from "zod";
import { whopGet, whopPost, whopPatch, whopDelete, formatApiError } from "../client.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Product, Plan, PaginatedResponse } from "../types.js";

export function registerProductTools(server: McpServer): void {
    // ── list_products ────────────────────────────────────────

    server.tool(
        "list_products",
        "List all products in your Whop company catalog, including plans and experiences.",
        {
            visibility: z
                .enum(["visible", "hidden", "archived"])
                .optional()
                .describe("Filter by product visibility."),
            page: z.number().int().positive().optional().default(1).describe("Page number."),
            per: z.number().int().min(1).max(100).optional().default(25).describe("Items per page."),
        },
        async (args) => {
            try {
                const data = await whopGet<PaginatedResponse<Product>>("/products", {
                    ...args,
                });
                const products = data.data;

                const lines = [
                    `**Products** (Page ${data.pagination.current_page}/${data.pagination.total_pages}, Total: ${data.pagination.total_count})`,
                    "",
                ];

                for (const p of products) {
                    lines.push(
                        `### ${p.name} (\`${p.id}\`)`,
                        `- Visibility: \`${p.visibility}\` | Headless: ${p.headless}`,
                        `- Slug: ${p.slug ?? "N/A"}`,
                        `- Plans: ${p.plans?.length ?? 0} | Experiences: ${p.experiences?.length ?? 0}`,
                        `- Created: ${new Date(p.created_at * 1000).toISOString()}`,
                        ""
                    );
                }

                if (products.length === 0) lines.push("No products found.");

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── get_product ──────────────────────────────────────────

    server.tool(
        "get_product",
        "Get detailed information about a specific product including its plans and experiences.",
        {
            product_id: z.string().describe("The product ID (e.g. prod_xxxx)."),
        },
        async ({ product_id }) => {
            try {
                const p = await whopGet<Product>(`/products/${product_id}?expand=plans,experiences`);

                const planLines = (p.plans ?? []).map(
                    (pl) =>
                        `  - \`${pl.id}\` | ${pl.billing_period} | ${(pl.renewal_price / 100).toFixed(2)} ${pl.currency.toUpperCase()} | Visibility: ${pl.visibility}`
                );

                const expLines = (p.experiences ?? []).map(
                    (e) => `  - \`${e.id}\` | Type: ${e.experience_type} | Permission: ${e.permission_level}`
                );

                const text = [
                    `**Product: ${p.name}** (\`${p.id}\`)`,
                    `- Visibility: \`${p.visibility}\` | Headless: ${p.headless}`,
                    `- Slug: ${p.slug ?? "N/A"}`,
                    `- Company ID: ${p.company_id}`,
                    `- Description: ${p.description ?? "N/A"}`,
                    `- Image: ${p.image ?? "N/A"}`,
                    `- Created: ${new Date(p.created_at * 1000).toISOString()}`,
                    "",
                    `**Plans (${p.plans?.length ?? 0}):**`,
                    ...(planLines.length > 0 ? planLines : ["  None"]),
                    "",
                    `**Experiences (${p.experiences?.length ?? 0}):**`,
                    ...(expLines.length > 0 ? expLines : ["  None"]),
                ].join("\n");

                return { content: [{ type: "text", text }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── create_product ───────────────────────────────────────

    server.tool(
        "create_product",
        "Create a new product in your Whop company catalog.",
        {
            name: z.string().min(1).describe("Product name."),
            visibility: z
                .enum(["visible", "hidden"])
                .optional()
                .default("visible")
                .describe("Product visibility (default: visible)."),
            description: z.string().optional().describe("Product description (optional)."),
            headless: z
                .boolean()
                .optional()
                .default(false)
                .describe("Whether the product is headless (no Whop storefront)."),
        },
        async (args) => {
            try {
                const product = await whopPost<Product>("/products", args);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Product created!\n- ID: \`${product.id}\`\n- Name: **${product.name}**\n- Visibility: \`${product.visibility}\`\n- Created: ${new Date(product.created_at * 1000).toISOString()}`,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── update_product ───────────────────────────────────────

    server.tool(
        "update_product",
        "Update an existing product's name, visibility, or description.",
        {
            product_id: z.string().describe("The product ID to update."),
            name: z.string().optional().describe("New product name."),
            visibility: z.enum(["visible", "hidden", "archived"]).optional().describe("New visibility."),
            description: z.string().optional().describe("New description."),
        },
        async ({ product_id, ...rest }) => {
            try {
                const product = await whopPatch<Product>(`/products/${product_id}`, rest);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Product **${product.id}** updated.\n- Name: ${product.name}\n- Visibility: \`${product.visibility}\``,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── delete_product ───────────────────────────────────────

    server.tool(
        "delete_product",
        "Delete a product from your catalog. This action is irreversible.",
        {
            product_id: z.string().describe("The product ID to delete."),
        },
        async ({ product_id }) => {
            try {
                await whopDelete(`/products/${product_id}`);
                return {
                    content: [
                        {
                            type: "text",
                            text: `✅ Product \`${product_id}\` has been deleted.`,
                        },
                    ],
                };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );

    // ── list_plans ───────────────────────────────────────────

    server.tool(
        "list_plans",
        "List all pricing plans for a specific product.",
        {
            product_id: z.string().describe("The product ID whose plans you want to list."),
        },
        async ({ product_id }) => {
            try {
                const data = await whopGet<PaginatedResponse<Plan>>(`/plans`, {
                    product_id,
                });
                const plans = data.data;

                const lines = [
                    `**Plans for product \`${product_id}\`** (${plans.length} total)`,
                    "",
                    ...plans.map(
                        (pl) =>
                            `- \`${pl.id}\` | ${pl.name ?? "Unnamed"} | ${pl.billing_period} | ${(pl.renewal_price / 100).toFixed(2)} ${pl.currency.toUpperCase()} | Visibility: \`${pl.visibility}\``
                    ),
                ];

                if (plans.length === 0) lines.push("No plans found for this product.");

                return { content: [{ type: "text", text: lines.join("\n") }] };
            } catch (err) {
                return { content: [{ type: "text", text: formatApiError(err) }], isError: true };
            }
        }
    );
}
