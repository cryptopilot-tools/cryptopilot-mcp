# Contributing

Welcome, and thank you for considering a contribution to CryptoPilot MCP. The project is early, so focused bug reports, provider improvements, and documentation fixes are especially helpful.

## Code of Conduct

We follow the Contributor Covenant. Code of Conduct file to be added in a future release.

## Local Setup

```bash
git clone https://github.com/cryptopilot-tools/cryptopilot-mcp.git
cd cryptopilot-mcp
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run build
```

## Running Smoke Tests

Smoke tests require real credentials in `.env.local`.

- `npx tsx scripts/smoke.ts` — full E2E test through the MCP server.
- `npx tsx scripts/quote-stress.ts` — repeated quote calls and provider health checks.
- `npx tsx scripts/http-retry-smoke.ts` — retry logic for HTTP `429` responses.

## Adding a New Provider

- Extend the `BaseProvider` abstract class in `src/providers/base-provider.ts`.
- Implement provider methods such as `fetchAccounts`, `fetchHoldings`, `fetchQuote`, and `getHealth`.
- Create a normalizer in `src/normalizers/`.
- Register the provider in `src/providers/provider-registry.ts`.
- Add environment variables to the `src/config/env.ts` schema.
- Add smoke test cases in `scripts/smoke.ts`.

## PR Process

- Fork the repo.
- Create a branch from main: `git checkout -b feat/your-feature`.
- Commit with conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, or `chore:`.
- Open a PR with a clear description and linked issues.
- Wait for review. Target response time is 7 days.

## Coding Standards

- TypeScript strict mode.
- Avoid `any` unless documented why.
- Prefer `async/await` over `.then()`.
- Imports organized: external first, then internal, then types.
- No `console.log` in production code. Use proper logging if needed.
