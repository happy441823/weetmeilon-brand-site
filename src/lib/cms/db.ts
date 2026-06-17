import { getCmsDb } from "./env";
import { getResourceConfig, type CmsField } from "./schema";
import { assertSafeUrl, normalizeJsonText, slugify } from "./validation";

type QueryOptions = {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
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

function normalizeFieldValue(field: CmsField, value: unknown) {
  if (field.type === "boolean") {
    return value === true || value === "true" || value === "1" || value === 1 ? 1 : 0;
  }
  if (field.type === "number") {
    const numberValue = Number(value || 0);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }
  if (field.type === "json") {
    return normalizeJsonText(value, field.name.endsWith("_json") ? "[]" : "{}");
  }
  if (field.name === "slug") {
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
    const value = normalizeFieldValue(field, input[field.name]);
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
    rows: rows.results,
    total: count?.total || 0,
    dbReady: true
  };
}

export async function getResourceItem(resource: string, id: string) {
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) throw new Error("未知资源。");
  if (!db) return null;
  return db.prepare(`SELECT * FROM ${quote(config.table)} WHERE ${quote(primaryKeyFor(resource))} = ?`).bind(id).first<Record<string, unknown>>();
}

export async function createResourceItem(resource: string, input: Record<string, unknown>) {
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

  await createRevisionIfNeeded(resource, id, "创建内容");
  return getResourceItem(resource, id);
}

export async function updateResourceItem(resource: string, id: string, input: Record<string, unknown>, summary = "更新内容") {
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) throw new Error("未知资源。");
  if (!db) throw new Error("CMS_DB 未绑定。");

  const payload = preparePayload(resource, input);
  const names = Object.keys(payload);
  if (names.length === 0) {
    return getResourceItem(resource, id);
  }

  await db
    .prepare(`UPDATE ${quote(config.table)} SET ${names.map((name) => `${quote(name)} = ?`).join(", ")}, updated_at = ? WHERE ${quote(primaryKeyFor(resource))} = ?`)
    .bind(...Object.values(payload), new Date().toISOString(), id)
    .run();

  await createRevisionIfNeeded(resource, id, summary);
  return getResourceItem(resource, id);
}

export async function deleteResourceItem(resource: string, id: string) {
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) throw new Error("未知资源。");
  if (!db) throw new Error("CMS_DB 未绑定。");

  if (resource === "audit_logs") {
    throw new Error("操作日志不允许从后台删除。");
  }
  if (resource === "media_assets") {
    const usage = await db.prepare("SELECT COUNT(*) AS total FROM media_usages WHERE media_id = ?").bind(id).first<{ total: number }>();
    if ((usage?.total || 0) > 0) {
      throw new Error("该素材仍被页面或内容引用，不能删除。");
    }
  }

  await db.prepare(`DELETE FROM ${quote(config.table)} WHERE ${quote(primaryKeyFor(resource))} = ?`).bind(id).run();
  return { ok: true };
}

export async function setWorkflowStatus(resource: string, id: string, status: string, actorId: string) {
  const allowed = new Set(["products", "articles", "pages"]);
  if (!allowed.has(resource)) {
    throw new Error("该资源不支持发布工作流。");
  }
  const config = getResourceConfig(resource);
  const db = getCmsDb();
  if (!config) throw new Error("未知资源。");
  if (!db) throw new Error("CMS_DB 未绑定。");

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "published") {
    patch.published_at = now;
    if (resource === "articles") {
      patch.first_published_at = now;
      patch.last_published_by = actorId;
    } else {
      patch.published_by = actorId;
    }
  }
  if (status === "pending_review") {
    patch.reviewed_by = null;
  }
  if (status === "offline") {
    patch.reviewed_by = actorId;
  }

  const names = Object.keys(patch);
  await db
    .prepare(`UPDATE ${quote(config.table)} SET ${names.map((name) => `${quote(name)} = ?`).join(", ")}, updated_at = ? WHERE id = ?`)
    .bind(...Object.values(patch), now, id)
    .run();

  await createRevisionIfNeeded(resource, id, `状态改为 ${status}`);
  return getResourceItem(resource, id);
}

export async function createRevisionIfNeeded(resource: string, id: string, summary: string) {
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
    .prepare(`INSERT INTO ${quote(target.table)} (id, ${quote(target.field)}, version, summary, snapshot_json) VALUES (?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), id, version?.next_version || 1, summary, JSON.stringify(current))
    .run();
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
  const resources = Object.keys({
    products: true,
    articles: true,
    pages: true,
    faqs: true,
    media_assets: true,
    navigation_items: true,
    footer_groups: true,
    footer_items: true,
    site_settings: true,
    redirects: true
  });

  const data: Record<string, unknown[]> = {};
  for (const resource of resources) {
    const config = getResourceConfig(resource);
    if (!config) continue;
    const rows = await db.prepare(`SELECT * FROM ${quote(config.table)}`).all<Record<string, unknown>>();
    data[resource] = rows.results;
  }
  return {
    exportedAt: new Date().toISOString(),
    source: "sweetmeilon-cms",
    data
  };
}

export const cmsWritableFields = {
  baseFields,
  fieldNames
};
