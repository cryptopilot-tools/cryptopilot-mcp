import { HttpError, requestJson } from "../src/providers/http.js";

const originalFetch = globalThis.fetch;
let attempts = 0;

globalThis.fetch = async () => {
  attempts += 1;

  return new Response("rate limited", {
    headers: {
      "Retry-After": "0",
    },
    status: 429,
  });
};

try {
  await requestJson("https://api.coinbase.com/api/v3/brokerage/products/BTC-USD");
  throw new Error("Expected requestJson to throw HttpError for repeated Coinbase 429 responses.");
} catch (error) {
  if (!(error instanceof HttpError)) {
    throw error;
  }

  if (error.status !== 429) {
    throw new Error(`Expected final status 429, got ${error.status}.`);
  }

  if (attempts !== 4) {
    throw new Error(`Expected 4 attempts (initial request plus 3 retries), got ${attempts}.`);
  }

  console.log("HTTP retry smoke passed: Coinbase 429 retried 3 times before HttpError.");
} finally {
  globalThis.fetch = originalFetch;
}
