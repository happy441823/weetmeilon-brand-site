import test from "node:test";
import assert from "node:assert/strict";
import {
  publicD1Enabled,
  publicVisibilityWhere,
  readPublicCmsRows
} from "../../src/lib/cms/public-content.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

test("public D1 reads are feature flagged", () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  const oldProducts = process.env.CMS_PUBLIC_PRODUCTS_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "false";
  delete process.env.CMS_PUBLIC_PRODUCTS_D1_READS;
  assert.equal(publicD1Enabled(), false);
  assert.equal(publicD1Enabled("products"), false);
  process.env.CMS_PUBLIC_PRODUCTS_D1_READS = "true";
  assert.equal(publicD1Enabled(), false);
  assert.equal(publicD1Enabled("products"), true);
  assert.equal(publicD1Enabled("navigation_items"), false);
  delete process.env.CMS_PUBLIC_PRODUCTS_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  assert.equal(publicD1Enabled(), true);
  process.env.CMS_PUBLIC_D1_READS = old;
  process.env.CMS_PUBLIC_PRODUCTS_D1_READS = oldProducts;
});

test("public product D1 reads can be enabled without enabling global public D1 reads", async () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  const oldProducts = process.env.CMS_PUBLIC_PRODUCTS_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "false";
  process.env.CMS_PUBLIC_PRODUCTS_D1_READS = "true";
  setCmsBindingsForTest({
    CMS_DB: {
      prepare(sql) {
        return {
          bind() {
            return this;
          },
          async all() {
            if (/FROM "products"/.test(sql)) return { results: [{ slug: "d1-product", status: "published" }], success: true, meta: {} };
            return { results: [], success: true, meta: {} };
          }
        };
      }
    }
  });

  const products = await readPublicCmsRows("products");
  const nav = await readPublicCmsRows("navigation_items");
  assert.equal(products.source, "d1");
  assert.equal(products.rows[0].slug, "d1-product");
  assert.deepEqual(nav, { rows: [], dbReady: false, source: "fallback", fallbackReason: "feature_disabled" });

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = old;
  process.env.CMS_PUBLIC_PRODUCTS_D1_READS = oldProducts;
});

test("public visibility where clause excludes drafts, pending review, offline, archived and future scheduled content", () => {
  const articleWhere = publicVisibilityWhere("articles");
  assert.match(articleWhere, /status IN \('published'\)/);
  assert.match(articleWhere, /published_at IS NULL OR published_at <= \?/);
  assert.match(articleWhere, /scheduled_at IS NULL OR scheduled_at <= \?/);
  assert.doesNotMatch(articleWhere, /draft|pending_review|offline|archived/);

  const productWhere = publicVisibilityWhere("products");
  assert.match(productWhere, /'published'/);
  assert.match(productWhere, /'coming_soon'/);
});

test("public D1 read returns fallback safely when disabled, unbound, or query fails", async () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "false";
  assert.deepEqual(await readPublicCmsRows("articles"), { rows: [], dbReady: false, source: "fallback", fallbackReason: "feature_disabled" });

  process.env.CMS_PUBLIC_D1_READS = "true";
  setCmsBindingsForTest(null);
  assert.deepEqual(await readPublicCmsRows("articles"), { rows: [], dbReady: false, source: "fallback", fallbackReason: "unbound" });

  setCmsBindingsForTest({
    CMS_DB: {
      prepare() {
        throw new Error("raw database error");
      }
    }
  });
  assert.deepEqual(await readPublicCmsRows("articles"), { rows: [], dbReady: false, source: "fallback", fallbackReason: "query_error" });
  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = old;
});

test("public D1 read binds current time and returns rows", async () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  const calls = [];
  setCmsBindingsForTest({
    CMS_DB: {
      prepare(sql) {
        calls.push({ sql, values: [] });
        return {
          bind(...values) {
            calls.at(-1).values = values;
            return this;
          },
          async all() {
            return { results: [{ slug: "published", status: "published" }], success: true, meta: {} };
          }
        };
      }
    }
  });

  const result = await readPublicCmsRows("articles", { now: new Date("2026-06-17T00:00:00.000Z") });
  assert.equal(result.source, "d1");
  assert.equal(result.rows[0].slug, "published");
  assert.match(calls[0].sql, /FROM "articles"/);
  assert.deepEqual(calls[0].values, ["2026-06-17T00:00:00.000Z", "2026-06-17T00:00:00.000Z"]);

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = old;
});

test("public D1 reads use sort_order for ordered resources", async () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  const calls = [];
  setCmsBindingsForTest({
    CMS_DB: {
      prepare(sql) {
        calls.push(sql);
        return {
          bind() {
            return this;
          },
          async all() {
            return { results: [], success: true, meta: {} };
          }
        };
      }
    }
  });

  await readPublicCmsRows("products");
  await readPublicCmsRows("navigation_items");
  assert.match(calls[0], /ORDER BY sort_order ASC, updated_at DESC/);
  assert.match(calls[1], /ORDER BY sort_order ASC, updated_at DESC/);

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = old;
});
