import type { CoinbaseProviderConfig } from "../config/index.js";
import {
  normalizeCoinbaseAccount,
  normalizeCoinbaseHolding,
  normalizeCoinbaseQuote,
} from "../normalizers/index.js";
import type {
  CanonicalAccount,
  CanonicalHolding,
  CanonicalQuote,
  SyncResult,
} from "../types/index.js";
import type {
  CoinbaseRawAccount,
  CoinbaseRawHolding,
  CoinbaseRawQuote,
} from "../types/provider-raw.js";
import { createCoinbaseBearerToken } from "./coinbase-auth.js";
import { BaseProvider, type ProviderContext, type ProviderHealth } from "./base-provider.js";
import { HttpError, requestJson } from "./http.js";

interface CoinbaseAccountsResponse {
  accounts?: CoinbaseRawAccount[];
  has_next?: boolean;
  cursor?: string;
}

interface CoinbaseProductResponse {
  product_id: string;
  price?: string;
  price_percentage_change_24h?: string;
}

export interface CoinbaseProviderLoaders {
  getAccounts?: (context?: ProviderContext) => Promise<{
    items: CoinbaseRawAccount[];
    nextCursor?: string;
    raw: unknown;
  }>;
  getHoldings?: (accountId: string, context?: ProviderContext) => Promise<CoinbaseRawHolding[]>;
  getQuote?: (symbol: string, context?: ProviderContext) => Promise<CoinbaseRawQuote>;
}

function parseNumericString(value?: string): number {
  return Number(value ?? "0");
}

const USD_STABLECOINS = new Set([
  "USD",
  "USDC",
  "USDT",
  "DAI",
  "USDP",
  "TUSD",
  "BUSD",
  "GUSD",
  "PYUSD",
  "USDD",
  "FRAX",
  "LUSD",
]);

function parsePercent(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }

  return Number(value.replace(/%$/u, ""));
}

function createCoinbaseLoaders(
  config: CoinbaseProviderConfig,
): Required<CoinbaseProviderLoaders> {
  const buildUrl = (path: string, query?: Record<string, string | undefined>): URL => {
    const url = new URL(path, config.apiBaseUrl);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value) {
        url.searchParams.set(key, value);
      }
    }

    return url;
  };

  const request = async <T>(
    method: string,
    path: string,
    query?: Record<string, string | undefined>,
  ): Promise<T> => {
    const url = buildUrl(path, query);
    const jwt = createCoinbaseBearerToken(config, method, url.host, url.pathname + url.search);

    return requestJson<T>(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
      },
      method,
    });
  };

  const fetchAllAccounts = async (): Promise<CoinbaseAccountsResponse> => {
    const accounts: CoinbaseRawAccount[] = [];
    let cursor: string | undefined;
    let hasNext = false;

    do {
      const response = await request<CoinbaseAccountsResponse>(
        "GET",
        "/api/v3/brokerage/accounts",
        cursor ? { cursor } : undefined,
      );
      accounts.push(...(response.accounts ?? []));
      cursor = response.cursor;
      hasNext = Boolean(response.has_next && cursor);
    } while (hasNext);

    return {
      accounts,
      cursor,
      has_next: hasNext,
    };
  };

  return {
    async getAccounts() {
      const response = await fetchAllAccounts();
      return {
        items: response.accounts ?? [],
        nextCursor: response.cursor,
        raw: response,
      };
    },
    async getHoldings(accountId) {
      const response = await fetchAllAccounts();
      const accounts = (response.accounts ?? []).filter((item) => item.uuid === accountId);

      if (accounts.length === 0) {
        return [];
      }

      const holdings = accounts
        .map((account) => ({
          account,
          quantity: parseNumericString(account.available_balance?.value),
        }))
        .filter(({ quantity }) => quantity > 0);

      return Promise.all(
        holdings.map(async ({ account, quantity }) => {
          const asset = account.currency.toUpperCase();
          let price: number | undefined;

          if (USD_STABLECOINS.has(asset)) {
            price = 1;
          } else {
            try {
              const product = await request<CoinbaseProductResponse>(
                "GET",
                `/api/v3/brokerage/products/${asset}-USD`,
              );
              const parsedPrice = Number(product.price);
              price = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : undefined;
            } catch (error) {
              if (!(error instanceof HttpError && error.status === 404)) {
                throw error;
              }
            }
          }

          return {
            account_uuid: account.uuid,
            asset,
            asset_name: account.name,
            quantity: account.available_balance?.value ?? "0",
            price:
              price !== undefined
                ? {
                    value: String(price),
                    currency: "USD",
                  }
                : undefined,
            value:
              price !== undefined
                ? {
                    value: String(quantity * price),
                    currency: "USD",
                  }
                : undefined,
          };
        }),
      );
    },
    async getQuote(symbol) {
      const normalizedSymbol = symbol.includes("-") ? symbol.toUpperCase() : `${symbol}-USD`;
      const response = await request<CoinbaseProductResponse>(
        "GET",
        `/api/v3/brokerage/products/${normalizedSymbol}`,
      );

      return {
        symbol: response.product_id,
        amount: response.price ?? "0",
        currency: response.product_id.split("-")[1] ?? "USD",
        timestamp: new Date().toISOString(),
        changePercent24h: parsePercent(response.price_percentage_change_24h),
      };
    },
  };
}

export class CoinbaseProvider extends BaseProvider {
  readonly config: CoinbaseProviderConfig;
  readonly loaders: Required<CoinbaseProviderLoaders>;

  constructor(config: CoinbaseProviderConfig, loaders?: CoinbaseProviderLoaders) {
    super({
      id: "coinbase",
      displayName: "Coinbase",
      capabilities: {
        accounts: true,
        holdings: true,
        transactions: false,
        quotes: true,
      },
    });

    this.config = config;
    this.loaders = loaders ? { ...createCoinbaseLoaders(config), ...loaders } : createCoinbaseLoaders(config);
  }

  async getHealth(): Promise<ProviderHealth> {
    return {
      ok: true,
      provider: this.id,
      checkedAt: new Date().toISOString(),
      details: {
        apiBaseUrl: this.config.apiBaseUrl,
        auth: "jwt-es256",
        configured: true,
        transactionsSupport: "not_enabled",
        transport: "http-fetch",
      },
    };
  }

  protected async fetchAccounts(context?: ProviderContext): Promise<SyncResult<CanonicalAccount>> {
    const raw = await this.loaders.getAccounts(context);
    return {
      items: raw.items.map((item) => normalizeCoinbaseAccount(item)),
      nextCursor: raw.nextCursor,
      raw: raw.raw,
    };
  }

  protected async fetchHoldings(
    accountId: string,
    context?: ProviderContext,
  ): Promise<SyncResult<CanonicalHolding>> {
    const providerAccountId = this.unwrapAccountId(accountId);
    const raw = await this.loaders.getHoldings(providerAccountId, context);
    return {
      items: raw.map((item) => normalizeCoinbaseHolding(item)),
      raw,
    };
  }

  protected async fetchQuote(symbol: string, context?: ProviderContext): Promise<CanonicalQuote> {
    const raw = await this.loaders.getQuote(symbol, context);
    return normalizeCoinbaseQuote(raw);
  }

  private unwrapAccountId(accountId: string): string {
    return accountId.startsWith("coinbase:") ? accountId.slice("coinbase:".length) : accountId;
  }
}
