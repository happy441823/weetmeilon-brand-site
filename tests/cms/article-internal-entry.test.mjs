import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const articlesSource = readFileSync("src/lib/articles.ts", "utf8");
const homePageSource = readFileSync("src/app/page.tsx", "utf8");
const articlesPageSource = readFileSync("src/app/articles/page.tsx", "utf8");
const productPageSource = readFileSync("src/app/products/[slug]/page.tsx", "utf8");

test("homepage exposes prioritized article entry points", () => {
  assert.match(homePageSource, /pickHomepageArticles\(homeArticles,\s*5\)/);
  assert.match(homePageSource, /articleGuideGroups/);
  assert.match(homePageSource, /Guide Hub/);
  assert.match(homePageSource, /href="\/articles"/);
  assert.match(articlesPageSource, /sortArticlesForDisplay/);
  assert.match(articlesPageSource, /groupArticlesForGuideHub/);
  assert.match(articlesSource, /articleDisplayPrioritySlugs/);
  assert.match(articlesSource, /articleGuideGroups/);
  assert.match(articlesSource, /key:\s*"material"/);
  assert.match(articlesSource, /key:\s*"care"/);
  assert.match(articlesSource, /key:\s*"privacy"/);
  assert.match(articlesSource, /"official-site-to-tmall"/);
  assert.match(articlesSource, /"beginner-buying-questions"/);
});

test("product detail pages render contextual article entry points", () => {
  assert.match(productPageSource, /getPublishedArticles/);
  assert.match(productPageSource, /getProductRelatedArticles/);
  assert.match(productPageSource, /slice\(0,\s*4\)/);
  assert.match(productPageSource, /lg:grid-cols-4/);
  assert.match(productPageSource, /Related Guides/);
  assert.match(productPageSource, /official-site-to-tmall/);
  assert.match(productPageSource, /beginner-buying-questions/);
  assert.match(productPageSource, /product-info-before-buying/);
  assert.match(productPageSource, /material-photo-checklist/);
  assert.match(productPageSource, /cleaning-and-storage-guide/);
  assert.match(productPageSource, /privacy-shipping-guide/);
  assert.match(productPageSource, /tpe-vs-silicone-material-guide/);
  assert.match(productPageSource, /mold-products-care-guide/);
  assert.match(productPageSource, /how-to-choose-cup-products/);
  assert.match(productPageSource, /weekly-care-routine/);
  assert.doesNotMatch(productPageSource, /native-skin-silicone-meaning/);
});

test("round-two article fallback entries are publishable when D1 is unavailable", () => {
  for (const slug of [
    "official-site-to-tmall",
    "material-photo-checklist",
    "beginner-buying-questions",
    "product-info-before-buying",
    "weekly-care-routine"
  ]) {
    const block = articlesSource.slice(articlesSource.indexOf(`slug: "${slug}"`), articlesSource.indexOf("  },", articlesSource.indexOf(`slug: "${slug}"`)));
    assert.match(block, /status:\s*"published"/, `${slug} should be published in fallback data`);
    assert.match(block, /indexable:\s*true/, `${slug} should be indexable in fallback data`);
  }
});
