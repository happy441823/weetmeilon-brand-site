import test from "node:test";
import assert from "node:assert/strict";
import { adminNavigation, getResourceConfig } from "../../src/lib/cms/schema.ts";

test("admin users and roles are super admin managed resources", () => {
  const users = getResourceConfig("admin_users");
  const roles = getResourceConfig("admin_roles");

  assert.deepEqual(users.mutableRoles, ["super_admin"]);
  assert.deepEqual(roles.mutableRoles, ["super_admin"]);
  assert.equal(users.fields.some((field) => field.name === "email"), true);
  assert.equal(roles.fields.some((field) => field.name === "permissions_json"), true);
});

test("admin navigation exposes administrator management", () => {
  const system = adminNavigation.find((group) => group.group === "系统");
  assert.ok(system);
  assert.equal(system.items.some((item) => item.resource === "admin_users"), true);
  assert.equal(system.items.some((item) => item.resource === "admin_roles"), true);
});
