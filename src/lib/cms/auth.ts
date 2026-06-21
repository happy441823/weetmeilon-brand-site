import { NextResponse } from "next/server";
import { getCmsDb } from "./env";
import { getLocalAdminEmail, highestCmsRole, verifyCloudflareAccessJwt } from "./auth-core";
import { CmsError } from "./errors";
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
  if (error instanceof CmsError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof AdminAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error && "status" in error && typeof error.status === "number") {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  if (error instanceof Error) {
    const message = error.message || "";
    if (/UNIQUE constraint failed: products\.slug/i.test(message)) {
      return NextResponse.json({ error: "Slug 已被其他商品使用，请换一个唯一的 Slug。" }, { status: 409 });
    }
    if (/FOREIGN KEY constraint failed/i.test(message)) {
      return NextResponse.json({ error: "关联的分类、系列或素材不存在，请重新选择后保存。" }, { status: 400 });
    }
    if (/CHECK constraint failed/i.test(message)) {
      return NextResponse.json({ error: "字段值不符合数据库约束，请检查状态、分类或开关字段后再保存。" }, { status: 400 });
    }
    if (/NOT NULL constraint failed/i.test(message)) {
      return NextResponse.json({ error: "必填字段缺失，请补全后再保存。" }, { status: 400 });
    }
    if (/Unexpected (token|end)|JSON/i.test(message)) {
      return NextResponse.json({ error: "JSON 字段格式不正确，请检查商品图集、亮点、规格等 JSON 内容。" }, { status: 400 });
    }
    console.error("[cms-admin]", message);
    return NextResponse.json({ error: `后台保存失败：${safeAdminErrorMessage(message)}` }, { status: 500 });
  }

  return NextResponse.json({ error: "后台服务暂时不可用，请稍后重试。" }, { status: 500 });
}

function safeAdminErrorMessage(message: string) {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]")
    .replace(/(token|cookie|password|secret|key)=([^&\s]+)/gi, "$1=[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 240);
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

  const now = new Date().toISOString();
  const newId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO admin_users (id, email, name, last_login_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET last_login_at = excluded.last_login_at, updated_at = excluded.updated_at`
    )
    .bind(newId, effectiveEmail, effectiveEmail, now, now, now)
    .run();

  const user = await db.prepare("SELECT id, email, name FROM admin_users WHERE email = ?").bind(effectiveEmail).first<{ id: string; email: string; name: string }>();
  if (!user) {
    throw new AdminAuthError("管理员账号写入后无法读取，请检查 D1。", 503);
  }

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
    id: user.id,
    email: user.email,
    name: user.name || user.email,
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

  try {
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
  } catch (error) {
    console.error("[cms-audit-log]", error instanceof Error ? error.message : error);
  }
}
