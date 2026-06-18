import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { getCmsDb } from "@/lib/cms/env";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ["super_admin", "editor"]);
    const db = getCmsDb();
    if (!db) {
      throw new Error("CMS_DB 未绑定。");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const inputSnapshot = {
      keyword: safeString(body.keyword),
      product_id: safeString(body.product_id),
      category_id: safeString(body.category_id),
      article_type: safeString(body.article_type),
      audience: safeString(body.audience),
      length: safeString(body.length),
      include_faq: body.include_faq === true,
      include_product_card: body.include_product_card === true,
      include_cta: body.include_cta === true
    };
    if (!inputSnapshot.keyword) {
      return NextResponse.json({ error: "请输入目标关键词。" }, { status: 400 });
    }

    const outputSnapshot = {
      title: `${inputSnapshot.keyword}选购与护理指南`,
      status: "draft",
      note: "CMS_AI_GENERATION_ENABLE 默认关闭，本接口仅保存待人工审核的生成任务草稿，不调用外部 AI，不自动发布。"
    };
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO seo_generation_jobs
          (id, target_type, target_id, generation_type, prompt_version, status, input_snapshot_json, output_snapshot_json, created_by, created_at, updated_at)
         VALUES (?, 'article', ?, 'article', 'disabled-v1', 'draft', ?, ?, ?, ?, ?)`
      )
      .bind(id, inputSnapshot.product_id || null, JSON.stringify(inputSnapshot), JSON.stringify(outputSnapshot), admin.id, now, now)
      .run();

    await writeAuditLog({
      request,
      actor: admin,
      action: "create_seo_generation_draft",
      entityType: "seo_generation_jobs",
      entityId: id,
      summary: "创建 AI/SEO 文章草稿生成任务"
    });

    return NextResponse.json({ id, status: "draft", input: inputSnapshot, output: outputSnapshot }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
