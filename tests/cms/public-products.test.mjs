import test from "node:test";
import assert from "node:assert/strict";
import { getPublicProductBySlugWithCmsFallback, getPublicProductsWithCmsFallback } from "../../src/lib/cms/public-products.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

function createPublicDb(rows) {
  return {
    prepare(sql) {
      return {
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async all() {
          if (/FROM "products"/.test(sql)) return { results: rows };
          return { results: [] };
        }
      };
    }
  };
}

test("public products read from D1 and map coming soon without purchase buttons", async () => {
  const previous = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  setCmsBindingsForTest({
    CMS_DB: createPublicDb([
      {
        id: "p1",
        slug: "published-product",
        name: "Published",
        status: "published",
        primary_category_id: "cat",
        tmall_enabled: 1,
        tmall_url: "https://example.com/tmall",
        jd_enabled: 1,
        jd_url: "https://example.com/jd",
        buy_button_enabled: 1,
        links_verified: 1
      },
      {
        id: "p2",
        slug: "coming-soon-product",
        name: "Coming Soon",
        status: "coming_soon",
        primary_category_id: "cat",
        tmall_enabled: 1,
        tmall_url: "https://example.com/tmall",
        jd_enabled: 1,
        jd_url: "https://example.com/jd",
        buy_button_enabled: 1,
        links_verified: 1
      }
    ])
  });

  const products = await getPublicProductsWithCmsFallback();
  assert.equal(products.length, 2);
  assert.equal(products[0].status, "active");
  assert.equal(products[0].channelLinks.tmall.enabled, true);
  assert.equal(products[1].status, "upcoming");
  assert.equal(products[1].channelLinks.tmall.enabled, false);
  assert.equal(products[1].channelLinks.jd.enabled, false);

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = previous;
});

test("public products do not fall back to static content when D1 returns an empty set", async () => {
  const previous = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  setCmsBindingsForTest({ CMS_DB: createPublicDb([]) });

  assert.deepEqual(await getPublicProductsWithCmsFallback(), []);
  assert.equal(await getPublicProductBySlugWithCmsFallback("privacy-starter-kit"), null);

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = previous;
});
