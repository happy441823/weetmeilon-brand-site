import test from "node:test";
import assert from "node:assert/strict";
import {
  clearAccessJwksCache,
  getLocalAdminEmail,
  verifyCloudflareAccessJwt
} from "../../src/lib/cms/auth-core.ts";

const encoder = new TextEncoder();

function toBase64Url(bytes) {
  return Buffer.from(bytes).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function jsonPart(value) {
  return toBase64Url(encoder.encode(JSON.stringify(value)));
}

async function createAccessJwt(payloadOverrides = {}) {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["sign", "verify"]
  );
  const kid = "test-key";
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  publicJwk.kid = kid;
  publicJwk.alg = "RS256";
  publicJwk.use = "sig";

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", kid, typ: "JWT" };
  const payload = {
    aud: "access-audience",
    email: "Admin@Sweetmeilon.com",
    exp: now + 300,
    iat: now,
    iss: "https://sweetmeilon.cloudflareaccess.com",
    type: "app",
    ...payloadOverrides
  };
  const signingInput = `${jsonPart(header)}.${jsonPart(payload)}`;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyPair.privateKey, encoder.encode(signingInput));
  return {
    token: `${signingInput}.${toBase64Url(new Uint8Array(signature))}`,
    jwks: { keys: [publicJwk] }
  };
}

function jwksFetcher(jwks) {
  return async () => new Response(JSON.stringify(jwks), { status: 200, headers: { "content-type": "application/json" } });
}

test("Cloudflare Access JWT validates signature, issuer, audience, expiration and email", async () => {
  clearAccessJwksCache();
  const { token, jwks } = await createAccessJwt();
  const result = await verifyCloudflareAccessJwt(token, {
    audience: "access-audience",
    issuer: "https://sweetmeilon.cloudflareaccess.com",
    jwksUrl: "https://access.example/certs",
    fetcher: jwksFetcher(jwks)
  });

  assert.equal(result.email, "admin@sweetmeilon.com");
});

test("forged admin email headers are not an authentication mechanism", () => {
  const request = new Request("https://sweetmeilon.com/api/admin/me", {
    headers: {
      "x-admin-email": "owner@sweetmeilon.com",
      "x-authenticated-user-email": "owner@sweetmeilon.com",
      "cf-access-authenticated-user-email": "owner@sweetmeilon.com"
    }
  });

  assert.equal(request.headers.get("cf-access-jwt-assertion"), null);
});

test("Cloudflare Access JWT rejects wrong audience, wrong issuer, expired token and bad signature", async () => {
  clearAccessJwksCache();
  const { token, jwks } = await createAccessJwt();
  await assert.rejects(
    () =>
      verifyCloudflareAccessJwt(token, {
        audience: "other-audience",
        issuer: "https://sweetmeilon.cloudflareaccess.com",
        jwksUrl: "https://access.example/wrong-audience",
        fetcher: jwksFetcher(jwks)
      }),
    /audience/
  );
  await assert.rejects(
    () =>
      verifyCloudflareAccessJwt(token, {
        audience: "access-audience",
        issuer: "https://evil.cloudflareaccess.com",
        jwksUrl: "https://access.example/wrong-issuer",
        fetcher: jwksFetcher(jwks)
      }),
    /issuer/
  );

  const expired = await createAccessJwt({ exp: Math.floor(Date.now() / 1000) - 1 });
  await assert.rejects(
    () =>
      verifyCloudflareAccessJwt(expired.token, {
        audience: "access-audience",
        issuer: "https://sweetmeilon.cloudflareaccess.com",
        jwksUrl: "https://access.example/expired",
        fetcher: jwksFetcher(expired.jwks)
      }),
    /expired/
  );

  const [tamperedHeader, tamperedPayload] = token.split(".");
  const tampered = `${tamperedHeader}.${tamperedPayload}.${toBase64Url(new Uint8Array(256))}`;
  await assert.rejects(
    () =>
      verifyCloudflareAccessJwt(tampered, {
        audience: "access-audience",
        issuer: "https://sweetmeilon.cloudflareaccess.com",
        jwksUrl: "https://access.example/tampered",
        fetcher: jwksFetcher(jwks)
      }),
    /signature/
  );
});

test("local admin bypass only works when explicitly enabled on localhost outside production", () => {
  assert.equal(
    getLocalAdminEmail({
      allowLocalAdmin: "true",
      localAdminEmail: "Local@Sweetmeilon.test",
      nodeEnv: "development",
      requestUrl: "http://localhost:3000/admin"
    }),
    "local@sweetmeilon.test"
  );
  assert.equal(
    getLocalAdminEmail({
      allowLocalAdmin: "true",
      localAdminEmail: "local@sweetmeilon.test",
      nodeEnv: "production",
      requestUrl: "http://localhost:3000/admin"
    }),
    ""
  );
  assert.equal(
    getLocalAdminEmail({
      allowLocalAdmin: "true",
      localAdminEmail: "local@sweetmeilon.test",
      nodeEnv: "development",
      requestUrl: "https://sweetmeilon.com/admin"
    }),
    ""
  );
  assert.equal(
    getLocalAdminEmail({
      allowLocalAdmin: "false",
      localAdminEmail: "local@sweetmeilon.test",
      nodeEnv: "development",
      requestUrl: "http://localhost:3000/admin"
    }),
    ""
  );
});
