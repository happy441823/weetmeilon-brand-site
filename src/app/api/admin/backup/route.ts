import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { exportBackup } from "@/lib/cms/db";

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
