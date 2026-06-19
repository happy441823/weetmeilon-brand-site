import test from "node:test";
import assert from "node:assert/strict";
import { catalogCategories } from "../../src/lib/catalog.ts";
import { pickHomeBrowseCategories } from "../../src/lib/home-categories.ts";

test("homepage browse section only exposes primary product category entries", () => {
  const categories = pickHomeBrowseCategories(catalogCategories);

  assert.ok(categories.length > 0);
  assert.deepEqual(
    categories.map((category) => category.level),
    categories.map(() => "primary")
  );
  assert.equal(categories.some((category) => category.slug === "tpe-local-mold"), false);
  assert.equal(categories.some((category) => category.slug === "silicone-local-mold"), false);
  assert.equal(categories.some((category) => category.level === "legacy"), false);
});
