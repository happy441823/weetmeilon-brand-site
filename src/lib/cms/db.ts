import { getCmsDb, getCmsMediaBucket } from "./env";
import { cmsBackupTables } from "./backup";
import { getResourceConfig, type CmsField } from "./schema";
import { assertAsciiKebabSlug, assertSafeUrl, markdownSourceToHtml, normalizeCmsFieldValue, normalizeJsonText, slugify } from "./validation";
import { buildProductPublishVisibilityPatch, validatePublishQuality } from "./workflow";

type QueryOptions = {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  hideSensitiveSettings?: boolean;
};

const baseFields = ["id", "created_at", "updated_at"];

function quote(name: string) {
  return `"${name.replace(/"/g, "")}"`;
}

function fieldNames(fields: CmsField[]) {
  return fields.map((field) => field.name);
}

function primaryKeyFor(resource: string) {
  const config = getResourceConfig(resource);
  return config?.primaryKey || "id";
}

function productListWhereSql(config: NonNullable<ReturnType<typeof getResourceConfig>>, options: QueryOptions) {
  const where: string[] = [];
  const values: unknown[] = [];

  if (options.q && config.searchable.length > 0) {
    where.push(`(${config.searchable.map((field) => `p.${quote(field)} LIKE ?`).join(" OR ")})`);
    for (const _field of config.searchable) {
      values.push(`%${options.q}%`);
    }
  }

  if (options.status && config.fields.some((field) => field.name === "status")) {
    where.push("p.status = ?");
    values.push(options.status);
  }

  return { whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "", values };
}

async function listProductsWithThumbnails(config: NonNullable<ReturnType<typeof getResourceConfig>>, options: QueryOptions, page: number, pageSize: number) {
  const db = getCmsDb();
  if (!db) {
    return { rows: [], total: 0, dbReady: false };
  }

  const { whereSql, values } = productListWhereSql(config, options);
  const count = await db.prepare(`SELECT COUNT(*) AS total FROM ${quote(config.table)} p ${whereSql}`).bind(...values).first<{ total: number }>();
  const rows = await db
    .prepare(
      `SELECT p.*, cover.public_url AS _thumbnail_url, cover.alt AS _thumbnail_alt, cover.file_name AS _thumbnail_file_name
       FROM ${quote(config.table)} p
       LEFT JOIN media_assets cover ON p.cover_media_id = cover.id
       ${whereSql}
       ORDER BY p.updated_at DESC
       LIMIT ? OFFSET ?`
    )
    .bind(...values, pageSize, (page - 1) * pageSize)
    .all<Record<string, unknown>>();

  return {
    rows: rows.results.map((row) => redactSensitiveSettings("products", row, options.hideSensitiveSettings)),
    total: count?.total || 0,
    dbReady: true
  };
}

const systemRoleNames = new Set(["super_admin", "editor", "reviewer", "viewer"]);
const systemRoleIds = new Set(["role_super_admin", "role_editor", "role_reviewer", "role_viewer"]);

function redactSensitiveSettings(resource: string, row: Record<string, unknown>, hideSensitiveSettings?: boolean) {
  if (resource !== "site_settings" || !hideSensitiveSettings || !(row.is_sensitive === 1 || row.is_sensitive === true)) {
    return row;
  }
  return { ...row, value_json: null, redacted: true };
}

async function assertMutableSystemRole(db: { prepare(sql: string): { bind(...values: unknown[]): { first<T = Record<string, unknown>>(): Promise<T | null> } } }, id: string) {
  if (systemRoleIds.has(id)) {
    throw new Error("系统内置角色不允许通过通用 CRUD 编辑或删除。");
  }
  const role = await db.prepare("SELECT id, name FROM admin_roles WHERE id = ?").bind(id).first<{ id: string; name: string }>();
  if (role && systemRoleNames.has(role.name)) {
    throw new Error("系统内置角色不允许通过通用 CRUD 编辑或删除。");
  }
}

function normalizeFieldValue(resource: string, field: CmsField, value: unknown) {
  if (field.type === "boolean") {
    return value === true || value === "true" || value === "1" || value === 1 ? 1 : 0;
  }
  if (field.type === "number") {
    const numberValue = Number(value || 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }
  if (field.type === "json") {
    return normalizeCmsFieldValue(field.name, value, field.name.endsWith("_json") ? "[]" : "{}");
  }
  if (field.name === "body_html") {
    return normalizeCmsFieldValue(field.name, value, "");
  }
  if (field.name === "slug") {
    if (resource === "products") {
      return assertAsciiKebabSlug(value, "Product slug");
    }
    return slugify(String(value || ""));
  }
  if (field.name === "href" || field.name.endsWith("_url") || field.name === "canonical_url" || field.name === "destination_url") {
    return assertSafeUrl(String(value || ""), field.label);
  }
  return typeof value === "string" ? value.trim() : value ?? null;
}

function preparePayload(resource: string, input: Record<string, unknown>) {
  const config = getResourceConfig(resource);
  if (!config) {
    throw new Error("未知资源。");
  }

  const payload: Record<string, unknown> = {};
  for (const field of config.fields as CmsField[]) {
    if (field.readonly || !(field.name in input)) {
      continue;
    }
    const value = normalizeFieldValue(resource, field, input[field.name]);
    if (field.required && (value === "" || value == null)) {
      throw new Error(`${field.label} 不能为空。`);
    }
    payload[field.name] = value;
  }

  if ("name" in payload && !("slug" in payload) && config.fields.some((field) => field.name === "slug")) {
    payload.slug = slugify(String(payload.name));
  }
  if ("title" in payload && !("slug" in payload) && config.fields.some((field) => field.name === "slug")) {
    payload.slug = slugify(String(payload.title));
  }
  if (resource === "products" && "slug" in payload) {
    payload.slug = assertAsciiKebabSlug(payload.slug, "Product slug");
  }
  if ("markdown_source" in payload && !("body_html" in payload) && config.fields.some((field) => field.name === "body_html")) {
    payload.body_html = markdownSourceToHtml(payload.markdown_source);
  }

  return payload;
}

export async function listResource(resource: string, options: QueryOptions = {}) {
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) {
    throw new Error("未知资源。");
  }
  if (!db) {
    return { rows: [], total: 0, dbReady: false };
  }

  const page = Math.max(1, options.page || 1);
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 20));
  if (resource === "products") {
    return listProductsWithThumbnails(config, options, page, pageSize);
  }
  const where: string[] = [];
  const values: unknown[] = [];

  if (options.q && config.searchable.length > 0) {
    where.push(`(${config.searchable.map((field) => `${quote(field)} LIKE ?`).join(" OR ")})`);
    for (const _field of config.searchable) {
      values.push(`%${options.q}%`);
    }
  }

  if (options.status && config.fields.some((field) => field.name === "status")) {
    where.push("status = ?");
    values.push(options.status);
  }

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const count = await db.prepare(`SELECT COUNT(*) AS total FROM ${quote(config.table)} ${whereSql}`).bind(...values).first<{ total: number }>();
  const rows = await db
    .prepare(`SELECT * FROM ${quote(config.table)} ${whereSql} ORDER BY updated_at DESC LIMIT ? OFFSET ?`)
    .bind(...values, pageSize, (page - 1) * pageSize)
    .all<Record<string, unknown>>();

  return {
    rows: rows.results.map((row) => redactSensitiveSettings(resource, row, options.hideSensitiveSettings)),
    total: count?.total || 0,
    dbReady: true
  };
}

export async function getResourceItem(resource: string, id: string, options: { hideSensitiveSettings?: boolean } = {}) {
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) throw new Error("未知资源。");
  if (!db) return null;
  if (resource === "products") {
    const row = await db
      .prepare(
        `SELECT p.*, cover.public_url AS _thumbnail_url, cover.alt AS _thumbnail_alt, cover.file_name AS _thumbnail_file_name
         FROM ${quote(config.table)} p
         LEFT JOIN media_assets cover ON p.cover_media_id = cover.id
         WHERE p.${quote(primaryKeyFor(resource))} = ?`
      )
      .bind(id)
      .first<Record<string, unknown>>();
    return row ? redactSensitiveSettings(resource, row, options.hideSensitiveSettings) : null;
  }
  const row = await db.prepare(`SELECT * FROM ${quote(config.table)} WHERE ${quote(primaryKeyFor(resource))} = ?`).bind(id).first<Record<string, unknown>>();
  return row ? redactSensitiveSettings(resource, row, options.hideSensitiveSettings) : null;
}

export async function createResourceItem(resource: string, input: Record<string, unknown>, actorId?: string) {
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) throw new Error("未知资源。");
  if (!db) throw new Error("CMS_DB 未绑定。");

  const payload = preparePayload(resource, input);
  const primaryKey = primaryKeyFor(resource);
  const id = primaryKey === "id" ? String(input.id || crypto.randomUUID()) : String(payload[primaryKey] || "");
  if (!id) {
    throw new Error(`${primaryKey} 不能为空。`);
  }
  const now = new Date().toISOString();
  const names = primaryKey === "id" ? ["id", ...Object.keys(payload), "created_at", "updated_at"] : [...Object.keys(payload), "created_at", "updated_at"];
  const values = primaryKey === "id" ? [id, ...Object.values(payload), now, now] : [...Object.values(payload), now, now];
  const placeholders = names.map(() => "?").join(", ");

  await db
    .prepare(`INSERT INTO ${quote(config.table)} (${names.map(quote).join(", ")}) VALUES (${placeholders})`)
    .bind(...values)
    .run();

  await createRevisionSafely(resource, id, "创建内容", actorId);
  const item = await getResourceItem(resource, id);
  await syncMediaUsagesSafely(resource, id, item || {});
  return item;
}

export async function updateResourceItem(resource: string, id: string, input: Record<string, unknown>, summary = "更新内容", actorId?: string) {
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) throw new Error("未知资源。");
  if (!db) throw new Error("CMS_DB 未绑定。");
  if (resource === "admin_roles") {
    await assertMutableSystemRole(db, id);
  }

  const payload = preparePayload(resource, input);
  const names = Object.keys(payload);
  if (names.length === 0) {
    return getResourceItem(resource, id);
  }

  await db
    .prepare(`UPDATE ${quote(config.table)} SET ${names.map((name) => `${quote(name)} = ?`).join(", ")}, updated_at = ? WHERE ${quote(primaryKeyFor(resource))} = ?`)
    .bind(...Object.values(payload), new Date().toISOString(), id)
    .run();

  await createRevisionSafely(resource, id, summary, actorId);
  const item = await getResourceItem(resource, id);
  await syncMediaUsagesSafely(resource, id, item || {});
  return item;
}

export async function deleteResourceItem(resource: string, id: string) {
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) throw new Error("未知资源。");
  if (!db) throw new Error("CMS_DB 未绑定。");

  if (resource === "audit_logs") {
    throw new Error("操作日志不允许从后台删除。");
  }
  if (resource === "publish_jobs") {
    throw new Error("发布任务只能由工作流服务维护，不能通过通用 CRUD 删除。");
  }
  if (resource === "admin_roles") {
    await assertMutableSystemRole(db, id);
  }
  if (resource === "media_assets") {
    const usage = await db.prepare("SELECT COUNT(*) AS total FROM media_usages WHERE media_id = ?").bind(id).first<{ total: number }>();
    if ((usage?.total || 0) > 0) {
      throw new Error("该素材仍被页面或内容引用，不能删除。");
    }
    const media = await db.prepare("SELECT r2_key FROM media_assets WHERE id = ?").bind(id).first<{ r2_key: string }>();
    const bucket = getCmsMediaBucket();
    if (media?.r2_key && bucket) {
      await bucket.delete(media.r2_key);
    }
  }

  await db.prepare(`DELETE FROM ${quote(config.table)} WHERE ${quote(primaryKeyFor(resource))} = ?`).bind(id).run();
  return { ok: true };
}

export async function setWorkflowStatus(resource: string, id: string, status: string, actorId: string, options: { scheduledAt?: string | null } = {}) {
  const allowed = new Set(["products", "articles", "pages"]);
  if (!allowed.has(resource)) {
    throw new Error("该资源不支持发布工作流。");
  }
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) throw new Error("未知资源。");
  if (!db) throw new Error("CMS_DB 未绑定。");

  const now = new Date().toISOString();
  const current = await getResourceItem(resource, id);
  if (!current) {
    throw new Error("内容不存在，不能执行工作流操作。");
  }
  if (status === "published" || status === "scheduled") {
    validatePublishQuality(resource, current);
  }
  const patch: Record<string, unknown> = { status };
  if (status === "published") {
    patch.published_at = now;
    patch.scheduled_at = null;
    if (resource === "articles") {
      patch.first_published_at = current?.first_published_at || now;
      patch.last_published_by = actorId;
    } else {
      patch.published_by = actorId;
    }
    patch.reviewed_by = actorId;
    if (resource === "products") {
      Object.assign(patch, buildProductPublishVisibilityPatch(current));
    }
  }
  if (status === "pending_review") {
    patch.reviewed_by = null;
  }
  if (status === "scheduled") {
    patch.scheduled_at = options.scheduledAt;
    patch.reviewed_by = actorId;
  }
  if (status === "draft" || status === "offline" || status === "archived") {
    patch.scheduled_at = null;
  }
  if (status === "coming_soon" && resource === "products") {
    patch.buy_button_enabled = 0;
    patch.tmall_enabled = 0;
    patch.jd_enabled = 0;
  }

  const names = Object.keys(patch);
  await db
    .prepare(`UPDATE ${quote(config.table)} SET ${names.map((name) => `${quote(name)} = ?`).join(", ")}, updated_at = ? WHERE id = ?`)
    .bind(...Object.values(patch), now, id)
    .run();

  if (status === "scheduled" && options.scheduledAt) {
    await db
      .prepare("UPDATE publish_jobs SET status = 'cancelled', updated_at = ? WHERE entity_type = ? AND entity_id = ? AND status = 'pending'")
      .bind(now, resource, id)
      .run();
    await db
      .prepare(
        `INSERT INTO publish_jobs (id, entity_type, entity_id, action, status, run_at, created_by, created_at, updated_at)
         VALUES (?, ?, ?, 'publish', 'pending', ?, ?, ?, ?)`
      )
      .bind(crypto.randomUUID(), resource, id, options.scheduledAt, actorId, now, now)
      .run();
  }
  if (["draft", "published", "offline", "archived"].includes(status)) {
    await db
      .prepare("UPDATE publish_jobs SET status = 'cancelled', updated_at = ? WHERE entity_type = ? AND entity_id = ? AND status = 'pending'")
      .bind(now, resource, id)
      .run();
  }

  await createRevisionIfNeeded(resource, id, `状态改为 ${status}`, actorId);
  return getResourceItem(resource, id);
}

export async function createRevisionIfNeeded(resource: string, id: string, summary: string, actorId?: string) {
  const map: Record<string, { table: string; field: string; source: string }> = {
    products: { table: "product_revisions", field: "product_id", source: "products" },
    articles: { table: "article_revisions", field: "article_id", source: "articles" },
    pages: { table: "page_revisions", field: "page_id", source: "pages" }
  };
  const target = map[resource];
  const db = getCmsDb();
  if (!target || !db) {
    return;
  }

  const current = await db.prepare(`SELECT * FROM ${quote(target.source)} WHERE id = ?`).bind(id).first<Record<string, unknown>>();
  if (!current) {
    return;
  }
  const version = await db
    .prepare(`SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM ${quote(target.table)} WHERE ${quote(target.field)} = ?`)
    .bind(id)
    .first<{ next_version: number }>();

  await db
    .prepare(`INSERT INTO ${quote(target.table)} (id, ${quote(target.field)}, version, actor_id, summary, snapshot_json) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, version?.next_version || 1, actorId || null, summary, JSON.stringify(current))
    .run();
}

async function createRevisionSafely(resource: string, id: string, summary: string, actorId?: string) {
  try {
    await createRevisionIfNeeded(resource, id, summary, actorId);
  } catch (error) {
    console.error("[cms-revision]", error instanceof Error ? error.message : error);
  }
}

const explicitMediaFields = new Set(["cover_media_id", "hero_media_id", "og_media_id", "media_id", "image_media_id"]);
const structuredMediaJsonFields = new Set(["gallery_json", "content_blocks_json", "modules_json", "config_json"]);

function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function collectStructuredMediaIds(value: unknown, fieldName: string, refs: Map<string, string>) {
  if (Array.isArray(value)) {
    for (const item of value) collectStructuredMediaIds(item, fieldName, refs);
    return;
  }
  if (!value || typeof value !== "object") return;
  const entry = value as Record<string, unknown>;
  if (typeof entry.media_id === "string" && entry.media_id.trim()) {
    refs.set(entry.media_id.trim(), fieldName);
  }
  if (Array.isArray(entry.items)) collectStructuredMediaIds(entry.items, fieldName, refs);
  if (Array.isArray(entry.images)) collectStructuredMediaIds(entry.images, fieldName, refs);
  if (Array.isArray(entry.blocks)) collectStructuredMediaIds(entry.blocks, fieldName, refs);
}

function collectExplicitMediaRefs(record: Record<string, unknown>) {
  const refs = new Map<string, string>();
  for (const [field, value] of Object.entries(record)) {
    if (explicitMediaFields.has(field) && typeof value === "string" && value.trim()) {
      refs.set(value.trim(), field);
    }
    if (structuredMediaJsonFields.has(field)) {
      collectStructuredMediaIds(parseMaybeJson(value), field, refs);
    }
  }
  return refs;
}

export async function syncMediaUsages(resource: string, id: string, payload: Record<string, unknown>) {
  const db = getCmsDb();
  if (!db || !["products", "articles", "pages", "homepage_sections", "faqs"].includes(resource)) return;
  const mediaRefs = collectExplicitMediaRefs(payload);
  await db.prepare("DELETE FROM media_usages WHERE entity_type = ? AND entity_id = ?").bind(resource, id).run();
  for (const [mediaId, fieldName] of mediaRefs) {
    await db
      .prepare("INSERT OR IGNORE INTO media_usages (id, media_id, entity_type, entity_id, field_name) VALUES (?, ?, ?, ?, ?)")
      .bind(crypto.randomUUID(), mediaId, resource, id, fieldName)
      .run();
  }
  await db.prepare("UPDATE media_assets SET usage_count = (SELECT COUNT(*) FROM media_usages WHERE media_id = media_assets.id)").run();
}

async function syncMediaUsagesSafely(resource: string, id: string, payload: Record<string, unknown>) {
  try {
    await syncMediaUsages(resource, id, payload);
  } catch (error) {
    console.error("[cms-media-usage]", error instanceof Error ? error.message : error);
  }
}

export async function dashboardStats() {
  const db = getCmsDb();
  if (!db) {
    return { dbReady: false, cards: [], pending: [], recent: [] };
  }
  const activeDb = db;

  async function count(sql: string) {
    const row = await activeDb.prepare(sql).first<{ total: number }>();
    return row?.total || 0;
  }

  const cards = [
    { label: "商品总数", value: await count("SELECT COUNT(*) AS total FROM products") },
    { label: "已发布商品", value: await count("SELECT COUNT(*) AS total FROM products WHERE status = 'published'") },
    { label: "即将上新", value: await count("SELECT COUNT(*) AS total FROM products WHERE status = 'coming_soon'") },
    { label: "文章总数", value: await count("SELECT COUNT(*) AS total FROM articles") },
    { label: "已发布文章", value: await count("SELECT COUNT(*) AS total FROM articles WHERE status = 'published'") },
    { label: "定时文章", value: await count("SELECT COUNT(*) AS total FROM articles WHERE status = 'scheduled'") },
    { label: "FAQ 数量", value: await count("SELECT COUNT(*) AS total FROM faqs") },
    { label: "媒体文件", value: await count("SELECT COUNT(*) AS total FROM media_assets") }
  ];

  const pending = [
    { label: "缺少主图商品", value: await count("SELECT COUNT(*) AS total FROM products WHERE cover_media_id IS NULL") },
    { label: "缺少购买链接商品", value: await count("SELECT COUNT(*) AS total FROM products WHERE COALESCE(tmall_url, '') = '' AND COALESCE(jd_url, '') = ''") },
    { label: "待审核商品", value: await count("SELECT COUNT(*) AS total FROM products WHERE status = 'pending_review'") },
    { label: "待审核文章", value: await count("SELECT COUNT(*) AS total FROM articles WHERE status = 'pending_review'") },
    { label: "SEO 信息不完整内容", value: await count("SELECT COUNT(*) AS total FROM products WHERE COALESCE(seo_title, '') = '' OR COALESCE(seo_description, '') = ''") },
    { label: "未使用媒体文件", value: await count("SELECT COUNT(*) AS total FROM media_assets WHERE usage_count = 0") }
  ];

  const recent = await db
    .prepare("SELECT actor_email, action, entity_type, entity_id, summary, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 8")
    .all<Record<string, unknown>>();

  return { dbReady: true, cards, pending, recent: recent.results };
}

export async function exportBackup() {
  const db = getCmsDb();
  if (!db) {
    throw new Error("CMS_DB 未绑定。");
  }
  const tables: Record<string, unknown[]> = {};
  for (const table of cmsBackupTables) {
    const rows = await db.prepare(`SELECT * FROM ${quote(table)}`).all<Record<string, unknown>>();
    tables[table] = rows.results;
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: "sweetmeilon-cms",
    mode: "full-business-backup",
    includesR2Objects: false,
    r2BackupRequired: true,
    tables
  };
}

export const cmsWritableFields = {
  baseFields,
  fieldNames
};
