# Security Policy

## Supported Versions

CryptoPilot MCP is pre-1.0. Only the latest `main` branch is supported.

## Reporting a Vulnerability

Please report security issues by email:

- Email: team@cryptopilot.tools
- Subject line: `[SECURITY] brief description`

Include:

- Reproduction steps
- Affected version or commit SHA
- Potential impact assessment

We aim to acknowledge reports within 7 days and provide a fix or timeline within 30 days.

## Scope

### In Scope

- Authentication or authorization bugs
- Credential leaks in code, logs, or git history
- MCP protocol implementation issues
- Direct dependency vulnerabilities
- Remote code execution paths

### Out of Scope

- Third-party API vulnerabilities in Coinbase, SnapTrade, or other providers
- User local machine security, including OS, antivirus, or device compromise
- Brokerage account security at the institution

## Disclosure Policy

- Responsible disclosure is preferred.
- Public disclosure should happen only after a fix is released.
- Credit is given to the reporter unless they prefer anonymity.
- There is no bug bounty program at this time.

## Security Best Practices for Users

- Use read-only API keys with no trading permissions.
- Never commit `.env.local` or expose it in screenshots.
- Rotate API keys periodically. Every 90 days is suggested.
- Review `claude_desktop_config.json` before sharing your machine.
- Keep Node.js and dependencies updated.
