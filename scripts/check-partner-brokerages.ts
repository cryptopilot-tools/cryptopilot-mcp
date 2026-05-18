import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProviderConfigsFromEnv } from "../src/config/index.js";
import { HttpError, requestJson } from "../src/providers/http.js";
import { createSnapTradeSignature } from "../src/providers/snaptrade-auth.js";

interface BrokerageType {
  name?: string;
}

interface Brokerage {
  slug?: string;
  name?: string;
  display_name?: string;
  brokerage_type?: BrokerageType;
}

interface PartnerInfoResponse {
  name?: string;
  slug?: string;
  allowed_brokerages?: Brokerage[];
}

const CRYPTO_EXCHANGES = new Map([
  ["coinbase", ["coinbase"]],
  ["kraken", ["kraken"]],
  ["gemini", ["gemini"]],
  ["binance.us", ["binanceus", "binance_us", "binance.us", "binance-us"]],
  ["crypto.com", ["cryptocom", "crypto_com", "crypto.com", "crypto-com"]],
  ["binance", ["binance"]],
  ["okx", ["okx"]],
  ["bybit", ["bybit"]],
  ["kucoin", ["kucoin", "ku_coin"]],
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function parseEnvFile(contents: string): Record<string, string> {
  const env: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value.replace(/\\n/g, "\n");
  }

  return env;
}

function normalizeSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/gu, "");
}

function getBrokerageSlug(brokerage: Brokerage): string {
  return brokerage.slug ?? "";
}

function getBrokerageName(brokerage: Brokerage): string {
  return brokerage.display_name ?? brokerage.name ?? brokerage.slug ?? "(unknown)";
}

function isTargetCryptoExchange(brokerage: Brokerage): boolean {
  const slug = normalizeSlug(getBrokerageSlug(brokerage));
  const name = normalizeSlug(getBrokerageName(brokerage));

  for (const aliases of CRYPTO_EXCHANGES.values()) {
    if (aliases.some((alias) => slug === normalizeSlug(alias) || name === normalizeSlug(alias))) {
      return true;
    }
  }

  return false;
}

function findExchange(brokerages: Brokerage[], label: string): Brokerage | undefined {
  const aliases = CRYPTO_EXCHANGES.get(label) ?? [label];

  return brokerages.find((brokerage) => {
    const slug = normalizeSlug(getBrokerageSlug(brokerage));
    const name = normalizeSlug(getBrokerageName(brokerage));
    return aliases.some((alias) => slug === normalizeSlug(alias) || name === normalizeSlug(alias));
  });
}

async function main(): Promise<void> {
  const env = {
    ...process.env,
    ...parseEnvFile(await readFile(path.join(projectRoot, ".env.local"), "utf8")),
  };
  const configs = loadProviderConfigsFromEnv(env);

  if (!configs.snaptrade) {
    throw new Error("SnapTrade is not configured in .env.local.");
  }

  const apiBaseUrl = configs.snaptrade.apiBaseUrl.endsWith("/")
    ? configs.snaptrade.apiBaseUrl
    : `${configs.snaptrade.apiBaseUrl}/`;
  const url = new URL("snapTrade/partners", apiBaseUrl);
  url.searchParams.set("clientId", configs.snaptrade.clientId);
  url.searchParams.set("timestamp", String(Math.floor(Date.now() / 1000)));

  const query = url.searchParams.toString();
  const signature = createSnapTradeSignature({
    consumerKey: configs.snaptrade.consumerKey,
    content: null,
    path: url.pathname,
    query,
  });

  try {
    const response = await requestJson<PartnerInfoResponse>(url, {
      headers: {
        Accept: "application/json",
        Signature: signature,
      },
      method: "GET",
    });
    const brokerages = [...(response.allowed_brokerages ?? [])].sort((left, right) =>
      getBrokerageSlug(left).localeCompare(getBrokerageSlug(right)),
    );
    const cryptoBrokerages = brokerages.filter((brokerage) => isTargetCryptoExchange(brokerage));
    const otherBrokerages = brokerages
      .filter((brokerage) => !isTargetCryptoExchange(brokerage))
      .map((brokerage) => getBrokerageSlug(brokerage) || getBrokerageName(brokerage))
      .sort();

    console.log(`Total allowed brokerages: ${brokerages.length}`);
    console.log("");
    console.log("| Slug | Name | Brokerage Type |");
    console.log("|------|------|----------------|");

    for (const brokerage of cryptoBrokerages) {
      console.log(
        `| ${getBrokerageSlug(brokerage) || "(none)"} | ${getBrokerageName(brokerage)} | ${
          brokerage.brokerage_type?.name ?? "N/A"
        } |`,
      );
    }

    console.log("");
    console.log(`Other brokerages: ${otherBrokerages.join(", ") || "(none)"}`);
    console.log("");
    console.log("Specific Phase 1 candidates:");

    for (const label of ["coinbase", "kraken", "gemini", "binance.us", "crypto.com"]) {
      const brokerage = findExchange(brokerages, label);
      console.log(`- ${label}: ${brokerage ? "yes" : "no"}`);
    }
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) {
      console.error("ALERTA: auth failed, verify .env.local");
      process.exitCode = 1;
      return;
    }

    console.error(error);
    process.exitCode = 1;
  }
}

await main();
