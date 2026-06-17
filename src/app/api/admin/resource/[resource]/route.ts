import { NextResponse } from "next/server";
import { adminErrorResponse, requireAdmin, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { createResourceItem, listResource } from "@/lib/cms/db";
import { getResourceConfig } from "@/lib/cms/schema";

type Params = { params: Promise<{ resource: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    await requireAdmin(request);
    const { resource } = await params;
    const url = new URL(request.url);
    const data = await listResource(resource, {
      q: url.searchParams.get("q") || undefined,
      status: url.searchParams.get("status") || undefined,
      page: Number(url.searchParams.get("page") || 1),
      pageSize: Number(url.searchParams.get("pageSize") || 20)
    });
    return NextResponse.json(data);
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { resource } = await params;
    const config = getResourceConfig(resource);
    if (!config) {
      return NextResponse.json({ error: "未知资源。" }, { status: 404 });
    }
    const admin = await requireRole(request, config.mutableRoles);
    const body = (await request.json()) as Record<string, unknown>;
    const item = await createResourceItem(resource, body);
    await writeAuditLog({ request, actor: admin, action: "create", entityType: resource, entityId: String(item?.id || ""), summary: `创建${config.label}` });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
