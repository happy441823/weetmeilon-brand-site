import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { articles } from "../../src/lib/articles.ts";
import { catalogCategories, getPublicCatalogProducts } from "../../src/lib/catalog.ts";
import {
  containsDynamicSalesCopy,
  containsHighRiskSeoTerm,
  publicProductSeoDescription,
  publicProductSeoTitle
} from "../../src/lib/public-seo-copy.ts";

const forbiddenProductJsonLdFields = [
  '"offers"',
  '"price"',
  '"availability"',
  '"aggregateRating"',
  '"review"',
  '"inventory"',
  '"salesCount"'
];

test("public product SEO does not contain high-risk marketplace terms", () => {
  for (const product of getPublicCatalogProducts()) {
    assert.equal(containsHighRiskSeoTerm(product.seoTitle), false, `${product.slug} seoTitle`);
    assert.equal(containsHighRiskSeoTerm(product.seoDescription), false, `${product.slug} seoDescription`);
    assert.match(product.seoTitle, /蜜女郎官方渠道说明$/);
  }

  assert.equal(
    containsHighRiskSeoTerm(publicProductSeoTitle({ name: "飞机杯熟女倒模膜真人1比1大屁股男用可插入", status: "active", seriesName: "TPE系列" })),
    false
  );
  assert.equal(
    containsHighRiskSeoTerm(publicProductSeoDescription({ name: "成人男士性用品重口味", status: "active", seriesName: "硅胶系列" })),
    false
  );
});

test("public products remove dynamic sales, payment, price and inventory copy", () => {
  for (const product of getPublicCatalogProducts()) {
    const publicText = [
      product.displayName,
      product.shortDescription,
      product.fullDescription,
      product.heroLine,
      product.seoTitle,
      product.seoDescription,
      ...product.publicTags,
      ...product.highlights,
      ...product.publicSpecifications.flatMap((spec) => [spec.label, spec.value])
    ].join("\n");
    assert.equal(containsDynamicSalesCopy(publicText), false, product.slug);
  }
});

test("coming soon products expose preview status and no purchase links", () => {
  const upcoming = getPublicCatalogProducts().filter((product) => product.status === "upcoming");
  assert.ok(upcoming.length > 0);
  for (const product of upcoming) {
    assert.equal(product.channelLinks.tmall.enabled, false, product.slug);
    assert.equal(product.channelLinks.jd.enabled, false, product.slug);
    assert.deepEqual(product.publicSpecifications, [
      { label: "商品状态", value: "新品预告" },
      { label: "购买状态", value: "暂未开放官网购买入口" },
      { label: "信息说明", value: "正式商品信息以上架后的官方旗舰店页面为准" }
    ]);
  }
});

test("category SEO title uses one brand suffix and historical categories stay out of sitemap set", () => {
  for (const category of catalogCategories) {
    assert.match(category.seoTitle, new RegExp(`^${category.name}｜产品类型与官方渠道说明｜蜜女郎$`));
    assert.equal(/蜜女郎.*蜜女郎/.test(category.seoTitle), false, category.slug);
  }

  const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");
  assert.match(sitemapSource, /category\.visible && category\.level !== "legacy"/);
});

test("FAQ page has at least 12 fallback questions and emits FAQPage JSON-LD", () => {
  const source = readFileSync("src/app/faq/page.tsx", "utf8");
  const questionCount = (source.match(/\["[^"]+[?？]",/g) || []).length;
  assert.ok(questionCount >= 12, `FAQ fallback count: ${questionCount}`);
  assert.match(source, /"@type": "FAQPage"|FAQPage/);
  assert.match(source, /application\/ld\+json/);
});

test("age gate keeps 18+ confirmation and opts out of snippets", () => {
  const source = readFileSync("src/components/AgeGate.tsx", "utf8");
  assert.match(source, /18\+ 年龄确认/);
  assert.match(source, /data-nosnippet/);
});

test("Product JSON-LD does not output unstable commerce fields", () => {
  const source = readFileSync("src/app/products/[slug]/page.tsx", "utf8");
  assert.match(source, /"@type": "Product"/);
  for (const field of forbiddenProductJsonLdFields) {
    assert.equal(source.includes(field), false, field);
  }
});

test("draft articles have review-ready body sections and are not published", () => {
  const drafts = articles.filter((article) => article.status === "draft");
  assert.ok(drafts.length >= 6);
  for (const article of drafts) {
    assert.equal(article.indexable, false, article.slug);
    assert.ok(article.sections.length >= 3, article.slug);
    assert.ok(article.sections.some((section) => /常见问题/.test(section.heading)), article.slug);
  }
});
