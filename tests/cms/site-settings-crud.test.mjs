import test from "node:test";
import assert from "node:assert/strict";
import {
  createResourceItem,
  deleteResourceItem,
  getResourceItem,
  listResource,
  updateResourceItem
} from "../../src/lib/cms/db.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

class SiteSettingsD1 {
  rows = new Map();

  prepare(sql) {
    const db = this;
    return {
      values: [],
      bind(...values) {
        this.values = values;
        return this;
      },
      async run() {
        const values = this.values;
        if (/INSERT INTO "site_settings"/.test(sql)) {
          db.rows.set(values[0], {
            key: values[0],
            value_json: values[1],
            setting_group: values[2],
            is_sensitive: values[3],
            created_at: values[4],
            updated_at: values[5]
          });
        } else if (/UPDATE "site_settings"/.test(sql)) {
          const key = values.at(-1);
          const row = db.rows.get(key);
          assert.ok(row, "row should exist before update");
          row.value_json = values[0];
          row.updated_at = values.at(-2);
        } else if (/DELETE FROM "site_settings"/.test(sql)) {
          db.rows.delete(values[0]);
        } else if (/INSERT INTO .*_revisions/.test(sql)) {
          return { success: true, meta: {} };
        } else {
          throw new Error(`Unexpected SQL: ${sql}`);
        }
        return { success: true, meta: {} };
      },
      async first() {
        if (/SELECT COUNT\(\*\) AS total FROM "site_settings"/.test(sql)) {
          return { total: db.rows.size };
        }
        if (/SELECT \* FROM "site_settings" WHERE "key" = \?/.test(sql)) {
          return db.rows.get(this.values[0]) || null;
        }
        return null;
      },
      async all() {
        if (/SELECT \* FROM "site_settings"/.test(sql)) {
          return { results: [...db.rows.values()], success: true, meta: {} };
        }
        return { results: [], success: true, meta: {} };
      }
    };
  }
}

test("site_settings CRUD uses key as primary key", async () => {
  const db = new SiteSettingsD1();
  setCmsBindingsForTest({ CMS_DB: db });
  try {
    const created = await createResourceItem("site_settings", {
      key: "seo.defaults",
      value_json: { title: "SWEETMEILON" },
      setting_group: "seo",
      is_sensitive: false
    });
    assert.equal(created.key, "seo.defaults");
    assert.equal(created.value_json, "{\"title\":\"SWEETMEILON\"}");

    const found = await getResourceItem("site_settings", "seo.defaults");
    assert.equal(found.setting_group, "seo");

    const updated = await updateResourceItem("site_settings", "seo.defaults", {
      value_json: { title: "SWEETMEILON CMS" }
    });
    assert.equal(updated.value_json, "{\"title\":\"SWEETMEILON CMS\"}");

    await deleteResourceItem("site_settings", "seo.defaults");
    assert.equal(await getResourceItem("site_settings", "seo.defaults"), null);
  } finally {
    setCmsBindingsForTest(null);
  }
});

test("site_settings hides sensitive values from non super admin reads", async () => {
  const db = new SiteSettingsD1();
  db.rows.set("cms.secret", {
    key: "cms.secret",
    value_json: "\"hidden\"",
    setting_group: "cms",
    is_sensitive: 1,
    created_at: "2026-06-17T00:00:00.000Z",
    updated_at: "2026-06-17T00:00:00.000Z"
  });
  setCmsBindingsForTest({ CMS_DB: db });
  try {
    const item = await getResourceItem("site_settings", "cms.secret", { hideSensitiveSettings: true });
    assert.equal(item.value_json, null);
    assert.equal(item.redacted, true);

    const list = await listResource("site_settings", { hideSensitiveSettings: true });
    assert.equal(list.rows[0].value_json, null);
    assert.equal(list.rows[0].redacted, true);
  } finally {
    setCmsBindingsForTest(null);
  }
});
