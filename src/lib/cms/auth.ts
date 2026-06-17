import { NextResponse } from "next/server";
import { getCmsDb } from "./env";
import { getLocalAdminEmail, highestCmsRole, verifyCloudflareAccessJwt } from "./auth-core";
import type { CmsRole } from "./schema";

export type AdminContext = {
  id: string;
  email: string;
  name: string;
  roles: CmsRole[];
};

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  return NextResponse.json({ error: "后台服务暂时不可用，请稍后重试。" }, { status: 500 });
}

function header(request: Request, name: string) {
  return request.headers.get(name) || request.headers.get(name.toLowerCase()) || "";
}

function accessJwtConfig() {
  const audience = process.env.CF_ACCESS_AUDIENCE || process.env.CLOUDFLARE_ACCESS_AUDIENCE || "";
  const issuer =
    process.env.CF_ACCESS_ISSUER ||
    (process.env.CF_ACCESS_TEAM_DOMAIN ? `https://${process.env.CF_ACCESS_TEAM_DOMAIN}` : "");

  return {
    audience,
    issuer: issuer.replace(/\/$/, ""),
    jwksUrl: process.env.CF_ACCESS_JWKS_URL
  };
}

function localAdminEmailForRequest(request: Request) {
  return getLocalAdminEmail({
    allowLocalAdmin: process.env.CMS_ALLOW_LOCAL_ADMIN,
    localAdminEmail: process.env.CMS_LOCAL_ADMIN_EMAIL,
    nodeEnv: process.env.NODE_ENV,
    requestUrl: request.url
  });
}

export async function getAccessEmail(request: Request) {
  const localEmail = localAdminEmailForRequest(request);
  if (localEmail) {
    return localEmail;
  }

  const token = header(request, "cf-access-jwt-assertion");
  const config = accessJwtConfig();
  if (!token) {
    throw new AdminAuthError("未通过 Cloudflare Access 验证，无法进入后台。", 401);
  }
  if (!config.audience || !config.issuer) {
    throw new AdminAuthError("Cloudflare Access audience/issuer 尚未配置，后台已拒绝请求。", 503);
  }

  try {
    const result = await verifyCloudflareAccessJwt(token, config);
    return result.email;
  } catch {
    throw new AdminAuthError("Cloudflare Access JWT 验证失败，无法进入后台。", 401);
  }
}

export async function getCurrentAdmin(request: Request): Promise<AdminContext> {
  const effectiveEmail = await getAccessEmail(request);
  const allowLocal = Boolean(localAdminEmailForRequest(request));

  const db = getCmsDb();
  if (!db) {
    if (!allowLocal) {
      throw new AdminAuthError("CMS_DB 未绑定，后台无法连接 D1。", 503);
    }

    return {
      id: "local-admin",
      email: effectiveEmail,
      name: "本地开发管理员",
      roles: ["super_admin"]
    };
  }

  const id = `admin_${effectiveEmail.replace(/[^a-z0-9]+/g, "_")}`;
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO admin_users (id, email, name, last_login_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET last_login_at = excluded.last_login_at, updated_at = excluded.updated_at`
    )
    .bind(id, effectiveEmail, effectiveEmail, now, now, now)
    .run();

  const roleRows = await db
    .prepare(
      `SELECT r.name FROM admin_roles r
       INNER JOIN admin_user_roles ur ON ur.role_id = r.id
       INNER JOIN admin_users u ON u.id = ur.user_id
       WHERE u.email = ? AND u.is_active = 1`
    )
    .bind(effectiveEmail)
    .all<{ name: CmsRole }>();

  const roles = roleRows.results.map((row: { name: CmsRole }) => row.name);
  if (roles.length === 0 && allowLocal) {
    roles.push("super_admin");
  }

  if (roles.length === 0) {
    throw new AdminAuthError("你的邮箱已通过 Access，但尚未分配后台角色。", 403);
  }

  return {
    id,
    email: effectiveEmail,
    name: effectiveEmail,
    roles
  };
}

export async function requireAdmin(request: Request) {
  return getCurrentAdmin(request);
}

export function hasRole(admin: AdminContext, roles: CmsRole[]) {
  if (admin.roles.includes("super_admin")) {
    return true;
  }

  return roles.some((role) => admin.roles.includes(role));
}

export async function requireRole(request: Request, roles: CmsRole[]) {
  const admin = await requireAdmin(request);
  if (!hasRole(admin, roles)) {
    throw new AdminAuthError("当前角色没有执行该操作的权限。", 403);
  }
  return admin;
}

export function highestRole(admin: AdminContext) {
  return highestCmsRole(admin.roles);
}

export async function writeAuditLog(input: {
  request: Request;
  actor: AdminContext;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string;
  success?: boolean;
}) {
  const db = getCmsDb();
  if (!db) {
    return;
  }

  await db
    .prepare(
      `INSERT INTO audit_logs (id, actor_id, actor_email, action, entity_type, entity_id, request_id, ip, summary, success)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      input.actor.id,
      input.actor.email,
      input.action,
      input.entityType,
      input.entityId || null,
      input.request.headers.get("cf-ray") || input.request.headers.get("x-request-id") || null,
      input.request.headers.get("cf-connecting-ip") || input.request.headers.get("x-forwarded-for") || null,
      input.summary || null,
      input.success === false ? 0 : 1
    )
    .run();
}
