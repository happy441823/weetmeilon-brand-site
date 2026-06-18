import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { deleteResourceItem, getResourceItem, setWorkflowStatus, updateResourceItem } from "@/lib/cms/db";
import { deleteRolesForResource, getResourceConfig, readRolesForResource, writeRolesForResource } from "@/lib/cms/schema";
import { assertWorkflowAction, sanitizeUpdatePayload } from "@/lib/cms/workflow";

type Params = { params: Promise<{ resource: string; id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { resource, id } = await params;
    const config = getResourceConfig(resource);
    if (!config) {
      return NextResponse.json({ error: "未知资源。" }, { status: 404 });
    }
    const admin = await requireRole(request, readRolesForResource(config));
    const item = await getResourceItem(resource, id, { hideSensitiveSettings: !admin.roles.includes("super_admin") });
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
    const admin = await requireRole(request, writeRolesForResource(config));
    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body._action === "string" ? body._action : "";
    let item;

    if (action) {
      const current = await getResourceItem(resource, id);
      if (!current) {
        return NextResponse.json({ error: "内容不存在。" }, { status: 404 });
      }
      const scheduledAt = typeof body.scheduled_at === "string" ? body.scheduled_at : null;
      const nextStatus = assertWorkflowAction({
        resource,
        action,
        roles: admin.roles,
        currentStatus: String(current.status || ""),
        scheduledAt
      });
      item = await setWorkflowStatus(resource, id, nextStatus, admin.id, { scheduledAt });
    } else {
        item = await updateResourceItem(resource, id, sanitizeUpdatePayload(body, resource), "更新内容", admin.id);
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
    const admin = await requireRole(request, deleteRolesForResource(config));
    const result = await deleteResourceItem(resource, id);
    await writeAuditLog({ request, actor: admin, action: "delete", entityType: resource, entityId: id, summary: `删除${config.label}` });
    return NextResponse.json(result);
  } catch (error) {
    return adminErrorResponse(error);
  }
}
