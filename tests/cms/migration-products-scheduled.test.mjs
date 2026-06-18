import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

test("products scheduled status migration rebuilds products with scheduled constraint", () => {
  const sql = readFileSync(join(repoRoot, "migrations", "0002_products_scheduled_status.sql"), "utf8");
  assert.match(sql, /CREATE TABLE IF NOT EXISTS products_new/);
  assert.match(sql, /status TEXT NOT NULL DEFAULT 'draft' CHECK \(status IN \('draft','pending_review','scheduled','coming_soon','published','offline','archived'\)\)/);
  assert.match(sql, /INSERT INTO products_new/);
  assert.match(sql, /FROM products/);
  assert.match(sql, /ALTER TABLE products_new RENAME TO products/);
});

test("products scheduled status migration preserves core product indexes", () => {
  const sql = readFileSync(join(repoRoot, "migrations", "0002_products_scheduled_status.sql"), "utf8");
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_products_status_publish ON products\(status, published_at, scheduled_at\)/);
  assert.match(sql, /CREATE INDEX IF NOT EXISTS idx_products_category ON products\(primary_category_id, subcategory_id\)/);
});
