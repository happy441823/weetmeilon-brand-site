import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { assignAdminRole, listAdminUserRoles, removeAdminRole } from "@/lib/cms/admin-users";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    await requireRole(request, ["super_admin"]);
    const { id } = await params;
    return NextResponse.json(await listAdminUserRoles(id));
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const admin = await requireRole(request, ["super_admin"]);
    const { id } = await params;
    const body = (await request.json()) as { role?: string };
    const result = await assignAdminRole(id, String(body.role || ""));
    await writeAuditLog({ request, actor: admin, action: "assign_role", entityType: "admin_users", entityId: id, summary: `Assign role ${body.role}` });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const admin = await requireRole(request, ["super_admin"]);
    const { id } = await params;
    const url = new URL(request.url);
    const role = url.searchParams.get("role") || "";
    const result = await removeAdminRole(id, role, admin);
    await writeAuditLog({ request, actor: admin, action: "remove_role", entityType: "admin_users", entityId: id, summary: `Remove role ${role}` });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
