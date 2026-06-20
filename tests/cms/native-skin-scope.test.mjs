import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { catalogProducts, getPublicCatalogProducts } from "../../src/lib/catalog.ts";
import { tmallLiveProducts } from "../../src/data/catalog/tmall-live-products.ts";

const whitelist = new Set(["native-skin-silicone-soft", "texture-detail-series", "privacy-starter-kit"]);
const nativeSkinTerms = [/原生肌凝硅/, /凝硅/, /Native Skin Silicone/, /native-skin-silicone/];

function productScopeText(product) {
  return [
    product.id,
    product.name,
    product.displayName,
    product.shortName,
    product.subtitle,
    product.summary,
    product.shortDescription,
    product.fullDescription,
    product.heroLine,
    product.imageAlt,
    product.seriesId,
    product.seoTitle,
    product.seoDescription,
    ...(product.tags || []),
    ...(product.publicTags || []),
    ...(product.highlights || []),
    ...((product.specifications || product.publicSpecifications || []).flatMap((item) => [item.label, item.value]))
  ]
    .filter(Boolean)
    .join("\n");
}

function assertNoNativeSkinTerms(product, fieldName, value) {
  for (const term of nativeSkinTerms) {
    assert.equal(term.test(String(value || "")), false, `${product.id} ${fieldName} contains ${term}`);
  }
}

test("non-whitelist catalog product names do not use native skin naming", () => {
  for (const product of catalogProducts.filter((item) => !whitelist.has(item.id))) {
    assertNoNativeSkinTerms(product, "name", product.name || product.displayName);
    assertNoNativeSkinTerms(product, "shortName", product.shortName);
    assertNoNativeSkinTerms(product, "subtitle", product.subtitle);
  }
});

test("non-whitelist public product body and SEO do not use native skin naming", () => {
  for (const product of getPublicCatalogProducts().filter((item) => !whitelist.has(item.id))) {
    assertNoNativeSkinTerms(product, "summary/body", [product.shortDescription, product.fullDescription, product.heroLine].join("\n"));
    assertNoNativeSkinTerms(product, "seo", [product.seoTitle, product.seoDescription].join("\n"));
    assertNoNativeSkinTerms(product, "imageAlt", product.imageAlt);
  }
});

test("non-whitelist products are not assigned to native-skin-silicone series", () => {
  for (const product of [...catalogProducts, ...tmallLiveProducts].filter((item) => !whitelist.has(item.id))) {
    assert.notEqual(product.seriesId, "native-skin-silicone", product.id);
    assertNoNativeSkinTerms(product, "combined product text", productScopeText(product));
  }
});

test("whitelist products may use native skin naming and must remain coming soon without purchase buttons", () => {
  const products = getPublicCatalogProducts().filter((item) => whitelist.has(item.id));
  assert.equal(products.length, whitelist.size);

  for (const product of products) {
    assert.equal(product.status, "upcoming", product.id);
    assert.equal(product.channelLinks.tmall.enabled, false, product.id);
    assert.equal(product.channelLinks.jd.enabled, false, product.id);
    assert.equal(Boolean(product.channelLinks.tmall.url), false, product.id);
    assert.equal(Boolean(product.channelLinks.jd.url), false, product.id);
  }
});

test("product center native skin statement is scoped to the three whitelist previews", () => {
  const source = readFileSync("src/app/products/page.tsx", "utf8");
  assert.match(source, /原生肌凝硅三款目前为新品预告/);

  const products = getPublicCatalogProducts();
  const nativeSkinProducts = products.filter((product) => /原生肌凝硅|native-skin-silicone/.test(productScopeText(product)));
  assert.ok(nativeSkinProducts.length > 0);
  assert.equal(products.filter((product) => whitelist.has(product.id) && product.status === "upcoming").length, 3);
  assert.equal(nativeSkinProducts.every((product) => whitelist.has(product.id)), true);
});
