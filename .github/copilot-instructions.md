# GitHub Copilot Instructions for whop-mcp

These instructions guide GitHub Copilot (including Copilot for Pull Requests) when reviewing code or suggesting changes for this repository.

## 🧑‍💻 Code Review Policy

When reviewing Pull Requests, follow these strict guidelines:

1. **Focus on the big picture**: Only comment on critical bugs, security vulnerabilities, or major architectural flaws.
2. **No Nitpicking**: Do NOT leave comments about code formatting, minor style preferences, typo fixes (unless in public API signatures), or standard linting errors. We rely on standard ESLint / Prettier rules for this.
3. **Be Concise**: Keep reviews incredibly short. If the PR looks acceptable, simply approve it or give a 1-sentence summary of what's good. Do not explain the code step-by-step.
4. **Community-Led**: This is an unofficial, community SDK package for the Whop.com API. Prioritize robust error handling and API stability.
5. **No Hallucinations**: Do not reference Whop endpoints or SDK methods that do not exist or aren't defined in `src/types.ts`.

> **Note to Contributors:** If you still find Copilot's auto-reviews intrusive, Repository Admins can disable them entirely in the GitHub Repository Settings -> Integrations -> GitHub Apps -> configuration for GitHub Copilot.
