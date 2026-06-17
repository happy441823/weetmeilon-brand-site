import { getCmsDb } from "./env";
import type { AdminContext } from "./auth";
import type { CmsRole } from "./schema";

export class AdminUserError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const assignableRoles: CmsRole[] = ["editor", "reviewer", "viewer", "super_admin"];

export function roleId(role: CmsRole) {
  return `role_${role}`;
}

export function assertAssignableRole(role: string): asserts role is CmsRole {
  if (!assignableRoles.includes(role as CmsRole)) {
    throw new AdminUserError("未知管理员角色。", 400);
  }
}

async function activeSuperAdminCount(excludingUserId?: string) {
  const db = getCmsDb();
  if (!db) throw new AdminUserError("CMS_DB 未绑定。", 503);
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total
       FROM admin_users u
       INNER JOIN admin_user_roles ur ON ur.user_id = u.id
       INNER JOIN admin_roles r ON r.id = ur.role_id
       WHERE u.is_active = 1 AND r.name = 'super_admin' AND (? IS NULL OR u.id != ?)`
    )
    .bind(excludingUserId || null, excludingUserId || null)
    .first<{ total: number }>();
  return row?.total || 0;
}

export async function listAdminUserRoles(userId: string) {
  const db = getCmsDb();
  if (!db) throw new AdminUserError("CMS_DB 未绑定。", 503);
  const user = await db.prepare("SELECT id, email, name, is_active FROM admin_users WHERE id = ?").bind(userId).first();
  if (!user) throw new AdminUserError("管理员不存在。", 404);
  const roles = await db
    .prepare(
      `SELECT r.name
       FROM admin_roles r
       INNER JOIN admin_user_roles ur ON ur.role_id = r.id
       WHERE ur.user_id = ?
       ORDER BY r.name`
    )
    .bind(userId)
    .all<{ name: CmsRole }>();
  return { user, roles: roles.results.map((row) => row.name), assignableRoles };
}

export async function assignAdminRole(userId: string, role: string) {
  assertAssignableRole(role);
  const db = getCmsDb();
  if (!db) throw new AdminUserError("CMS_DB 未绑定。", 503);
  const now = new Date().toISOString();
  const user = await db.prepare("SELECT id FROM admin_users WHERE id = ?").bind(userId).first();
  if (!user) throw new AdminUserError("管理员不存在。", 404);
  await db
    .prepare("INSERT OR IGNORE INTO admin_user_roles (user_id, role_id, created_at, updated_at) VALUES (?, ?, ?, ?)")
    .bind(userId, roleId(role), now, now)
    .run();
  return listAdminUserRoles(userId);
}

export async function removeAdminRole(userId: string, role: string, actor: AdminContext) {
  assertAssignableRole(role);
  const db = getCmsDb();
  if (!db) throw new AdminUserError("CMS_DB 未绑定。", 503);
  if (role === "super_admin") {
    if ((await activeSuperAdminCount(userId)) < 1) {
      throw new AdminUserError("不能移除最后一个 super_admin。", 409);
    }
    if (actor.id === userId && actor.roles.filter((entry) => entry === "super_admin").length === 1) {
      throw new AdminUserError("当前用户不能移除自己的最后一个 super_admin。", 409);
    }
  }
  await db.prepare("DELETE FROM admin_user_roles WHERE user_id = ? AND role_id = ?").bind(userId, roleId(role)).run();
  return listAdminUserRoles(userId);
}

export async function setAdminUserActive(userId: string, isActive: boolean, actor: AdminContext) {
  const db = getCmsDb();
  if (!db) throw new AdminUserError("CMS_DB 未绑定。", 503);
  const user = await db.prepare("SELECT id FROM admin_users WHERE id = ?").bind(userId).first();
  if (!user) throw new AdminUserError("管理员不存在。", 404);
  if (!isActive) {
    const roles = await listAdminUserRoles(userId);
    if (roles.roles.includes("super_admin") && (await activeSuperAdminCount(userId)) < 1) {
      throw new AdminUserError("不能禁用最后一个 super_admin。", 409);
    }
    if (actor.id === userId && actor.roles.includes("super_admin") && (await activeSuperAdminCount(userId)) < 1) {
      throw new AdminUserError("当前用户不能禁用自己的最后一个 super_admin。", 409);
    }
  }
  await db.prepare("UPDATE admin_users SET is_active = ?, updated_at = ? WHERE id = ?").bind(isActive ? 1 : 0, new Date().toISOString(), userId).run();
  return listAdminUserRoles(userId);
}
