import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { catalogCategories, catalogSeries, getPublicCatalogProducts } from "../../src/lib/catalog.ts";

test("product filter taxonomy uses the approved primary category labels", () => {
  const primary = catalogCategories.filter((category) => category.visible && category.level === "primary");

  assert.deepEqual(
    primary.map((category) => category.name),
    ["阴臀倒模", "实体娃娃", "飞机杯"]
  );
});

test("product filter taxonomy uses the approved subcategory labels", () => {
  const visibleSubcategories = catalogCategories.filter((category) => category.visible && category.level === "secondary");

  assert.deepEqual(
    visibleSubcategories.map((category) => category.name),
    [
      "TPE臀部倒模",
      "TPE半身倒模",
      "TPE腿部倒模",
      "TPE自慰名器",
      "硅胶臀部倒模",
      "硅胶半身倒模",
      "硅胶自慰名器",
      "TPE实体娃娃",
      "硅胶实体娃娃",
      "自慰飞机杯"
    ]
  );

  assert.equal(visibleSubcategories.filter((category) => category.name === "硅胶臀部倒模").length, 1);
});

test("product filter taxonomy uses the approved series labels", () => {
  const visibleSeries = catalogSeries.filter((series) => series.visible);

  assert.deepEqual(
    visibleSeries.map((series) => series.name),
    ["臀部倒模系列", "半身娃娃系列", "硅胶倒模系列", "实体娃娃系列", "飞机杯系列"]
  );
});

test("public fallback products map old material categories into the approved filter taxonomy", () => {
  const products = getPublicCatalogProducts();
  const visiblePrimaryIds = new Set(catalogCategories.filter((category) => category.visible && category.level === "primary").map((category) => category.id));
  const visibleSubcategoryIds = new Set(catalogCategories.filter((category) => category.visible && category.level === "secondary").map((category) => category.id));
  const visibleSeriesIds = new Set(catalogSeries.filter((series) => series.visible).map((series) => series.id));

  for (const product of products) {
    assert.equal(visiblePrimaryIds.has(product.primaryCategoryId), true, product.slug);
    if (product.subcategoryId) {
      assert.equal(visibleSubcategoryIds.has(product.subcategoryId), true, product.slug);
    }
    if (product.seriesId) {
      assert.equal(visibleSeriesIds.has(product.seriesId), true, product.slug);
    }
  }
});

test("category pages keep visible empty categories accessible and avoid duplicated brand title", () => {
  const source = readFileSync("src/app/products/category/[slug]/page.tsx", "utf8");

  assert.match(source, /title:\s*\{\s*absolute:\s*category\.seoTitle\s*\}/);
  assert.doesNotMatch(source, /if \(products\.length === 0\)\s*\{\s*notFound\(\)/);
  assert.match(source, /当前分类暂无已上架商品/);
  assert.doesNotMatch(source, /优惠、库存/);
});
