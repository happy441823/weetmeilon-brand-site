import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { getCmsDb } from "@/lib/cms/env";
import { slugify } from "@/lib/cms/validation";

type Params = { params: Promise<{ id: string }> };

function productNameFromJob(job: { title_detected: string | null; source_product_id: string | null }) {
  return (job.title_detected || `Imported product ${job.source_product_id || ""}`).trim();
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
        `SELECT id, source_platform, source_url, source_product_id, source_shop_name, title_detected, status, authorized
         FROM import_jobs WHERE id = ?`
      )
      .bind(id)
      .first<{
        id: string;
        source_platform: "tmall" | "jd" | "unknown";
        source_url: string;
        source_product_id: string | null;
        source_shop_name: string | null;
        title_detected: string | null;
        status: string;
        authorized: number;
      }>();
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
    const name = productNameFromJob(job);
    if (!targetId) {
      targetId = crypto.randomUUID();
      await db
        .prepare(
          `INSERT INTO products
            (id, name, slug, status, summary, tmall_url, jd_url, tmall_enabled, jd_enabled, buy_button_enabled, links_verified, created_at, updated_at)
           VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, 1, 1, ?, ?)`
        )
        .bind(
          targetId,
          name,
          slugify(`${name}-${job.source_product_id || targetId.slice(0, 8)}`),
          "由智能导入插件创建的 draft 商品，请人工补充详情、图片授权和 SEO 后再提交审核。",
          job.source_platform === "tmall" ? job.source_url : null,
          job.source_platform === "jd" ? job.source_url : null,
          job.source_platform === "tmall" ? 1 : 0,
          job.source_platform === "jd" ? 1 : 0,
          now,
          now
        )
        .run();
    } else {
      const column = job.source_platform === "tmall" ? "tmall_url" : "jd_url";
      const enabledColumn = job.source_platform === "tmall" ? "tmall_enabled" : "jd_enabled";
      await db.prepare(`UPDATE products SET ${column} = ?, ${enabledColumn} = 1, links_verified = 1, updated_at = ? WHERE id = ?`).bind(job.source_url, now, targetId).run();
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
    return NextResponse.json({ product_id: targetId, status: "draft" });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
