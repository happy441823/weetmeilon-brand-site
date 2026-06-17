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

test("publish jobs are not exposed as a writable navigation resource", () => {
  const allItems = adminNavigation.flatMap((group) => group.items);
  assert.equal(allItems.some((item) => item.resource === "publish_jobs"), false);

  const jobs = getResourceConfig("publish_jobs");
  assert.deepEqual(jobs.fields, []);
  assert.deepEqual(jobs.mutableRoles, ["super_admin"]);
  assert.deepEqual(jobs.listColumns, ["entity_type", "entity_id", "status", "run_at"]);
});
