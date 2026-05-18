import { createPrivateKey, randomBytes, sign } from "node:crypto";
import type { CoinbaseProviderConfig } from "../config/index.js";

function base64UrlEncode(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function normalizePrivateKey(privateKey: string): string {
  return privateKey.replace(/\\n/g, "\n");
}

export function createCoinbaseBearerToken(
  config: CoinbaseProviderConfig,
  method: string,
  requestHost: string,
  requestPath: string,
): string {
  const header = {
    alg: "ES256",
    kid: config.apiKeyName,
    nonce: randomBytes(16).toString("hex"),
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: ["cdp_service"],
    exp: now + 120,
    iss: "cdp",
    nbf: now,
    sub: config.apiKeyName,
    uri: `${method.toUpperCase()} ${requestHost}${requestPath}`,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedClaims = base64UrlEncode(JSON.stringify(claims));
  const payload = `${encodedHeader}.${encodedClaims}`;
  const privateKey = createPrivateKey(normalizePrivateKey(config.apiPrivateKey));
  const signature = sign("sha256", Buffer.from(payload), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });

  return `${payload}.${base64UrlEncode(signature)}`;
}
