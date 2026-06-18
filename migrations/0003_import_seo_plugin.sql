PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('tmall','jd','unknown')),
  source_url TEXT NOT NULL,
  source_product_id TEXT,
  source_shop_name TEXT,
  title_detected TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_fetch','fetched','needs_review','imported','failed','cancelled')),
  requested_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  authorized INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  raw_metadata_json TEXT NOT NULL DEFAULT '{}',
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS imported_product_sources (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  import_job_id TEXT REFERENCES import_jobs(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tmall','jd')),
  source_url TEXT NOT NULL UNIQUE,
  source_product_id TEXT,
  source_title TEXT,
  source_shop_name TEXT,
  tmall_url TEXT,
  jd_url TEXT,
  last_checked_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS imported_media_sources (
  id TEXT PRIMARY KEY,
  media_id TEXT REFERENCES media_assets(id) ON DELETE CASCADE,
  import_job_id TEXT REFERENCES import_jobs(id) ON DELETE SET NULL,
  source_url TEXT NOT NULL,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('tmall','jd','manual','unknown')),
  source_page_url TEXT,
  authorized INTEGER NOT NULL DEFAULT 0,
  license_note TEXT,
  checksum TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS seo_generation_jobs (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK (target_type IN ('product','article','faq','page')),
  target_id TEXT,
  generation_type TEXT NOT NULL CHECK (generation_type IN ('product_description','article','seo_title','seo_description','faq','structured_data','social_excerpt')),
  prompt_version TEXT NOT NULL DEFAULT 'disabled-v1',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','approved','rejected','published','failed','cancelled')),
  input_snapshot_json TEXT NOT NULL DEFAULT '{}',
  output_snapshot_json TEXT NOT NULL DEFAULT '{}',
  review_notes TEXT,
  created_by TEXT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS seo_push_logs (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('publish','update','offline','manual')),
  provider TEXT NOT NULL CHECK (provider IN ('indexnow','google_manual_list','baidu_manual_list','bing_manual_list')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','skipped','sent','failed')),
  http_status INTEGER,
  response_text TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_import_jobs_source_url ON import_jobs(source_url);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status, updated_at);
CREATE INDEX IF NOT EXISTS idx_import_jobs_requested_by ON import_jobs(requested_by, created_at);
CREATE INDEX IF NOT EXISTS idx_imported_product_sources_product ON imported_product_sources(product_id, platform);
CREATE INDEX IF NOT EXISTS idx_imported_media_sources_media ON imported_media_sources(media_id, import_job_id);
CREATE INDEX IF NOT EXISTS idx_seo_generation_jobs_target ON seo_generation_jobs(target_type, target_id, status);
CREATE INDEX IF NOT EXISTS idx_seo_push_logs_provider_status ON seo_push_logs(provider, status, created_at);
