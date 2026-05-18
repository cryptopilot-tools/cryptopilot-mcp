🌐 [English](README.md) | **Español**

# CryptoPilot MCP

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)

> Un server MCP read-only para llevar tu portafolio de crypto y brokerage a Claude Desktop.

CryptoPilot MCP conecta Claude Desktop con tus datos de Coinbase y SnapTrade usando el Model Context Protocol (MCP). Está pensado para developers y usuarios avanzados que quieren consultar cuentas, posiciones, precios y estado de providers sin construir una integración desde cero. El server es read-only por diseño: no opera, no transfiere fondos y no expone acciones de transacciones.

<!-- TODO: add screenshot of Claude Desktop with cryptopilot loaded -->

## Features

- Dos providers: Coinbase Advanced Trade y SnapTrade para agregación de brokerage.
- Cinco herramientas MCP: `list_providers`, `list_accounts`, `list_holdings`, `get_quote` y `get_provider_health`.
- Read-only por diseño: sin trading, sin transferencias y sin herramienta de transacciones.
- TypeScript con tipos estrictos y validación Zod para schemas MCP y configuración de entorno.
- Retry automático con backoff para respuestas `429` y `5xx`.
- Local-first: sin telemetry, sin servidores externos y sin dependencias cloud operadas por este proyecto.

## Inicio rápido

### Requisitos

- Node.js 18+
- Claude Desktop: [descargar Claude](https://claude.ai/download)
- Cuenta de Coinbase (opcional) y/o cuenta de SnapTrade (opcional)

### Instalación

```bash
git clone https://github.com/cryptopilot-tools/cryptopilot-mcp.git
cd cryptopilot-mcp
npm install
npm run build
```

Después configura Claude Desktop siguiendo la sección de Configuración.

## Configuración

### Credenciales API de Coinbase

1. Ve a [Coinbase API settings](https://www.coinbase.com/settings/api).
2. Crea una nueva API key con permisos **View** solamente. No actives permisos de trading.
3. Permite todas las cuentas que quieras analizar.
4. Guarda el API Key Name y la Private Key.

### Credenciales de SnapTrade

1. Regístrate en [SnapTrade](https://snaptrade.com/).
2. Crea un client en el dashboard de SnapTrade.
3. Guarda el Client ID y el Consumer Key.
4. Crea un user, y guarda el User ID y el User Secret.

### Configuración de Claude Desktop

Edita el archivo de configuración de Claude Desktop en:

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

Agrega la entrada `mcpServers` de abajo. Reemplaza cada valor `REPLACE_ME` y actualiza el path del server con el path absoluto en tu máquina.

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

Reinicia Claude Desktop después de guardar el archivo.

## Herramientas disponibles

### `list_providers`

Devuelve los providers configurados y sus capacidades.

Input de ejemplo:

```json
{}
```

Output de ejemplo:

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

Devuelve cuentas, con filtro opcional por provider.

Input de ejemplo:

```json
{
  "provider": "snaptrade"
}
```

Output de ejemplo:

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

Devuelve posiciones de una cuenta. Requiere `provider` y `accountId`.

Input de ejemplo:

```json
{
  "provider": "coinbase",
  "accountId": "coinbase:account-id"
}
```

Output de ejemplo:

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

Devuelve el precio actual de un símbolo. Requiere `provider` y `symbol`; en SnapTrade también requiere `accountId` si no hay una cuenta por defecto configurada.

Input de ejemplo:

```json
{
  "provider": "coinbase",
  "symbol": "BTC"
}
```

Output de ejemplo:

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

Devuelve estado de salud y configuración de cada provider.

Input de ejemplo:

```json
{}
```

Output de ejemplo:

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

## Arquitectura

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

El server corre sobre MCP stdio y expone herramientas neutrales a Claude Desktop. Cada provider implementa la abstracción compartida `BaseProvider`, y los normalizers convierten respuestas específicas de cada API en tipos canónicos de cuenta, posición y quote. Los schemas de Zod validan inputs y outputs en el borde del server MCP.

## Seguridad y privacidad

- Se recomiendan API keys read-only. No actives permisos de trading.
- `.env.local` nunca se commitea y está cubierto por `.gitignore`.
- Este proyecto no opera telemetry, analytics ni servidores externos.
- Las credenciales quedan solo en tu máquina local, dentro de la configuración de Claude Desktop o archivos de entorno locales.
- Consulta [SECURITY.md](SECURITY.md) para reportar vulnerabilidades.

## Hoja de ruta

- [x] Providers Coinbase + SnapTrade
- [x] 5 herramientas MCP principales
- [ ] Herramienta de transacciones
- [ ] Más providers según demanda de usuarios (Alpaca, IBKR directo, etc.)
- [ ] Pipeline CI/CD
- [ ] Publicación como paquete npm
- [ ] Envío al Anthropic Directory

## Cómo contribuir

Las contribuciones son bienvenidas, especialmente integraciones de providers, mejoras de confiabilidad y correcciones de documentación. Revisa [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir un pull request.

## Aviso legal

> **Aviso legal:** CryptoPilot es un proyecto open-source independiente. No está afiliado, respaldado ni patrocinado por Anthropic, Coinbase, SnapTrade ni ninguna brokerage. Este software no ofrece asesoría financiera. Úsalo bajo tu propio riesgo y consulta a un asesor financiero licenciado antes de tomar decisiones de inversión.

## Licencia

MIT — consulta [LICENSE](LICENSE)
