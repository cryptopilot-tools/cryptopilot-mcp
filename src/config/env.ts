import { z } from "zod";

const nonEmptyString = z.string().trim().min(1);

export const coinbaseProviderConfigSchema = z.object({
  apiKeyName: nonEmptyString,
  apiPrivateKey: nonEmptyString,
  apiBaseUrl: z.string().url().default("https://api.coinbase.com"),
});

export const snapTradeProviderConfigSchema = z.object({
  clientId: nonEmptyString,
  consumerKey: nonEmptyString,
  userId: nonEmptyString,
  userSecret: nonEmptyString,
  defaultAccountId: z.string().trim().optional(),
  apiBaseUrl: z.string().url().default("https://api.snaptrade.com/api/v1"),
});

export const appEnvSchema = z.object({
  COINBASE_API_KEY_NAME: z.string().trim().optional(),
  COINBASE_API_PRIVATE_KEY: z.string().trim().optional(),
  SNAPTRADE_CLIENT_ID: z.string().trim().optional(),
  SNAPTRADE_CONSUMER_KEY: z.string().trim().optional(),
  SNAPTRADE_USER_ID: z.string().trim().optional(),
  SNAPTRADE_USER_SECRET: z.string().trim().optional(),
  SNAPTRADE_DEFAULT_ACCOUNT_ID: z.string().trim().optional(),
});

export type CoinbaseProviderConfig = z.infer<typeof coinbaseProviderConfigSchema>;
export type SnapTradeProviderConfig = z.infer<typeof snapTradeProviderConfigSchema>;
export type AppEnv = z.infer<typeof appEnvSchema>;

export interface ProviderConfigs {
  coinbase?: CoinbaseProviderConfig;
  snaptrade?: SnapTradeProviderConfig;
}

export function loadProviderConfigsFromEnv(env: NodeJS.ProcessEnv = process.env): ProviderConfigs {
  const parsed = appEnvSchema.parse(env);
  const configs: ProviderConfigs = {};

  if (parsed.COINBASE_API_KEY_NAME && parsed.COINBASE_API_PRIVATE_KEY) {
    configs.coinbase = coinbaseProviderConfigSchema.parse({
      apiKeyName: parsed.COINBASE_API_KEY_NAME,
      apiPrivateKey: parsed.COINBASE_API_PRIVATE_KEY,
    });
  }

  if (
    parsed.SNAPTRADE_CLIENT_ID &&
    parsed.SNAPTRADE_CONSUMER_KEY &&
    parsed.SNAPTRADE_USER_ID &&
    parsed.SNAPTRADE_USER_SECRET
  ) {
    configs.snaptrade = snapTradeProviderConfigSchema.parse({
      clientId: parsed.SNAPTRADE_CLIENT_ID,
      consumerKey: parsed.SNAPTRADE_CONSUMER_KEY,
      userId: parsed.SNAPTRADE_USER_ID,
      userSecret: parsed.SNAPTRADE_USER_SECRET,
      defaultAccountId: parsed.SNAPTRADE_DEFAULT_ACCOUNT_ID,
    });
  }

  return configs;
}
