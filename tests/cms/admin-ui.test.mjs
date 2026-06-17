import test from "node:test";
import assert from "node:assert/strict";
import { buildAdminSavePayload, resourceItemKey, resourcePrimaryKey } from "../../src/app/admin/AdminCmsClient.tsx";

test("workflow resource save payload omits server-managed status fields", () => {
  const payload = buildAdminSavePayload("articles", {
    title: "Draft",
    status: "published",
    published_at: "2026-06-17T00:00:00.000Z",
    published_by: "attacker",
    reviewed_by: "attacker",
    first_published_at: "2026-06-17T00:00:00.000Z",
    last_published_by: "attacker",
    body_html: "<p>safe</p>"
  });
  assert.deepEqual(payload, { title: "Draft", body_html: "<p>safe</p>" });
});

test("non-workflow resource save payload keeps normal fields", () => {
  assert.deepEqual(buildAdminSavePayload("site_settings", { key: "seo.default_title", value_json: '"A"' }), {
    key: "seo.default_title",
    value_json: '"A"'
  });
});

test("admin UI uses resource primary key for site_settings", () => {
  const config = { primaryKey: "key" };
  const row = { key: "seo.default_title", id: "wrong-id" };
  assert.equal(resourcePrimaryKey(config), "key");
  assert.equal(resourceItemKey(row, config), "seo.default_title");
});
