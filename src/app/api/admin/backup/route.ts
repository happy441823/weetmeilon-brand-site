import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { buildRestorePlan, cmsRestoreConfirmationToken, restoreBackupPackage } from "@/lib/cms/backup";
import { exportBackup } from "@/lib/cms/db";
import { getCmsDb } from "@/lib/cms/env";

export async function GET(request: Request) {
  try {
    const admin = await requireRole(request, ["super_admin"]);
    const backup = await exportBackup();
    await writeAuditLog({ request, actor: admin, action: "export", entityType: "backup", summary: "导出 CMS 全量备份" });
    return NextResponse.json(backup, {
      headers: {
        "content-disposition": `attachment; filename="sweetmeilon-cms-backup-${new Date().toISOString().slice(0, 10)}.json"`
      }
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ["super_admin"]);
    const db = getCmsDb();
    if (!db) {
      throw new Error("CMS_DB 未绑定，无法恢复备份。");
    }

    const body = await request.json();
    const backup = body?.backup ?? body;
    const confirm = typeof body?.confirm === "string" ? body.confirm : "";
    const environment = typeof body?.environment === "string" ? body.environment : process.env.CF_PAGES_BRANCH || process.env.NODE_ENV;

    if (confirm !== cmsRestoreConfirmationToken) {
      const plan = await buildRestorePlan(db, backup);
      await writeAuditLog({
        request,
        actor: admin,
        action: "restore_preview",
        entityType: "backup",
        summary: "预览 CMS 备份恢复计划"
      });
      return NextResponse.json({
        mode: "preview",
        plan,
        message: `如需恢复到开发 D1，请再次提交 confirm=${cmsRestoreConfirmationToken}。`
      });
    }

    const result = await restoreBackupPackage(db, backup, { confirm, environment });
    await writeAuditLog({
      request,
      actor: admin,
      action: "restore",
      entityType: "backup",
      summary: "恢复 CMS 全量备份到开发 D1"
    });
    return NextResponse.json({ mode: "restored", result });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
