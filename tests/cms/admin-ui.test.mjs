import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildAdminSavePayload,
  getAdminJsonFieldError,
  getAdminJsonFormError,
  getAdminSlugFieldError,
  getAdminPagination,
  normalizeSpecRowsJson,
  normalizeStringArrayJson,
  pickDirtyAdminFields,
  resourceFromAdminPath,
  resourceItemKey,
  resourcePrimaryKey,
  stringifyAdminJson
} from "../../src/app/admin/AdminCmsClient.tsx";

test("admin UI reports product JSON field errors before saving", () => {
  assert.match(getAdminJsonFieldError("products", "gallery_json", "{ bad json"), /商品图集格式不正确/);
  assert.match(getAdminJsonFieldError("products", "specifications_json", '{"label":"not an array"}'), /规格说明格式不正确/);
  assert.equal(getAdminJsonFieldError("products", "gallery_json", '["https://example.com/a.jpg"]'), "");
  assert.equal(getAdminJsonFieldError("articles", "gallery_json", "{ bad json"), "");
});

test("admin UI validates only structured product JSON fields present in the save payload", () => {
  assert.equal(
    getAdminJsonFormError("products", {
      name: "Only changing a title"
    }),
    ""
  );
  assert.match(
    getAdminJsonFormError("products", {
      name: "New product",
      highlights_json: ["care"],
      specifications_json: "{ bad json"
    }),
    /规格说明格式不正确/
  );
});

test("admin UI blocks invalid product slugs before saving", () => {
  assert.match(getAdminSlugFieldError("products", { slug: "安心入门自动名器体验款" }), /Slug format is invalid/);
  assert.match(getAdminSlugFieldError("products", { slug: "Half Body" }), /Slug format is invalid/);
  assert.equal(getAdminSlugFieldError("products", { slug: "automatic-cup-974064324737" }), "");
  assert.equal(getAdminSlugFieldError("articles", { slug: "中文文章" }), "");
  assert.equal(getAdminSlugFieldError("products", { name: "Only changing a title" }), "");
});

test("product detail route remains dynamic for CMS slugs", () => {
  const source = readFileSync("src/app/products/[slug]/page.tsx", "utf8");
  assert.match(source, /export const dynamic = "force-dynamic"/);
  assert.match(source, /export const dynamicParams = true/);
  assert.doesNotMatch(source, /generateStaticParams\(/);
});

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
