🌐 **English** | [Español](README.es.md)

# CryptoPilot MCP

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)

> A read-only MCP server that brings your crypto and brokerage portfolio into Claude Desktop.

CryptoPilot MCP connects Claude Desktop to your Coinbase and SnapTrade portfolio data through the Model Context Protocol (MCP). It gives developers and power users a local-first way to inspect accounts, holdings, prices, and provider health without building a custom integration from scratch. The server is read-only by design: it does not trade, transfer funds, or expose transaction actions.

<!-- TODO: add screenshot of Claude Desktop with cryptopilot loaded -->

## Features

- Two providers: Coinbase Advanced Trade and SnapTrade for brokerage aggregation.
- Five MCP tools: `list_providers`, `list_accounts`, `list_holdings`, `get_quote`, and `get_provider_health`.
- Read-only by design: no trading, no transfers, and no transactions tool.
- Type-safe TypeScript with Zod validation for MCP schemas and environment configuration.
- Automatic retry with backoff for `429` and `5xx` responses.
- Local-first: no telemetry, no external servers, and no cloud dependencies operated by this project.

## Quick Start

### Prerequisites

- Node.js 18+
- Claude Desktop: [download Claude](https://claude.ai/download)
- Coinbase account (optional) and/or SnapTrade account (optional)

### Install

```bash
git clone https://github.com/cryptopilot-tools/cryptopilot-mcp.git
cd cryptopilot-mcp
npm install
npm run build
```

Configure Claude Desktop as described below.

## Configuration

### Coinbase API Credentials

1. Go to [Coinbase API settings](https://www.coinbase.com/settings/api).
2. Create a new API key with **View** permissions only. Do not enable trading permissions.
3. Allow all accounts you want to analyze.
4. Save the API Key Name and Private Key.

### SnapTrade Credentials

1. Sign up at [SnapTrade](https://snaptrade.com/).
2. Create a client in the SnapTrade dashboard.
3. Save the Client ID and Consumer Key.
4. Create a user, then save the User ID and User Secret.

### Claude Desktop Config

Edit your Claude Desktop config at:

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

Add the `mcpServers` entry below. Replace every `REPLACE_ME` value and update the server path to the absolute path on your machine.

```json
{
  "mcpServers": {
    "cryptopilot": {
      "command": "node",
      "args": ["/absolute/path/to/cryptopilot-mcp/dist/server.js"],
      "env": {
        "COINBASE_API_KEY_NAME": "REPLACE_ME",
        "COINBASE_API_PRIVATE_KEY": "REPLACE_ME",
        "SNAPTRADE_CLIENT_ID": "REPLACE_ME",
        "SNAPTRADE_CONSUMER_KEY": "REPLACE_ME",
        "SNAPTRADE_USER_ID": "REPLACE_ME",
        "SNAPTRADE_USER_SECRET": "REPLACE_ME",
        "SNAPTRADE_DEFAULT_ACCOUNT_ID": "REPLACE_ME"
      }
    }
  }
}
```

Restart Claude Desktop after saving the file.

## Available Tools

### `list_providers`

Returns configured providers and their capabilities.

Example input:

```json
{}
```

Example output:

```json
{
  "providers": [
    {
      "id": "coinbase",
      "displayName": "Coinbase",
      "capabilities": {
        "accounts": true,
        "holdings": true,
        "transactions": false,
        "quotes": true
      }
    }
  ]
}
```

### `list_accounts`

Returns accounts, optionally filtered by provider.

Example input:

```json
{
  "provider": "snaptrade"
}
```

Example output:

```json
{
  "accounts": [
    {
      "id": "snaptrade:account-id",
      "provider": "snaptrade",
      "name": "Robinhood Individual",
      "type": "brokerage",
      "balance": {
        "amount": 1000,
        "currency": "USD"
      }
    }
  ]
}
```

### `list_holdings`

Returns holdings for a provider account. Requires `provider` and `accountId`.

Example input:

```json
{
  "provider": "coinbase",
  "accountId": "coinbase:account-id"
}
```

Example output:

```json
{
  "holdings": [
    {
      "symbol": "BTC",
      "quantity": 0.05,
      "price": {
        "amount": 80000,
        "currency": "USD"
      },
      "marketValue": {
        "amount": 4000,
        "currency": "USD"
      }
    }
  ]
}
```

### `get_quote`

Returns a current price for a symbol. Requires `provider` and `symbol`; SnapTrade quotes also require an `accountId` unless a default account is configured.

Example input:

```json
{
  "provider": "coinbase",
  "symbol": "BTC"
}
```

Example output:

```json
{
  "quote": {
    "symbol": "BTC-USD",
    "provider": "coinbase",
    "price": {
      "amount": 80000,
      "currency": "USD"
    },
    "asOf": "2026-01-01T00:00:00.000Z"
  }
}
```

### `get_provider_health`

Returns health and configuration status for each provider.

Example input:

```json
{}
```

Example output:

```json
{
  "health": [
    {
      "ok": true,
      "provider": "coinbase",
      "checkedAt": "2026-01-01T00:00:00.000Z",
      "details": {
        "transport": "http-fetch"
      }
    }
  ]
}
```

## Architecture

```text
Claude Desktop
    │ (MCP stdio)
    ↓
cryptopilot-mcp server
    │
    ↓
BaseProvider (abstract)
│            │
↓            ↓
CoinbaseProvider   SnapTradeProvider
│            │
↓            ↓
Coinbase API    SnapTrade API
```

The server runs over MCP stdio and exposes provider-neutral tools to Claude Desktop. Each provider implements the shared `BaseProvider` abstraction, then normalizers convert provider-specific responses into canonical account, holding, and quote types. Zod schemas validate MCP tool inputs and outputs at the server boundary.

## Security & Privacy

- Read-only API keys are strongly recommended. Do not enable trading permissions.
- `.env.local` is never committed and is covered by `.gitignore`.
- No telemetry, no analytics, and no external servers are operated by this project.
- Credentials are stored only on your local machine in Claude Desktop configuration or local environment files.
- See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Roadmap

- [x] Coinbase + SnapTrade providers
- [x] 5 core MCP tools
- [ ] Transactions tool
- [ ] More providers based on user demand (Alpaca, IBKR direct, etc.)
- [ ] CI/CD pipeline
- [ ] npm package publication
- [ ] Anthropic Directory submission

## Contributing

Contributions are welcome, especially provider integrations, reliability improvements, and documentation fixes. See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Disclaimer

> **Disclaimer:** CryptoPilot is an independent open-source project. It is not affiliated with, endorsed by, or sponsored by Anthropic, Coinbase, SnapTrade, or any brokerage. This software does not provide financial advice. Use at your own risk and consult a licensed financial advisor for investment decisions.

## License

MIT — see [LICENSE](LICENSE)
