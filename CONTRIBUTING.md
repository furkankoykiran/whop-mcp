# Contributing to whop-mcp

Thank you for your interest in contributing! This is a community-led project — every pull request, bug report, and idea is welcome.

> ⚠️ **Disclaimer:** This is a community-led project and is **NOT** an official Whop.com product.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](./CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards. Please report unacceptable behavior to **furkankoykiran@gmail.com**.

---

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/whop-mcp.git
   cd whop-mcp
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/furkankoykiran/whop-mcp.git
   ```

---

## Development Setup

```bash
# Install dependencies
npm install

# Run type-check
npx tsc --noEmit

# Build
npm run build

# Run in dev mode (auto-reload)
npm run dev
```

You'll need a `WHOP_API_KEY` environment variable set to test against the real API:

```bash
export WHOP_API_KEY=your_company_api_key_here
npm run dev
```

---

## How to Contribute

### 1. Sync with upstream

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Create a feature branch

Use a descriptive branch name following this convention:

| Type | Pattern | Example |
|------|---------|----------|
| Feature | `feat/<short-description>` | `feat/add-webhook-tools` |
| Bug fix | `fix/<short-description>` | `fix/payment-refund-error` |
| Documentation | `docs/<short-description>` | `docs/update-readme` |
| Chore/Maintenance | `chore/<short-description>` | `chore/bump-dependencies` |

```bash
git checkout -b feat/your-feature-name
```

### 3. Make your changes

- Keep changes focused — one feature or fix per PR.
- Add or update types in `src/types.ts` for new API entities.
- Register new tools in the appropriate file under `src/tools/`.
- Register the new tool module in `src/index.ts`.
- Ensure `npx tsc --noEmit` passes with no errors.

### 4. Push and open a Pull Request

```bash
git push origin feat/your-feature-name
```

Then open a PR against `main` on GitHub using the provided PR template.

---

## Commit Message Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`

**Examples:**

```
feat(tools): add list_webhooks tool for payment events
fix(client): handle 503 service unavailable with retry
docs: update README with new tool examples
chore: bump @modelcontextprotocol/sdk to 1.11.0
```

---

## Pull Request Process

1. Fill out the **PR template** completely.
2. Ensure `npx tsc --noEmit` runs cleanly.
3. Link any related issues in the PR description.
4. A maintainer will review and either approve or request changes.
5. Once approved, the PR will be **squash-merged** into `main`.
6. The branch will be deleted after merging.

---

## Reporting Bugs

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.yml) to file an issue. Please include:

- Steps to reproduce
- Expected vs actual behavior
- Node.js version and OS
- Relevant error messages or logs

---

## Requesting Features

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.yml). Please include:

- The Whop API endpoint you'd like covered
- A description of the use case
- Any relevant API documentation links

---

Thank you for helping make **whop-mcp** better for the whole community! 🙌
