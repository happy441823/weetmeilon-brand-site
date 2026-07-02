import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { getCmsDb } from "@/lib/cms/env";
import { buildImportDraftSuggestion, type ImportDraftSuggestion } from "@/lib/cms/importers/import-job";

type Params = { params: Promise<{ id: string }> };

type ImportJobRow = {
  id: string;
  source_platform: "tmall" | "jd" | "unknown";
  source_url: string;
  source_product_id: string | null;
  source_shop_name: string | null;
  title_detected: string | null;
  status: string;
  authorized: number;
  raw_metadata_json: string | null;
};

function parseRawMetadata(value: string | null) {
  if (!value) return {};
  try {
    return JSON.parse(value) as {
      draft?: ImportDraftSuggestion | null;
      metadata?: {
        imageUrls?: string[];
        sourceShopName?: string;
      } | null;
    };
  } catch {
    return {};
  }
}

function draftFromJob(job: ImportJobRow) {
  const raw = parseRawMetadata(job.raw_metadata_json);
  if (raw.draft) return raw.draft;
  return buildImportDraftSuggestion({
    sourceUrl: job.source_url,
    platform: job.source_platform,
    sourceProductId: job.source_product_id,
    titleDetected: job.title_detected,
    metadata: raw.metadata
      ? {
          platform: job.source_platform,
          sourceUrl: job.source_url,
          sourceProductId: job.source_product_id,
          titleDetected: job.title_detected || "",
          sourceShopName: raw.metadata.sourceShopName || "",
          imageUrls: raw.metadata.imageUrls || [],
          description: "",
          metadata: {}
        }
      : null
  });
}

export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requireRole(request, ["super_admin", "reviewer"]);
    const db = getCmsDb();
    if (!db) throw new Error("CMS_DB 未绑定。");
    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const productId = typeof body.product_id === "string" ? body.product_id.trim() : "";
    const now = new Date().toISOString();
    const job = await db
      .prepare(
        `SELECT id, source_platform, source_url, source_product_id, source_shop_name, title_detected, status, authorized, raw_metadata_json
         FROM import_jobs WHERE id = ?`
      )
      .bind(id)
      .first<ImportJobRow>();
    if (!job) return NextResponse.json({ error: "导入任务不存在。" }, { status: 404 });
    if (job.authorized !== 1) return NextResponse.json({ error: "未确认授权的导入任务不能生成商品。" }, { status: 400 });
    if (!["needs_review", "fetched"].includes(job.status)) return NextResponse.json({ error: "只有待审核或已读取任务可以导入商品。" }, { status: 400 });
    if (!["tmall", "jd"].includes(job.source_platform)) return NextResponse.json({ error: "未知平台不能导入商品。" }, { status: 400 });

    const duplicate = await db
      .prepare("SELECT product_id FROM imported_product_sources WHERE source_url = ? AND COALESCE(product_id, '') != COALESCE(?, '')")
      .bind(job.source_url, productId || "")
      .first<{ product_id: string | null }>();
    if (duplicate?.product_id) {
      return NextResponse.json({ error: "同一个平台链接已经绑定到其他商品。" }, { status: 409 });
    }

    let targetId = productId;
    const draft = draftFromJob(job);
    if (!draft) return NextResponse.json({ error: "导入任务缺少草稿信息，请重新预览并创建任务。" }, { status: 400 });

    if (!targetId) {
      targetId = draft.productId || crypto.randomUUID();
      const existing = await db.prepare("SELECT id FROM products WHERE id = ?").bind(targetId).first<{ id: string }>();
      if (existing?.id) {
        return NextResponse.json({ error: "该平台商品草稿已经存在，请选择现有商品后再绑定链接。" }, { status: 409 });
      }
      await db
        .prepare(
          `INSERT INTO products
            (id, name, short_name, slug, primary_category_id, subcategory_id, series_id, status, sort_order, featured, visible_home, visible_catalog,
             summary, body_html, highlights_json, specifications_json, material_notes, care_notes, storage_notes,
             privacy_notes, compliance_notes, image_alt, gallery_json, seo_title, seo_description,
             tmall_url, jd_url, tmall_enabled, jd_enabled, buy_button_enabled, links_verified, indexable, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          targetId,
          draft.name,
          draft.shortName,
          draft.slug,
          draft.primaryCategoryId,
          draft.subcategoryId,
          draft.seriesId,
          "draft",
          999,
          0,
          0,
          0,
          draft.summary,
          "<p>由商品链接导入助手创建的待审核草稿。请人工确认分类、材质、图片授权、正文文案和 SEO 后，再提交审核或发布。</p>",
          JSON.stringify(["待人工复核", "来源链接已记录", "默认不展示到前台", "默认不启用购买按钮"]),
          JSON.stringify([{ label: "导入状态", value: "待人工复核" }]),
          "材质、配置和规格信息请人工复核后填写。",
          "请人工补充清洁说明。",
          "请人工补充收纳说明。",
          "请人工补充隐私购买说明。",
          "导入草稿默认不发布、不索引、不显示购买按钮。",
          draft.imageAlt,
          JSON.stringify(draft.galleryJson),
          draft.seoTitle,
          draft.seoDescription,
          job.source_platform === "tmall" ? job.source_url : null,
          job.source_platform === "jd" ? job.source_url : null,
          0,
          0,
          0,
          0,
          0,
          now,
          now
        )
        .run();
    } else {
      const column = job.source_platform === "tmall" ? "tmall_url" : "jd_url";
      await db.prepare(`UPDATE products SET ${column} = ?, links_verified = 0, updated_at = ? WHERE id = ?`).bind(job.source_url, now, targetId).run();
    }

    await db
      .prepare(
        `INSERT INTO imported_product_sources
          (id, product_id, import_job_id, platform, source_url, source_product_id, source_title, source_shop_name, tmall_url, jd_url, last_checked_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(source_url) DO UPDATE SET
          product_id = excluded.product_id,
          import_job_id = excluded.import_job_id,
          source_title = excluded.source_title,
          source_shop_name = excluded.source_shop_name,
          tmall_url = excluded.tmall_url,
          jd_url = excluded.jd_url,
          last_checked_at = excluded.last_checked_at,
          updated_at = excluded.updated_at`
      )
      .bind(
        crypto.randomUUID(),
        targetId,
        job.id,
        job.source_platform,
        job.source_url,
        job.source_product_id,
        job.title_detected,
        job.source_shop_name,
        job.source_platform === "tmall" ? job.source_url : null,
        job.source_platform === "jd" ? job.source_url : null,
        now,
        now,
        now
      )
      .run();
    await db.prepare("UPDATE import_jobs SET status = 'imported', completed_at = ?, updated_at = ? WHERE id = ?").bind(now, now, job.id).run();
    await writeAuditLog({ request, actor: admin, action: "apply_import_job", entityType: "import_jobs", entityId: job.id, summary: targetId });
    return NextResponse.json({ product_id: targetId, status: "draft", visible_catalog: false, buy_button_enabled: false });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
