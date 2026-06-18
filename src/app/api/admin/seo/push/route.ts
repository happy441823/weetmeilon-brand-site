import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { getCmsDb } from "@/lib/cms/env";

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ["super_admin"]);
    const db = getCmsDb();
    if (!db) throw new Error("CMS_DB 未绑定。");
    const body = (await request.json()) as Record<string, unknown>;
    const url = typeof body.url === "string" ? body.url.trim() : "";
    if (!url.startsWith("https://sweetmeilon.com/")) {
      return NextResponse.json({ error: "只允许记录 sweetmeilon.com 站内 URL。" }, { status: 400 });
    }
    const provider = typeof body.provider === "string" ? body.provider : "indexnow";
    const eventType = typeof body.event_type === "string" ? body.event_type : "manual";
    const enabled = process.env.CMS_SEO_INDEXNOW_ENABLE === "true" && process.env.CMS_SEO_AUTO_SUBMIT === "true";
    const id = crypto.randomUUID();
    await db
      .prepare(
        `INSERT INTO seo_push_logs (id, url, event_type, provider, status, response_text, last_error)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        url,
        eventType,
        provider,
        enabled ? "queued" : "skipped",
        enabled ? null : "自动推送默认关闭，当前仅记录待提交 URL。",
        enabled ? null : "CMS_SEO_AUTO_SUBMIT=false"
      )
      .run();
    await writeAuditLog({ request, actor: admin, action: "record_seo_push_url", entityType: "seo_push_logs", entityId: id, summary: url });
    return NextResponse.json({ id, status: enabled ? "queued" : "skipped" }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
