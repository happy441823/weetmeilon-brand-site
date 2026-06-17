import type { CmsRole } from "./schema";

export type AccessJwtPayload = {
  aud?: string | string[];
  email?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  nbf?: number;
  type?: string;
};

export type AccessJwtVerificationOptions = {
  audience: string;
  issuer: string;
  jwksUrl?: string;
  now?: number;
  fetcher?: typeof fetch;
};

export type LocalAdminOptions = {
  allowLocalAdmin?: string;
  localAdminEmail?: string;
  nodeEnv?: string;
  requestUrl: string;
};

const roleOrder: CmsRole[] = ["viewer", "editor", "reviewer", "super_admin"];
const textDecoder = new TextDecoder();
type AccessJwk = JsonWebKey & { kid?: string };

const jwksCache = new Map<string, { expiresAt: number; keys: AccessJwk[] }>();

function base64UrlToBytes(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJsonPart<T>(part: string): T {
  return JSON.parse(textDecoder.decode(base64UrlToBytes(part))) as T;
}

function timingSafeEqual(a: string, b: string) {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) {
    return false;
  }

  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}

function hasAudience(payload: AccessJwtPayload, expectedAudience: string) {
  const values = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  return values.some((value) => typeof value === "string" && timingSafeEqual(value, expectedAudience));
}

async function getJwks(url: string, fetcher: typeof fetch, now: number) {
  const cached = jwksCache.get(url);
  if (cached && cached.expiresAt > now) {
    return cached.keys;
  }

  const response = await fetcher(url, {
    headers: { accept: "application/json" }
  });
  if (!response.ok) {
    throw new Error("Cloudflare Access JWKS unavailable");
  }

  const body = (await response.json()) as { keys?: AccessJwk[] };
  if (!Array.isArray(body.keys) || body.keys.length === 0) {
    throw new Error("Cloudflare Access JWKS empty");
  }

  jwksCache.set(url, { expiresAt: now + 300_000, keys: body.keys });
  return body.keys;
}

export function clearAccessJwksCache() {
  jwksCache.clear();
}

export function getLocalAdminEmail(options: LocalAdminOptions) {
  if (options.allowLocalAdmin !== "true") {
    return "";
  }
  if (options.nodeEnv === "production") {
    return "";
  }

  let hostname = "";
  try {
    hostname = new URL(options.requestUrl).hostname;
  } catch {
    return "";
  }

  if (!["localhost", "127.0.0.1", "::1"].includes(hostname)) {
    return "";
  }

  return (options.localAdminEmail || "local-admin@sweetmeilon.test").trim().toLowerCase();
}

export async function verifyCloudflareAccessJwt(token: string, options: AccessJwtVerificationOptions) {
  if (!token) {
    throw new Error("Missing Cloudflare Access JWT");
  }
  if (!options.audience) {
    throw new Error("Missing Cloudflare Access audience");
  }
  if (!options.issuer) {
    throw new Error("Missing Cloudflare Access issuer");
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid Cloudflare Access JWT format");
  }

  const header = decodeJsonPart<{ alg?: string; kid?: string; typ?: string }>(parts[0]);
  const payload = decodeJsonPart<AccessJwtPayload>(parts[1]);
  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Unsupported Cloudflare Access JWT");
  }

  const now = options.now ?? Date.now();
  const nowSeconds = Math.floor(now / 1000);
  if (payload.exp === undefined || payload.exp <= nowSeconds) {
    throw new Error("Cloudflare Access JWT expired");
  }
  if (payload.nbf !== undefined && payload.nbf > nowSeconds) {
    throw new Error("Cloudflare Access JWT not active");
  }
  if (payload.iss !== options.issuer) {
    throw new Error("Invalid Cloudflare Access issuer");
  }
  if (!hasAudience(payload, options.audience)) {
    throw new Error("Invalid Cloudflare Access audience");
  }
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    throw new Error("Cloudflare Access JWT email missing");
  }

  const jwksUrl = options.jwksUrl || `${options.issuer.replace(/\/$/, "")}/cdn-cgi/access/certs`;
  const keys = await getJwks(jwksUrl, options.fetcher || fetch, now);
  const key = keys.find((candidate) => candidate.kid === header.kid);
  if (!key) {
    throw new Error("Cloudflare Access signing key not found");
  }

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    key,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    base64UrlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
  );
  if (!valid) {
    throw new Error("Invalid Cloudflare Access JWT signature");
  }

  return {
    email: payload.email.trim().toLowerCase(),
    payload
  };
}

export function highestCmsRole(roles: CmsRole[]) {
  return roles.slice().sort((a, b) => roleOrder.indexOf(b) - roleOrder.indexOf(a))[0] || "viewer";
}
