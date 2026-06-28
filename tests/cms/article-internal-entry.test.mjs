import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homePageSource = readFileSync("src/app/page.tsx", "utf8");
const productPageSource = readFileSync("src/app/products/[slug]/page.tsx", "utf8");

test("homepage exposes the five round-one guide articles", () => {
  assert.match(homePageSource, /homeArticles\.slice\(0,\s*5\)/);
  assert.match(homePageSource, /href="\/articles"/);
});

test("product detail pages render contextual article entry points", () => {
  assert.match(productPageSource, /getPublishedArticles/);
  assert.match(productPageSource, /getProductRelatedArticles/);
  assert.match(productPageSource, /Related Guides/);
  assert.match(productPageSource, /cleaning-and-storage-guide/);
  assert.match(productPageSource, /privacy-shipping-guide/);
  assert.match(productPageSource, /tpe-vs-silicone-material-guide/);
  assert.match(productPageSource, /mold-products-care-guide/);
  assert.match(productPageSource, /how-to-choose-cup-products/);
});
