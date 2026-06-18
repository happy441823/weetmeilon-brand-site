import test from "node:test";
import assert from "node:assert/strict";
import { deleteResourceItem, syncMediaUsages } from "../../src/lib/cms/db.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

function createMediaDb({ usageCount = 0 } = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async first() {
          if (/COUNT\(\*\) AS total FROM media_usages/.test(sql)) return { total: usageCount };
          if (/SELECT r2_key FROM media_assets/.test(sql)) return { r2_key: "products/demo/image.png" };
          return null;
        },
        async run() {
          calls.push({ sql, values: this.values });
          return { success: true, meta: { changes: 1 } };
        }
      };
    }
  };
}

test("media delete refuses referenced asset", async () => {
  const db = createMediaDb({ usageCount: 1 });
  const deleted = [];
  setCmsBindingsForTest({ CMS_DB: db, CMS_MEDIA: { delete: async (key) => deleted.push(key) } });
  await assert.rejects(() => deleteResourceItem("media_assets", "media_1"), /引用/);
  assert.deepEqual(deleted, []);
  setCmsBindingsForTest(null);
});

test("media delete removes R2 object before D1 record", async () => {
  const db = createMediaDb({ usageCount: 0 });
  const deleted = [];
  setCmsBindingsForTest({ CMS_DB: db, CMS_MEDIA: { delete: async (key) => deleted.push(key) } });
  await deleteResourceItem("media_assets", "media_1");
  assert.deepEqual(deleted, ["products/demo/image.png"]);
  assert.equal(db.calls.some((call) => /DELETE FROM "media_assets"/.test(call.sql)), true);
  setCmsBindingsForTest(null);
});

test("media usages only scan explicit media fields and structured blocks", async () => {
  const calls = [];
  const db = {
    prepare(sql) {
      return {
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async run() {
          calls.push({ sql, values: this.values });
          return { success: true, meta: { changes: 1 } };
        }
      };
    }
  };
  setCmsBindingsForTest({ CMS_DB: db });

  await syncMediaUsages("products", "p1", {
    cover_media_id: "media_cover",
    summary: "this uuid-like string 123e4567-e89b-12d3-a456-426614174000 is not media",
    content_blocks_json: JSON.stringify([{ type: "image", media_id: "media_block", caption: "x" }])
  });

  const inserts = calls.filter((call) => /INSERT OR IGNORE INTO media_usages/.test(call.sql));
  assert.equal(inserts.length, 2);
  assert.deepEqual(inserts.map((call) => call.values[1]).sort(), ["media_block", "media_cover"]);
  assert.deepEqual(inserts.map((call) => call.values[4]).sort(), ["content_blocks_json", "cover_media_id"]);

  setCmsBindingsForTest(null);
});
