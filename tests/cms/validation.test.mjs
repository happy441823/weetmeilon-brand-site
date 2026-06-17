import test from "node:test";
import assert from "node:assert/strict";
import { assertSafeUrl, slugify } from "../../src/lib/cms/validation.ts";

test("slugify keeps Chinese and normalizes separators", () => {
  assert.equal(slugify(" 原生肌凝硅 2026 新品 "), "原生肌凝硅-2026-新品");
});

test("URL validator blocks dangerous protocols", () => {
  assert.throws(() => assertSafeUrl("javascript:alert(1)"));
  assert.throws(() => assertSafeUrl("java&#x73;cript:alert(1)"));
  assert.throws(() => assertSafeUrl("data:text/html,abc"));
  assert.throws(() => assertSafeUrl("//evil.example/path"));
  assert.equal(assertSafeUrl("/products/demo"), "/products/demo");
  assert.equal(assertSafeUrl("https://sweetmeilon.com"), "https://sweetmeilon.com");
});

test("scheduled publish rule requires published_at not in future for public reads", () => {
  const now = Date.parse("2026-06-17T00:00:00.000Z");
  const published = { status: "published", published_at: "2026-06-16T23:59:00.000Z" };
  const future = { status: "published", published_at: "2026-06-18T00:00:00.000Z" };
  const draft = { status: "draft", published_at: "2026-06-16T23:59:00.000Z" };
  const isPublic = (item) => item.status === "published" && Date.parse(item.published_at) <= now;
  assert.equal(isPublic(published), true);
  assert.equal(isPublic(future), false);
  assert.equal(isPublic(draft), false);
});
