PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS products_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  slug TEXT NOT NULL UNIQUE,
  subtitle TEXT,
  primary_category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  series_id TEXT REFERENCES product_series(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','scheduled','coming_soon','published','offline','archived')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  visible_home INTEGER NOT NULL DEFAULT 0,
  visible_catalog INTEGER NOT NULL DEFAULT 1,
  tmall_url TEXT,
  jd_url TEXT,
  tmall_enabled INTEGER NOT NULL DEFAULT 0,
  jd_enabled INTEGER NOT NULL DEFAULT 0,
  links_verified INTEGER NOT NULL DEFAULT 0,
  buy_button_enabled INTEGER NOT NULL DEFAULT 1,
  summary TEXT,
  body_html TEXT,
  highlights_json TEXT NOT NULL DEFAULT '[]',
  concerns_json TEXT NOT NULL DEFAULT '[]',
  material_notes TEXT,
  specifications_json TEXT NOT NULL DEFAULT '[]',
  package_list TEXT,
  care_notes TEXT,
  storage_notes TEXT,
  privacy_notes TEXT,
  usage_tips TEXT,
  compliance_notes TEXT,
  cover_media_id TEXT,
  hero_media_id TEXT,
  gallery_json TEXT NOT NULL DEFAULT '[]',
  image_alt TEXT,
  seo_title TEXT,
  seo_description TEXT,
  canonical_url TEXT,
  og_media_id TEXT,
  indexable INTEGER NOT NULL DEFAULT 1,
  published_at TEXT,
  scheduled_at TEXT,
  published_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  reviewed_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO products_new (
  id, name, short_name, slug, subtitle, primary_category_id, subcategory_id, series_id,
  status, sort_order, featured, visible_home, visible_catalog, tmall_url, jd_url,
  tmall_enabled, jd_enabled, links_verified, buy_button_enabled, summary, body_html,
  highlights_json, concerns_json, material_notes, specifications_json, package_list,
  care_notes, storage_notes, privacy_notes, usage_tips, compliance_notes,
  cover_media_id, hero_media_id, gallery_json, image_alt, seo_title, seo_description,
  canonical_url, og_media_id, indexable, published_at, scheduled_at, published_by,
  reviewed_by, created_at, updated_at
)
SELECT
  id, name, short_name, slug, subtitle, primary_category_id, subcategory_id, series_id,
  status, sort_order, featured, visible_home, visible_catalog, tmall_url, jd_url,
  tmall_enabled, jd_enabled, links_verified, buy_button_enabled, summary, body_html,
  highlights_json, concerns_json, material_notes, specifications_json, package_list,
  care_notes, storage_notes, privacy_notes, usage_tips, compliance_notes,
  cover_media_id, hero_media_id, gallery_json, image_alt, seo_title, seo_description,
  canonical_url, og_media_id, indexable, published_at, scheduled_at, published_by,
  reviewed_by, created_at, updated_at
FROM products;

DROP TABLE products;
ALTER TABLE products_new RENAME TO products;

CREATE INDEX IF NOT EXISTS idx_products_status_publish ON products(status, published_at, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(primary_category_id, subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_series ON products(series_id);
CREATE INDEX IF NOT EXISTS idx_products_sort ON products(sort_order);

PRAGMA foreign_keys = ON;
