import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { setAdminUserActive } from "@/lib/cms/admin-users";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const admin = await requireRole(request, ["super_admin"]);
    const { id } = await params;
    const body = (await request.json()) as { is_active?: boolean };
    const result = await setAdminUserActive(id, Boolean(body.is_active), admin);
    await writeAuditLog({
      request,
      actor: admin,
      action: body.is_active ? "enable_admin" : "disable_admin",
      entityType: "admin_users",
      entityId: id,
      summary: body.is_active ? "Enable administrator" : "Disable administrator"
    });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
