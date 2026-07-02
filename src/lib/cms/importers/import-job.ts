import { getCmsDb } from "../env";
import { slugify } from "../validation";
import { detectImportPlatform, parseUrlLines } from "./platform-detect";
import { extractPublicMetadata, fetchPublicMetadata, type ProductMetadata } from "./metadata-fetcher";

export type ImportPreviewInput = {
  urls?: string;
  csv?: string;
  authorized?: boolean;
  productName?: string;
  category?: string;
  series?: string;
  primaryCategoryId?: string;
  subcategoryId?: string;
  seriesId?: string;
  notes?: string;
  html?: string;
  fetchPublicMetadata?: boolean;
};

export type ImportDraftSuggestion = {
  productId: string | null;
  slug: string;
  name: string;
  shortName: string;
  summary: string;
  seoTitle: string;
  seoDescription: string;
  imageAlt: string;
  galleryJson: string[];
  primaryCategoryId: string;
  subcategoryId: string;
  seriesId: string;
  status: "draft";
  indexable: false;
  visibleCatalog: false;
  buyButtonEnabled: false;
  tmallEnabled: false;
  jdEnabled: false;
  linksVerified: false;
};

export type ImportPreviewItem = {
  sourceUrl: string;
  platform: "tmall" | "jd" | "unknown";
  sourceProductId: string | null;
  titleDetected: string;
  authorized: boolean;
  errors: string[];
  metadata: ProductMetadata | null;
  draft: ImportDraftSuggestion | null;
};

const DEFAULT_IMPORT_TAXONOMY = {
  primaryCategoryId: "intimate-molds",
  subcategoryId: "tpe-hip-mold",
  seriesId: "hip-mold-series"
};

const ALLOWED_PRIMARY_CATEGORY_IDS = new Set(["intimate-molds", "realistic-dolls", "masturbator-cups"]);
const ALLOWED_SUBCATEGORY_IDS = new Set([
  "tpe-hip-mold",
  "tpe-half-body",
  "tpe-leg-mold",
  "tpe-local-mold",
  "silicone-hip-mold",
  "silicone-half-body",
  "silicone-local-mold",
  "tpe-realistic-dolls",
  "silicone-realistic-dolls",
  "masturbator-cup"
]);
const ALLOWED_SERIES_IDS = new Set([
  "hip-mold-series",
  "half-body-doll-series",
  "silicone-mold-series",
  "realistic-doll-series",
  "masturbator-cup-series"
]);

export function normalizeImportTaxonomy(
  input: Pick<ImportPreviewInput, "primaryCategoryId" | "subcategoryId" | "seriesId"> = {}
) {
  return {
    primaryCategoryId:
      input.primaryCategoryId && ALLOWED_PRIMARY_CATEGORY_IDS.has(input.primaryCategoryId)
        ? input.primaryCategoryId
        : DEFAULT_IMPORT_TAXONOMY.primaryCategoryId,
    subcategoryId:
      input.subcategoryId && ALLOWED_SUBCATEGORY_IDS.has(input.subcategoryId)
        ? input.subcategoryId
        : DEFAULT_IMPORT_TAXONOMY.subcategoryId,
    seriesId: input.seriesId && ALLOWED_SERIES_IDS.has(input.seriesId) ? input.seriesId : DEFAULT_IMPORT_TAXONOMY.seriesId
  };
}

function parseCsvRows(csv: string) {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function sourceUrlsFromInput(input: ImportPreviewInput) {
  const urls: string[] = [];
  if (input.urls) urls.push(...parseUrlLines(input.urls));
  if (input.csv) {
    for (const row of parseCsvRows(input.csv)) {
      if (row.tmall_url) urls.push(String(row.tmall_url));
      if (row.jd_url) urls.push(String(row.jd_url));
    }
  }
  return Array.from(new Set(urls));
}

function cleanTitle(value: string) {
  return value
    .replace(/\s*[-_|｜]\s*(天猫|淘宝|京东|Tmall|Taobao|JD).*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 48);
}

function draftId(platform: "tmall" | "jd" | "unknown", productId: string | null) {
  if (!productId || platform === "unknown") return null;
  return `${platform}-${productId}`;
}

export function buildImportDraftSuggestion(input: {
  sourceUrl: string;
  platform: "tmall" | "jd" | "unknown";
  sourceProductId: string | null;
  titleDetected?: string | null;
  metadata?: ProductMetadata | null;
  primaryCategoryId?: string;
  subcategoryId?: string;
  seriesId?: string;
}): ImportDraftSuggestion | null {
  if (!["tmall", "jd"].includes(input.platform)) return null;
  const taxonomy = normalizeImportTaxonomy(input);
  const productId = draftId(input.platform, input.sourceProductId);
  const fallbackName = input.platform === "tmall" ? "天猫待审核商品" : "京东待审核商品";
  const name = cleanTitle(input.titleDetected || "") || fallbackName;
  const slug =
    (input.sourceProductId ? slugify(`${name}-${input.sourceProductId}`) : "") ||
    productId ||
    slugify(name) ||
    crypto.randomUUID();
  const summary = "由商品链接导入助手创建的待审核草稿。请人工确认分类、材质、图片授权、正文文案和 SEO 后，再提交审核或发布。";

  return {
    productId,
    slug,
    name,
    shortName: name.slice(0, 24),
    summary,
    seoTitle: `${name}｜蜜女郎官方渠道待审核`,
    seoDescription: `了解${name}的产品类型、材质方向、清洁收纳与隐私购买说明。正式展示前请人工复核具体规格、发货和售后信息。`,
    imageAlt: `蜜女郎${name}待审核商品图`,
    galleryJson: input.metadata?.imageUrls || [],
    primaryCategoryId: taxonomy.primaryCategoryId,
    subcategoryId: taxonomy.subcategoryId,
    seriesId: taxonomy.seriesId,
    status: "draft",
    indexable: false,
    visibleCatalog: false,
    buyButtonEnabled: false,
    tmallEnabled: false,
    jdEnabled: false,
    linksVerified: false
  };
}

export function previewImportInput(input: ImportPreviewInput, maxUrls = 50): ImportPreviewItem[] {
  const urls = sourceUrlsFromInput(input);
  if (urls.length === 0) {
    throw new Error("请至少提供一个商品链接或 CSV 行。");
  }
  if (urls.length > maxUrls) {
    throw new Error(`单次最多允许导入 ${maxUrls} 个链接。`);
  }

  return urls.map((url) => {
    const errors: string[] = [];
    let metadata: ProductMetadata | null = null;
    try {
      const detected = detectImportPlatform(url);
      if (input.html && urls.length === 1) {
        metadata = extractPublicMetadata(detected.normalizedUrl, input.html);
      }
      const titleDetected = metadata?.titleDetected || input.productName || "";
      return {
        sourceUrl: detected.normalizedUrl,
        platform: detected.platform,
        sourceProductId: detected.productId,
        titleDetected,
        authorized: input.authorized === true,
        errors,
        metadata,
        draft: buildImportDraftSuggestion({
          sourceUrl: detected.normalizedUrl,
          platform: detected.platform,
          sourceProductId: detected.productId,
          titleDetected,
          metadata,
          primaryCategoryId: input.primaryCategoryId,
          subcategoryId: input.subcategoryId,
          seriesId: input.seriesId
        })
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "链接解析失败。");
      return {
        sourceUrl: url,
        platform: "unknown",
        sourceProductId: null,
        titleDetected: input.productName || "",
        authorized: input.authorized === true,
        errors,
        metadata,
        draft: null
      };
    }
  });
}

export async function previewImportInputWithPublicMetadata(input: ImportPreviewInput, maxUrls = 50) {
  const items = previewImportInput(input, maxUrls);
  if (!input.fetchPublicMetadata) return items;

  for (const item of items) {
    if (item.errors.length > 0) continue;
    try {
      const metadata = await fetchPublicMetadata(item.sourceUrl);
      item.metadata = metadata;
      item.titleDetected = metadata.titleDetected || item.titleDetected;
      item.draft = buildImportDraftSuggestion({
        sourceUrl: item.sourceUrl,
        platform: item.platform,
        sourceProductId: item.sourceProductId,
        titleDetected: item.titleDetected,
        metadata,
        primaryCategoryId: input.primaryCategoryId,
        subcategoryId: input.subcategoryId,
        seriesId: input.seriesId
      });
    } catch (error) {
      item.errors.push(error instanceof Error ? error.message : "公开 metadata 读取失败。");
    }
  }
  return items;
}

export async function createImportJobs(input: ImportPreviewInput, actorId: string) {
  const db = getCmsDb();
  if (!db) throw new Error("CMS_DB 未绑定。");
  const items = await previewImportInputWithPublicMetadata(input, Number(process.env.CMS_IMPORT_MAX_URLS_PER_BATCH || 50));
  const now = new Date().toISOString();
  const created: string[] = [];
  const createdJobs: { id: string; sourceUrl: string }[] = [];
  for (const item of items) {
    if (item.errors.length > 0) continue;
    const status = item.authorized ? "needs_review" : "draft";
    const rawMetadata = {
      metadata: item.metadata,
      draft: item.draft,
      compliance: {
        source: "public-meta-only",
        noCookies: true,
        noPrivateApis: true,
        noAutoPublish: true
      }
    };
    await db
      .prepare(
        `INSERT INTO import_jobs
          (id, source_platform, source_url, source_product_id, source_shop_name, title_detected, status, requested_by, authorized, raw_metadata_json, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(source_url) DO UPDATE SET
          source_product_id = excluded.source_product_id,
          source_shop_name = excluded.source_shop_name,
          title_detected = excluded.title_detected,
          requested_by = excluded.requested_by,
          authorized = excluded.authorized,
          raw_metadata_json = excluded.raw_metadata_json,
          notes = excluded.notes,
          updated_at = excluded.updated_at`
      )
      .bind(
        crypto.randomUUID(),
        item.platform,
        item.sourceUrl,
        item.sourceProductId,
        item.metadata?.sourceShopName || null,
        item.titleDetected || null,
        status,
        actorId,
        item.authorized ? 1 : 0,
        JSON.stringify(rawMetadata),
        input.notes || null,
        now,
        now
      )
      .run();
    created.push(item.sourceUrl);
    const savedJob = await db.prepare("SELECT id FROM import_jobs WHERE source_url = ?").bind(item.sourceUrl).first<{ id: string }>();
    if (savedJob?.id) createdJobs.push({ id: savedJob.id, sourceUrl: item.sourceUrl });
  }
  return { created, createdJobs, skipped: items.filter((item) => item.errors.length > 0), total: items.length };
}
