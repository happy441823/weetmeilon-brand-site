import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { deleteResourceItem, getResourceItem, setWorkflowStatus, updateResourceItem } from "@/lib/cms/db";
import { getResourceConfig } from "@/lib/cms/schema";

type Params = { params: Promise<{ resource: string; id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { resource, id } = await params;
    const item = await getResourceItem(resource, id);
    if (!item) {
      return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { resource, id } = await params;
    const config = getResourceConfig(resource);
    if (!config) {
      return NextResponse.json({ error: "未知资源。" }, { status: 404 });
    }
    const admin = await requireRole(request, config.mutableRoles);
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body._action === "string" ? body._action : "";
    let item;

    if (action === "submit_review") {
      item = await setWorkflowStatus(resource, id, "pending_review", admin.id);
    } else if (action === "publish") {
      await requireRole(request, ["super_admin", "reviewer"]);
      item = await setWorkflowStatus(resource, id, "published", admin.id);
    } else if (action === "offline") {
      await requireRole(request, ["super_admin", "reviewer"]);
      item = await setWorkflowStatus(resource, id, "offline", admin.id);
    } else {
      item = await updateResourceItem(resource, id, body);
    }

    await writeAuditLog({ request, actor: admin, action: action || "update", entityType: resource, entityId: id, summary: `更新${config.label}` });
    return NextResponse.json({ item });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { resource, id } = await params;
    const config = getResourceConfig(resource);
    if (!config) {
      return NextResponse.json({ error: "未知资源。" }, { status: 404 });
    }
    const admin = await requireRole(request, ["super_admin"]);
    const result = await deleteResourceItem(resource, id);
    await writeAuditLog({ request, actor: admin, action: "delete", entityType: resource, entityId: id, summary: `删除${config.label}` });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
