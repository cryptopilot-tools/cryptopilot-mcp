import type {
  CanonicalAccount,
  CanonicalHolding,
  CanonicalQuote,
  CanonicalTransaction,
  TransactionType,
} from "../types/index.js";
import type {
  CoinbaseRawAccount,
  CoinbaseRawHolding,
  CoinbaseRawQuote,
  CoinbaseRawTransaction,
} from "../types/provider-raw.js";

function normalizeMoney(amount: string, currency: string) {
  return {
    amount: Number(amount),
    currency: currency.trim().toUpperCase(),
  };
}

function normalizeCoinbaseBalance(raw: CoinbaseRawAccount) {
  if (!raw.available_balance) {
    return raw.hold ? normalizeMoney(raw.hold.value, raw.hold.currency) : undefined;
  }

  const available = Number(raw.available_balance.value);
  const hold = Number(raw.hold?.value ?? "0");

  return {
    amount: available + hold,
    currency: raw.available_balance.currency.trim().toUpperCase(),
  };
}

function mapCoinbaseAccountType(value?: string): CanonicalAccount["type"] {
  switch (value?.toLowerCase()) {
    case "wallet":
      return "crypto_wallet";
    case "fiat":
      return "checking";
    default:
      return "exchange";
  }
}

function mapCoinbaseTransactionType(value: string): TransactionType {
  switch (value.toLowerCase()) {
    case "buy":
      return "buy";
    case "sell":
      return "sell";
    case "send":
      return "withdrawal";
    case "receive":
      return "deposit";
    default:
      return "other";
  }
}

export function normalizeCoinbaseAccount(raw: CoinbaseRawAccount): CanonicalAccount {
  return {
    id: `coinbase:${raw.uuid}`,
    provider: "coinbase",
    providerAccountId: raw.uuid,
    name: raw.name,
    type: mapCoinbaseAccountType(raw.type),
    currency: raw.currency.trim().toUpperCase(),
    balance: normalizeCoinbaseBalance(raw),
    availableBalance: raw.available_balance
      ? normalizeMoney(raw.available_balance.value, raw.available_balance.currency)
      : undefined,
    metadata: {
      active: raw.active ?? false,
      default: raw.default ?? false,
      hold: raw.hold ? normalizeMoney(raw.hold.value, raw.hold.currency) : undefined,
      rawType: raw.type,
      ready: raw.ready ?? false,
    },
  };
}

export function normalizeCoinbaseHolding(raw: CoinbaseRawHolding): CanonicalHolding {
  return {
    id: `coinbase:${raw.account_uuid}:${raw.asset}`,
    provider: "coinbase",
    accountId: `coinbase:${raw.account_uuid}`,
    symbol: raw.asset.toUpperCase(),
    name: raw.asset_name,
    assetClass: "crypto",
    quantity: Number(raw.quantity),
    currency: raw.price?.currency?.toUpperCase() ?? "USD",
    price: raw.price ? normalizeMoney(raw.price.value, raw.price.currency) : undefined,
    marketValue: raw.value ? normalizeMoney(raw.value.value, raw.value.currency) : undefined,
    costBasis: raw.cost_basis
      ? normalizeMoney(raw.cost_basis.value, raw.cost_basis.currency)
      : undefined,
  };
}

export function normalizeCoinbaseTransaction(
  raw: CoinbaseRawTransaction,
): CanonicalTransaction {
  const amount = raw.native_amount ?? raw.amount;
  const inferredSymbol = raw.product_id?.split("-")[0]?.toUpperCase() ?? raw.amount.currency.toUpperCase();

  return {
    id: `coinbase:${raw.uuid}`,
    provider: "coinbase",
    accountId: `coinbase:${raw.account_uuid}`,
    type: mapCoinbaseTransactionType(raw.side ?? raw.type),
    status: raw.status as CanonicalTransaction["status"],
    symbol: inferredSymbol,
    description: raw.description ?? raw.product_id ?? raw.type,
    price: raw.subtotal ? normalizeMoney(raw.subtotal.value, raw.subtotal.currency) : undefined,
    amount: normalizeMoney(amount.value, amount.currency),
    fee: raw.fee ? normalizeMoney(raw.fee.value, raw.fee.currency) : undefined,
    occurredAt: new Date(raw.created_at).toISOString(),
    metadata: {
      productId: raw.product_id,
      rawType: raw.type,
      side: raw.side,
    },
  };
}

export function normalizeCoinbaseQuote(raw: CoinbaseRawQuote): CanonicalQuote {
  return {
    symbol: raw.symbol.toUpperCase(),
    provider: "coinbase",
    price: normalizeMoney(raw.amount, raw.currency),
    asOf: new Date(raw.timestamp).toISOString(),
    changePercent24h: raw.changePercent24h,
  };
}
