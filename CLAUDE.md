# CLAUDE.md

Context file for AI coding agents working on this repository. Read this 
first when starting a session.

---

## Project

**CryptoPilot MCP** — A read-only Model Context Protocol (MCP) server that 
exposes crypto and brokerage portfolio data to Claude Desktop and other 
MCP-compatible clients.

**Project boundary:** CryptoPilot is a completely independent project. 
Agents working in this repository must not reference, compare, or assume 
any relationship with other projects (including stockpilot-mcp). Each 
project has its own scope, codebase, and decisions.

---

## Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js 18+
- **MCP SDK:** `@modelcontextprotocol/sdk` v1.29+
- **Transport:** stdio
- **Validation:** Zod
- **Auth methods:** JWT ES256 (Coinbase), HMAC SHA256 (SnapTrade)
- **Package manager:** npm

---

## Architecture

Claude Desktop communicates with the MCP server over stdio. The server 
uses an abstract `BaseProvider` class, with concrete implementations for 
Coinbase (direct Advanced Trade API) and SnapTrade (which aggregates 
Robinhood and 30+ other brokerages).

Each provider has its own normalizer that maps raw API responses to 
canonical types (`CanonicalAccount`, `CanonicalHolding`).

**Key design decisions:**
- `costBasis` (total invested) and `averagePurchasePrice` (per unit) are 
  separate fields in `CanonicalHolding` to handle high-priced stocks 
  like BRK.A correctly.
- HTTP retry with exponential backoff (1s, 2s, 4s) for 429/5xx responses.
- Coinbase `balance.amount` is always 0 in their API; actual balance is 
  `available + hold`.

---

## MCP Tools (5)

- `list_providers` — returns configured providers and capabilities
- `list_accounts` — returns accounts (optional `provider` filter)
- `list_holdings` — returns holdings for an account (requires `accountId`)
- `get_quote` — returns current price (requires `provider` + `symbol`)
- `get_provider_health` — health check for each configured provider

**Out of scope (Phase 1):** transactions, trading, withdrawals. This is 
read-only by design.

---

## File Structure

- `src/server.ts` — MCP server entry point
- `src/providers/` — BaseProvider abstract + Coinbase + SnapTrade implementations
- `src/normalizers/` — Provider-specific response normalizers
- `src/types/` — Canonical types and provider-raw types
- `src/config/` — Zod schemas + env loading
- `scripts/` — Smoke tests and helpers
- `examples/` — Bilingual sample queries
- `.github/` — Issue and PR templates

A local-only file `.local-context.md` may exist in the working directory 
for personal context. It is gitignored and not visible in the repository. 
If present, agents may read it for additional local context; if absent, 
proceed without it.

---

## Agent Behavior

### Final report

At the end of every task or instruction, the agent **must** produce a final 
report summarizing:

- What was done (actions taken, files modified, commands run)
- What was found (relevant discoveries or diagnostics)
- What is pending (next steps or blockers, if any)

The report must be concise, written in plain language, and delivered before 
the session ends or the task is considered complete.

---

## Critical Rules

### Git workflow

- **Never** `git push --force` to `main`. Use `--force-with-lease` only if 
  explicitly approved.
- **Never** rewrite history that has already been pushed.
- Commit author/committer must be: `cryptopilot <team@cryptopilot.tools>`
- Some IDE integrations may inject `Co-authored-by:` trailers. Verify 
  commits are clean.
- Branch `main` has protection enabled. Direct pushes from the owner 
  bypass with a warning, which is expected.

### Security

- **Never** commit `.env.local`, API keys, tokens, or credentials. The 
  `.gitignore` covers `.env*` with an exception for `.env.example`.
- **Never** print real credential values in logs or output. Print variable 
  names only.
- API keys should be **read-only** in their issuing platform. The MCP 
  server has no trading code paths.
- **Never** commit or expose GitHub SSH keys (private or public) in any 
  file tracked by this repository.
- **Never** include personal information (real names, surnames, or email 
  addresses of contributors) in source code, commits, comments, or 
  documentation. Use role-based identities only (e.g. `team@cryptopilot.tools`).
- The GitHub account `dennys2280-boop` is **not** associated with this 
  repository. Do not reference it in commits, PRs, or any project artifact. 
  If an AI agent or tool injects it as a co-author, remove it before committing.
- For vulnerability reports, see [SECURITY.md](SECURITY.md).

### Code style

- TypeScript strict mode is enforced.
- Prefer `async/await` over `.then()`.
- Avoid `any` unless documented inline with rationale.
- Imports: external first, then internal, then types.
- No `console.log` in production code paths.

### Provider extension

When adding a new provider:
1. Extend `BaseProvider` abstract class
2. Implement: `fetchAccounts`, `fetchHoldings`, `fetchQuote`, `healthCheck`
3. Create a normalizer in `src/normalizers/`
4. Register in `src/providers/provider-registry.ts`
5. Add env vars to `src/config/env.ts` schema
6. Add smoke test coverage in `scripts/smoke.ts`

---

## Development Workflow

Setup:

    npm install
    cp .env.example .env.local
    # Edit .env.local with your real credentials
    npm run build

Smoke tests:

    npx tsx scripts/smoke.ts

---

## Phase Plans

Phase plans, when present, are tracked under `docs/phases/`. Agents 
working on a specific phase should read the relevant file before 
starting work.

---

## Independent project disclaimer

CryptoPilot is an independent open-source project. It is not affiliated 
with, endorsed by, or sponsored by Anthropic, Coinbase, SnapTrade, or any 
brokerage. This software does not provide financial advice.

---

## License

MIT — see [LICENSE](LICENSE).
