import test from "node:test";
import assert from "node:assert/strict";
import { buildProductSeedSql } from "../../scripts/cms-seed-from-static.mjs";

test("cms seed SQL is idempotent and updates existing products", () => {
  const sql = buildProductSeedSql([
    {
      id: "p1",
      name: "Product",
      short_name: "P",
      slug: "product",
      subtitle: "",
      status: "pending_review",
      summary: "Summary",
      tmall_url: null,
      jd_url: null,
      tmall_enabled: 0,
      jd_enabled: 0,
      links_verified: 0,
      buy_button_enabled: 1,
      image_alt: "Product",
      created_at: "2026-06-17T00:00:00.000Z",
      updated_at: "2026-06-17T00:00:00.000Z"
    }
  ]);

  assert.match(sql, /INSERT INTO products/);
  assert.match(sql, /ON CONFLICT\(id\) DO UPDATE/);
  assert.match(sql, /buy_button_enabled = excluded\.buy_button_enabled/);
});

test("cms seed SQL safely escapes product text", () => {
  const sql = buildProductSeedSql([
    {
      id: "p2",
      name: "O'Connor",
      short_name: "O",
      slug: "o-connor",
      subtitle: "",
      status: "coming_soon",
      summary: "Safe",
      tmall_url: null,
      jd_url: null,
      tmall_enabled: 0,
      jd_enabled: 0,
      links_verified: 0,
      buy_button_enabled: 0,
      image_alt: "O'Connor",
      created_at: "2026-06-17T00:00:00.000Z",
      updated_at: "2026-06-17T00:00:00.000Z"
    }
  ]);

  assert.match(sql, /O''Connor/);
  assert.match(sql, /'coming_soon'/);
  assert.match(sql, /, 0,/);
});
