import test from "node:test";
import assert from "node:assert/strict";
import {
  publicD1Enabled,
  publicVisibilityWhere,
  readPublicCmsRows
} from "../../src/lib/cms/public-content.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

test("public D1 reads are feature flagged", () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "false";
  assert.equal(publicD1Enabled(), false);
  process.env.CMS_PUBLIC_D1_READS = "true";
  assert.equal(publicD1Enabled(), true);
  process.env.CMS_PUBLIC_D1_READS = old;
});

test("public visibility where clause excludes drafts, pending review, offline, archived and future scheduled content", () => {
  const articleWhere = publicVisibilityWhere("articles");
  assert.match(articleWhere, /status IN \('published'\)/);
  assert.match(articleWhere, /published_at IS NULL OR published_at <= \?/);
  assert.match(articleWhere, /scheduled_at IS NULL OR scheduled_at <= \?/);
  assert.doesNotMatch(articleWhere, /draft|pending_review|offline|archived/);

  const productWhere = publicVisibilityWhere("products");
  assert.match(productWhere, /'published'/);
  assert.match(productWhere, /'coming_soon'/);
});

test("public D1 read returns fallback safely when disabled, unbound, or query fails", async () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "false";
  assert.deepEqual(await readPublicCmsRows("articles"), { rows: [], dbReady: false, source: "fallback", fallbackReason: "feature_disabled" });

  process.env.CMS_PUBLIC_D1_READS = "true";
  setCmsBindingsForTest(null);
  assert.deepEqual(await readPublicCmsRows("articles"), { rows: [], dbReady: false, source: "fallback", fallbackReason: "unbound" });

  setCmsBindingsForTest({
    CMS_DB: {
      prepare() {
        throw new Error("raw database error");
      }
    }
  });
  assert.deepEqual(await readPublicCmsRows("articles"), { rows: [], dbReady: false, source: "fallback", fallbackReason: "query_error" });
  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = old;
});

test("public D1 read binds current time and returns rows", async () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  const calls = [];
  setCmsBindingsForTest({
    CMS_DB: {
      prepare(sql) {
        calls.push({ sql, values: [] });
        return {
          bind(...values) {
            calls.at(-1).values = values;
            return this;
          },
          async all() {
            return { results: [{ slug: "published", status: "published" }], success: true, meta: {} };
          }
        };
      }
    }
  });

  const result = await readPublicCmsRows("articles", { now: new Date("2026-06-17T00:00:00.000Z") });
  assert.equal(result.source, "d1");
  assert.equal(result.rows[0].slug, "published");
  assert.match(calls[0].sql, /FROM "articles"/);
  assert.deepEqual(calls[0].values, ["2026-06-17T00:00:00.000Z", "2026-06-17T00:00:00.000Z"]);

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = old;
});

test("public D1 reads use sort_order for ordered resources", async () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  const calls = [];
  setCmsBindingsForTest({
    CMS_DB: {
      prepare(sql) {
        calls.push(sql);
        return {
          bind() {
            return this;
          },
          async all() {
            return { results: [], success: true, meta: {} };
          }
        };
      }
    }
  });

  await readPublicCmsRows("products");
  await readPublicCmsRows("navigation_items");
  assert.match(calls[0], /ORDER BY sort_order ASC, updated_at DESC/);
  assert.match(calls[1], /ORDER BY sort_order ASC, updated_at DESC/);

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = old;
});
