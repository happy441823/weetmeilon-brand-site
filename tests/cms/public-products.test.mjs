import test from "node:test";
import assert from "node:assert/strict";
import { getPublicProductBySlugWithCmsFallback, getPublicProductsWithCmsFallback } from "../../src/lib/cms/public-products.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

function createPublicDb(rows, mediaRows = []) {
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
          if (/FROM product_images/.test(sql)) return { results: mediaRows };
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

test("public products map per-product media public urls instead of one placeholder", async () => {
  const previous = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  setCmsBindingsForTest({
    CMS_DB: createPublicDb(
      [
        { id: "p1", slug: "one", name: "One", status: "published", sort_order: 1 },
        { id: "p2", slug: "two", name: "Two", status: "published", sort_order: 2 }
      ],
      [
        { product_id: "p1", image_type: "cover", sort_order: 1, alt_text: "One cover", public_url: "https://media.example.com/p1.webp" },
        { product_id: "p2", image_type: "cover", sort_order: 1, alt_text: "Two cover", public_url: "https://media.example.com/p2.webp" }
      ]
    )
  });

  const products = await getPublicProductsWithCmsFallback();
  assert.equal(products[0].coverImage, "https://media.example.com/p1.webp");
  assert.equal(products[0].imageAlt, "One cover");
  assert.equal(products[1].coverImage, "https://media.example.com/p2.webp");

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = previous;
});

test("public products normalize legacy imported categories into the active taxonomy", async () => {
  const previous = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  setCmsBindingsForTest({
    CMS_DB: createPublicDb([
      {
        id: "legacy-half-body-silicone",
        slug: "half-body-silicone-1000",
        name: "半身倒模款",
        status: "published",
        primary_category_id: "half-body"
      },
      {
        id: "legacy-hip-tpe",
        slug: "hip-automatic-1001",
        name: "自动臀部倒模款",
        status: "published",
        primary_category_id: "hip-lower-body"
      }
    ])
  });

  const products = await getPublicProductsWithCmsFallback();
  assert.equal(products[0].primaryCategoryId, "silicone-mold");
  assert.equal(products[0].subcategoryId, "silicone-half-body");
  assert.equal(products[1].primaryCategoryId, "tpe-mold");
  assert.equal(products[1].subcategoryId, "tpe-hip-mold");

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
