export interface CoinbaseRawAccount {
  uuid: string;
  name: string;
  currency: string;
  type?: string;
  active?: boolean;
  ready?: boolean;
  available_balance?: {
    value: string;
    currency: string;
  };
  hold?: {
    value: string;
    currency: string;
  };
  default?: boolean;
}

export interface CoinbaseRawHolding {
  account_uuid: string;
  asset: string;
  asset_name?: string;
  quantity: string;
  cost_basis?: {
    value: string;
    currency: string;
  };
  price?: {
    value: string;
    currency: string;
  };
  value?: {
    value: string;
    currency: string;
  };
}

export interface CoinbaseRawTransaction {
  uuid: string;
  account_uuid: string;
  type: string;
  status?: string;
  amount: {
    value: string;
    currency: string;
  };
  native_amount?: {
    value: string;
    currency: string;
  };
  subtotal?: {
    value: string;
    currency: string;
  };
  fee?: {
    value: string;
    currency: string;
  };
  description?: string;
  created_at: string;
  side?: string;
  product_id?: string;
}

export interface CoinbaseRawQuote {
  symbol: string;
  amount: string;
  currency: string;
  timestamp: string;
  changePercent24h?: number;
}

export interface SnapTradeRawAccount {
  id: string;
  name: string;
  number?: string;
  institutionName?: string;
  brokerageAuthorizationType?: string;
  raw_type?: string | null;
  account_category?: string | null;
  balance?: {
    total?: {
      amount: number;
      currency: string;
    };
    available?: {
      amount: number;
      currency: string;
    };
  };
  cash?: {
    amount: number;
    currency: string;
  };
}

export interface SnapTradeRawBalance {
  currency: { code?: string };
  cash: number;
  buying_power?: number;
}

export interface SnapTradeRawHolding {
  accountId: string;
  symbol: {
    symbol: string;
    description?: string;
    currency?: string | { code?: string };
    type?: string | { code?: string };
  };
  units: number;
  price?: number;
  marketValue?: number;
  averagePurchasePrice?: number;
}

export interface SnapTradeRawTransaction {
  id: string;
  accountId: string;
  type: string;
  status?: string;
  description?: string;
  symbol?: {
    symbol: string;
  };
  units?: number;
  price?: number;
  amount: number;
  currency: string;
  fee?: number;
  tradeDate: string;
  settlementDate?: string;
}

export interface SnapTradeRawQuote {
  symbol: string;
  lastTradePrice: number;
  currency: string;
  timestamp: string;
  dailyChange?: number;
  dailyChangePercent?: number;
}
