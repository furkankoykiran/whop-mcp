# Security Policy

## Supported Versions

Only the latest release of **whop-mcp** receives security updates.

| Version | Supported |
|---------|----------|
| Latest  | ✅ Yes   |
| Older   | ❌ No    |

---

## Reporting a Vulnerability

We take security seriously. If you discover a vulnerability in this project, **please do NOT open a public GitHub issue.**

Instead, report it privately:

📧 **Email:** furkankoykiran@gmail.com  
**Subject:** `[SECURITY] whop-mcp vulnerability report`

Please include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested mitigations (optional)

---

## Response Timeline

| Step | Timeframe |
|------|-----------|
| Acknowledgement | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix & release | Depends on severity |

---

## Security Best Practices for Users

- **Never hard-code your `WHOP_API_KEY`** in source code.
- Always pass the API key via environment variables.
- Use the **minimum permissions** required when creating Company API Keys on Whop's Developer Dashboard.
- Rotate your API key immediately if you suspect it has been compromised.
- Do not commit `.env` files to version control.

---

## Scope

This security policy covers vulnerabilities in the **whop-mcp** MCP server code itself. Issues with the Whop.com API or platform should be reported directly to Whop.com.

> ⚠️ This is a community-led project and is **NOT** an official Whop.com product.
