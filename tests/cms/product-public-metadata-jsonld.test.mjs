import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getPublicCatalogProducts } from "../../src/lib/catalog.ts";
import {
  containsDynamicSalesCopy,
  containsHighRiskSeoTerm,
  publicProductSeoDescription
} from "../../src/lib/public-seo-copy.ts";

const dynamicTerms = ["价格", "库存", "优惠", "付款人数", "销量", "近365天付款", "实时价格", "天猫商品页实时价格"];
const nativeSkinTerms = ["原生肌凝硅", "凝硅", "Native Skin Silicone", "native-skin-silicone"];
const jsonLdForbiddenFields = ["offers", "price", "availability", "aggregateRating", "review", "salesCount"];

function hasAnyTerm(value, terms) {
  return terms.some((term) => String(value || "").includes(term));
}

function productPublicText(product) {
  return [
    product.displayName,
    product.shortDescription,
    product.fullDescription,
    product.heroLine,
    product.imageAlt,
    product.seoTitle,
    product.seoDescription,
    ...product.publicTags,
    ...product.highlights,
    ...product.publicSpecifications.flatMap((spec) => [spec.label, spec.value])
  ].join("\n");
}

test("product detail metadata descriptions use safe public templates", () => {
  const activeDescription = publicProductSeoDescription({
    displayName: "细腻纹理腿型造型款",
    status: "active"
  });
  const upcomingDescription = publicProductSeoDescription({
    displayName: "细腻纹理臀部造型款",
    status: "upcoming"
  });

  assert.equal(
    activeDescription,
    "了解细腻纹理腿型造型款的产品类型、材质体验、清洁收纳与隐私购买说明。具体规格、发货和售后信息请以蜜女郎官方旗舰店页面为准。"
  );
  assert.equal(
    upcomingDescription,
    "了解细腻纹理臀部造型款的新品预告、材质体验方向、清洁保养与隐私购买说明。正式商品信息以上架后的蜜女郎官方旗舰店页面为准。"
  );
  assert.equal(hasAnyTerm(activeDescription, dynamicTerms), false);
  assert.equal(hasAnyTerm(upcomingDescription, dynamicTerms), false);
});

test("product detail page metadata and JSON-LD do not trust stored seo_description directly", () => {
  const source = readFileSync("src/app/products/[slug]/page.tsx", "utf8");

  assert.match(source, /publicProductSeoDescription/);
  assert.match(source, /const description = publicProductSeoDescription/);
  assert.match(source, /const safeDescription = publicProductSeoDescription/);
  assert.equal(source.includes("description: product.seoDescription"), false);
  assert.equal(source.includes("description: safeDescription"), true);
  assert.equal(hasAnyTerm(source, dynamicTerms), false);
});

test("Product JSON-LD source does not output unstable commerce fields", () => {
  const source = readFileSync("src/app/products/[slug]/page.tsx", "utf8");
  assert.match(source, /"@type": "Product"/);

  for (const field of jsonLdForbiddenFields) {
    assert.equal(source.includes(field), false, field);
  }
});

test("coming soon products do not imply current purchase availability", () => {
  const upcoming = getPublicCatalogProducts().filter((product) => product.status === "upcoming");
  assert.ok(upcoming.length > 0);

  for (const product of upcoming) {
    assert.equal(product.channelLinks.tmall.enabled, false, product.slug);
    assert.equal(product.channelLinks.jd.enabled, false, product.slug);
    assert.equal(hasAnyTerm(publicProductSeoDescription({ displayName: product.displayName, status: product.status }), dynamicTerms), false, product.slug);
  }

  const source = readFileSync("src/app/products/[slug]/page.tsx", "utf8");
  assert.match(source, /本页面为新品预告，暂不展示购买按钮/);
  assert.match(source, /本页为新品预告页面，暂不展示购买按钮/);
});

test("tmall fallback products do not contain native skin silicone naming", () => {
  for (const product of getPublicCatalogProducts().filter((item) => item.id.startsWith("tmall-"))) {
    assert.equal(hasAnyTerm(productPublicText(product), nativeSkinTerms), false, product.id);
  }
});

test("fallback product copy does not contain old marketplace-style titles", () => {
  for (const product of getPublicCatalogProducts()) {
    const publicText = productPublicText(product);
    assert.equal(containsHighRiskSeoTerm(publicText), false, product.id);
    if (product.status !== "upcoming") {
      assert.equal(containsDynamicSalesCopy(publicText), false, product.id);
    }
  }
});
