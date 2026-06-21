import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { adminNavigation, deleteRolesForResource, getResourceConfig, readRolesForResource, writeRolesForResource } from "../../src/lib/cms/schema.ts";

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
  assert.deepEqual(readRolesForResource(jobs), ["super_admin", "reviewer"]);
  assert.deepEqual(writeRolesForResource(jobs), []);
  assert.deepEqual(deleteRolesForResource(jobs), []);
  assert.deepEqual(jobs.listColumns, ["entity_type", "entity_id", "status", "run_at"]);
});

test("product resource exposes dedicated CMS fields and scheduled workflow status", () => {
  const products = getResourceConfig("products");
  const fieldNames = products.fields.map((field) => field.name);
  for (const name of [
    "primary_category_id",
    "subcategory_id",
    "series_id",
    "sort_order",
    "highlights_json",
    "concerns_json",
    "material_notes",
    "specifications_json",
    "package_list",
    "care_notes",
    "storage_notes",
    "privacy_notes",
    "usage_tips",
    "compliance_notes",
    "cover_media_id",
    "hero_media_id",
    "og_media_id",
    "gallery_json"
  ]) {
    assert.equal(fieldNames.includes(name), true, `${name} should be editable in product CMS`);
  }
  const status = products.fields.find((field) => field.name === "status");
  assert.equal(status.options.some((option) => option.value === "scheduled"), true);
});

test("product admin list can locate frontend cards by product id", () => {
  const products = getResourceConfig("products");
  assert.equal(products.searchable.includes("id"), true);
  assert.equal(products.listColumns.includes("id"), true);
});

test("product editor lookup dropdowns hide inactive taxonomy options", () => {
  const source = readFileSync("src/app/admin/AdminCmsClient.tsx", "utf8");

  assert.match(source, /activeCategories\s*=\s*lookups\.categories\.filter\(\(category\)\s*=>\s*category\.is_active\s*!==\s*0\)/);
  assert.match(source, /activeSeries\s*=\s*lookups\.series\.filter\(\(series\)\s*=>\s*series\.is_active\s*!==\s*0\)/);
  assert.match(source, /ensureCurrentOption\(activeSeries,\s*lookups\.series/);
});

test("sensitive admin resources require super admin read access", () => {
  assert.deepEqual(readRolesForResource(getResourceConfig("admin_users")), ["super_admin"]);
  assert.deepEqual(readRolesForResource(getResourceConfig("admin_roles")), ["super_admin"]);
  assert.deepEqual(readRolesForResource(getResourceConfig("audit_logs")), ["super_admin"]);
  assert.deepEqual(writeRolesForResource(getResourceConfig("site_settings")), ["super_admin"]);
  assert.deepEqual(deleteRolesForResource(getResourceConfig("site_settings")), ["super_admin"]);
});
