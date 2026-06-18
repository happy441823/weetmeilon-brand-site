import { getCmsDb } from "../env";
import { detectImportPlatform, parseUrlLines } from "./platform-detect";
import { extractPublicMetadata, type ProductMetadata } from "./metadata-fetcher";

export type ImportPreviewInput = {
  urls?: string;
  csv?: string;
  authorized?: boolean;
  productName?: string;
  category?: string;
  series?: string;
  notes?: string;
  html?: string;
};

export type ImportPreviewItem = {
  sourceUrl: string;
  platform: "tmall" | "jd" | "unknown";
  sourceProductId: string | null;
  titleDetected: string;
  authorized: boolean;
  errors: string[];
  metadata: ProductMetadata | null;
};

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
      return {
        sourceUrl: detected.normalizedUrl,
        platform: detected.platform,
        sourceProductId: detected.productId,
        titleDetected: metadata?.titleDetected || input.productName || "",
        authorized: input.authorized === true,
        errors,
        metadata
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
        metadata
      };
    }
  });
}

export async function createImportJobs(input: ImportPreviewInput, actorId: string) {
  const db = getCmsDb();
  if (!db) throw new Error("CMS_DB 未绑定。");
  const items = previewImportInput(input, Number(process.env.CMS_IMPORT_MAX_URLS_PER_BATCH || 50));
  const now = new Date().toISOString();
  const created: string[] = [];
  for (const item of items) {
    if (item.errors.length > 0) continue;
    const status = item.authorized ? "needs_review" : "draft";
    await db
      .prepare(
        `INSERT INTO import_jobs
          (id, source_platform, source_url, source_product_id, title_detected, status, requested_by, authorized, raw_metadata_json, notes, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(source_url) DO UPDATE SET
          source_product_id = excluded.source_product_id,
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
        item.titleDetected || null,
        status,
        actorId,
        item.authorized ? 1 : 0,
        JSON.stringify(item.metadata?.metadata || {}),
        input.notes || null,
        now,
        now
      )
      .run();
    created.push(item.sourceUrl);
  }
  return { created, skipped: items.filter((item) => item.errors.length > 0), total: items.length };
}
