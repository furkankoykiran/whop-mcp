#!/usr/bin/env node
// ============================================================
//  whop-mcp – Main Entry Point
//  Community-led MCP server for Whop.com Company API
// ============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerPaymentTools } from "./tools/payments.js";
import { registerMembershipTools } from "./tools/memberships.js";
import { registerProductTools } from "./tools/products.js";
import { registerPromoCodeTools } from "./tools/promo-codes.js";
import { registerUserReviewTools } from "./tools/users-reviews.js";
import { registerAffiliateTools } from "./tools/affiliates.js";

// ── Validate environment on startup ─────────────────────────
if (!process.env["WHOP_API_KEY"]) {
    process.stderr.write(
        "[whop-mcp] ERROR: WHOP_API_KEY environment variable is not set.\n" +
        "Please generate a Company API Key from https://whop.com/dashboard/developer\n" +
        "and pass it as WHOP_API_KEY=... before starting this server.\n"
    );
    process.exit(1);
}

// ── Create MCP Server ────────────────────────────────────────
const server = new McpServer({
    name: "whop-mcp",
    version: "1.1.0",
    description:
        "Community-led MCP server for Whop.com Company API. " +
        "Manage payments, memberships, products, promo codes, affiliates and more via AI.",
});

// ── Register core tools ──────────────────────────────────────
server.tool("ping", "Check server connectivity and uptime", {}, async () => {
    return {
        content: [
            {
                type: "text",
                text: `pong (v1.1.0) - Server is healthy and responsive.`,
            },
        ],
    };
});

// ── Register all tool domains ────────────────────────────────
registerPaymentTools(server);
registerMembershipTools(server);
registerProductTools(server);
registerPromoCodeTools(server);
registerUserReviewTools(server);
registerAffiliateTools(server);

// ── Start server via stdio transport ─────────────────────────
const transport = new StdioServerTransport();

await server.connect(transport);

process.stderr.write("[whop-mcp] Server running on stdio transport. Ready for connections.\n");
