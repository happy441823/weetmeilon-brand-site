import test from "node:test";
import assert from "node:assert/strict";
import { buildBootstrapAdminSql, buildBootstrapVerifySql } from "../../scripts/cms-bootstrap-admin.mjs";

test("bootstrap admin SQL creates one super admin by normalized email", () => {
  const sql = buildBootstrapAdminSql({ email: "Owner+CMS@Sweetmeilon.com", name: "Owner" });

  assert.match(sql, /INSERT INTO admin_users/);
  assert.match(sql, /owner\+cms@sweetmeilon\.com/);
  assert.match(sql, /role_super_admin/);
  assert.match(sql, /INSERT OR IGNORE INTO admin_user_roles/);
  assert.match(sql, /ON CONFLICT\(email\) DO UPDATE/);
});

test("bootstrap SQL escapes quotes and rejects invalid email", () => {
  const sql = buildBootstrapAdminSql({ email: "owner@example.com", name: "O'Connor" });
  assert.match(sql, /O''Connor/);
  assert.throws(() => buildBootstrapAdminSql({ email: "not-an-email" }), /valid --email/);
});

test("verify SQL is read-only", () => {
  const sql = buildBootstrapVerifySql("owner@example.com");
  assert.match(sql, /^SELECT /);
  assert.doesNotMatch(sql, /INSERT|UPDATE|DELETE/);
});
