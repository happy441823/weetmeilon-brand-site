import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildAdminSavePayload,
  getAdminPagination,
  normalizeSpecRowsJson,
  normalizeStringArrayJson,
  pickDirtyAdminFields,
  resourceFromAdminPath,
  resourceItemKey,
  resourcePrimaryKey,
  stringifyAdminJson
} from "../../src/app/admin/AdminCmsClient.tsx";

test("workflow resource save payload omits server-managed status fields", () => {
  const payload = buildAdminSavePayload("articles", {
    title: "Draft",
    status: "published",
    published_at: "2026-06-17T00:00:00.000Z",
    published_by: "attacker",
    reviewed_by: "attacker",
    scheduled_at: "2999-01-01T00:00:00.000Z",
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

test("admin edit payload can be limited to dirty fields", () => {
  const dirty = pickDirtyAdminFields(
    {
      name: "New product name",
      gallery_json: "not touched legacy text",
      seo_title: "New SEO title"
    },
    ["name", "seo_title"]
  );

  assert.deepEqual(dirty, {
    name: "New product name",
    seo_title: "New SEO title"
  });
});

test("admin UI uses resource primary key for site_settings", () => {
  const config = { primaryKey: "key" };
  const row = { key: "seo.default_title", id: "wrong-id" };
  assert.equal(resourcePrimaryKey(config), "key");
  assert.equal(resourceItemKey(row, config), "seo.default_title");
});

test("admin UI derives import and SEO resources from route path", () => {
  assert.equal(resourceFromAdminPath("/admin/imports"), "import_jobs");
  assert.equal(resourceFromAdminPath("/admin/imports/jobs"), "import_jobs");
  assert.equal(resourceFromAdminPath("/admin/seo/indexing"), "seo_push_logs");
});

test("admin root renders the product CMS without server redirect", () => {
  const source = readFileSync("src/app/admin/page.tsx", "utf8");
  assert.doesNotMatch(source, /redirect\(/);
  assert.match(source, /AdminCmsClient/);
  assert.match(source, /initialResource="products"/);
});

test("admin layout keeps the CMS shell static", () => {
  const source = readFileSync("src/app/admin/layout.tsx", "utf8");
  assert.doesNotMatch(source, /force-dynamic/);
  assert.match(source, /force-static/);
});

test("admin UI paginates long resource lists", () => {
  assert.deepEqual(getAdminPagination(43, 2, 20), {
    currentPage: 2,
    pageCount: 3,
    startIndex: 20,
    endIndex: 40,
    pageSize: 20
  });

  assert.deepEqual(getAdminPagination(43, 99, 20), {
    currentPage: 3,
    pageCount: 3,
    startIndex: 40,
    endIndex: 43,
    pageSize: 20
  });

  assert.deepEqual(getAdminPagination(0, 3, 20), {
    currentPage: 1,
    pageCount: 1,
    startIndex: 0,
    endIndex: 0,
    pageSize: 20
  });
});

test("admin UI normalizes product string array JSON fields", () => {
  assert.deepEqual(normalizeStringArrayJson('["one","two"]'), ["one", "two"]);
  assert.deepEqual(normalizeStringArrayJson(["one", 2]), ["one", "2"]);
  assert.deepEqual(normalizeStringArrayJson(""), []);
  assert.equal(normalizeStringArrayJson("{ bad json"), null);
  assert.equal(normalizeStringArrayJson('{"label":"not an array"}'), null);
});

test("admin UI normalizes product specification JSON rows", () => {
  assert.deepEqual(normalizeSpecRowsJson('[{"label":"材质","value":"以官方页面为准"}]'), [
    { label: "材质", value: "以官方页面为准" }
  ]);
  assert.deepEqual(normalizeSpecRowsJson(["护理说明"]), [{ label: "", value: "护理说明" }]);
  assert.deepEqual(normalizeSpecRowsJson(""), []);
  assert.equal(normalizeSpecRowsJson("{ bad json"), null);
  assert.equal(normalizeSpecRowsJson('{"label":"not an array"}'), null);
});

test("admin UI writes structured JSON with stable formatting", () => {
  assert.equal(stringifyAdminJson(["清洁收纳", "官方渠道"]), '[\n  "清洁收纳",\n  "官方渠道"\n]');
});
