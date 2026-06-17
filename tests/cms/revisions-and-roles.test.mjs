import test from "node:test";
import assert from "node:assert/strict";
import { createRevisionIfNeeded, deleteResourceItem, updateResourceItem } from "../../src/lib/cms/db.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

test("system roles cannot be edited or deleted through generic CRUD", async () => {
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (/SELECT id, name FROM admin_roles/.test(sql)) return { id: values[0], name: "editor" };
              return null;
            },
            async run() {
              throw new Error(`Unexpected write: ${sql}`);
            }
          };
        }
      };
    }
  };
  setCmsBindingsForTest({ CMS_DB: db });
  try {
    await assert.rejects(() => updateResourceItem("admin_roles", "role_editor", { description: "x" }), /系统内置角色/);
    await assert.rejects(() => deleteResourceItem("admin_roles", "role_editor"), /系统内置角色/);
  } finally {
    setCmsBindingsForTest(null);
  }
});

test("content revisions persist the real actor id", async () => {
  const writes = [];
  const db = {
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async first() {
              if (/SELECT \* FROM "products" WHERE id = \?/.test(sql)) return { id: "p1", name: "产品", slug: "p1" };
              if (/SELECT COALESCE\(MAX\(version\), 0\) \+ 1 AS next_version/.test(sql)) return { next_version: 4 };
              return null;
            },
            async run() {
              writes.push({ sql, values });
              return { success: true };
            }
          };
        }
      };
    }
  };
  setCmsBindingsForTest({ CMS_DB: db });
  try {
    await createRevisionIfNeeded("products", "p1", "更新内容", "admin-real-uuid");
    const revision = writes.find((call) => /INSERT INTO "product_revisions"/.test(call.sql));
    assert.ok(revision);
    assert.equal(revision.values[3], "admin-real-uuid");
  } finally {
    setCmsBindingsForTest(null);
  }
});
