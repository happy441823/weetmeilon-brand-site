import test from "node:test";
import assert from "node:assert/strict";

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function assertSafeUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(javascript|data):/i.test(url)) throw new Error("unsafe protocol");
  if (url.startsWith("/") || /^https?:\/\//i.test(url)) return url;
  throw new Error("invalid url");
}

test("slugify keeps Chinese and normalizes separators", () => {
  assert.equal(slugify(" 原生肌凝硅 2026 新品 "), "原生肌凝硅-2026-新品");
});

test("URL validator blocks dangerous protocols", () => {
  assert.throws(() => assertSafeUrl("javascript:alert(1)"));
  assert.throws(() => assertSafeUrl("data:text/html,abc"));
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

