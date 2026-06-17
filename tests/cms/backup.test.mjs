import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  buildRestorePlan,
  buildRestorePreview,
  cmsBackupTables,
  cmsRestoreConfirmationToken,
  listR2ObjectsInBackup,
  restoreBackupPackage,
  validateBackupPackage
} from "../../src/lib/cms/backup.ts";

const repoRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

function fullBackup() {
  return {
    version: 1,
    exportedAt: "2026-06-17T00:00:00.000Z",
    source: "sweetmeilon-cms",
    mode: "full-business-backup",
    includesR2Objects: false,
    r2BackupRequired: true,
    tables: Object.fromEntries(cmsBackupTables.map((table) => [table, []]))
  };
}

test("backup package requires every CMS business table", () => {
  const backup = fullBackup();
  assert.equal(validateBackupPackage(backup).tables.products.length, 0);
  delete backup.tables.products;
  assert.throws(() => validateBackupPackage(backup), /products/);
});

test("restore preview returns table counts and requires manual confirmation", () => {
  const backup = fullBackup();
  backup.tables.products.push({ id: "p1" });
  backup.tables.audit_logs.push({ id: "log1" });
  backup.tables.media_assets.push({ id: "m1", r2_key: "images/p1.jpg" });
  const preview = buildRestorePreview(backup);
  assert.equal(preview.tableCounts.products, 1);
  assert.equal(preview.tableCounts.audit_logs, 1);
  assert.deepEqual(preview.r2ObjectKeys, ["images/p1.jpg"]);
  assert.equal(preview.requiresManualConfirmation, true);
  assert.equal(preview.confirmationToken, cmsRestoreConfirmationToken);
  assert.equal(preview.r2BackupRequired, true);
});

test("backup package lists R2 object keys for separate bucket verification", () => {
  const backup = fullBackup();
  backup.tables.media_assets.push({ id: "m1", r2_key: "media/a.webp" }, { id: "m2", r2_key: "" }, { id: "m3" });
  assert.deepEqual(listR2ObjectsInBackup(backup), ["media/a.webp"]);
});

function mockD1(currentCounts = {}) {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              calls.push({ type: "run", sql, values });
              return { success: true };
            },
            async first() {
              calls.push({ type: "first", sql, values });
              const table = sql.match(/FROM\s+"?([a-z_]+)"?/i)?.[1];
              return { total: currentCounts[table] || 0 };
            }
          };
        },
        async run() {
          calls.push({ type: "run", sql, values: [] });
          return { success: true };
        },
        async first() {
          calls.push({ type: "first", sql, values: [] });
          const table = sql.match(/FROM\s+"?([a-z_]+)"?/i)?.[1];
          return { total: currentCounts[table] || 0 };
        }
      };
    }
  };
}

test("restore plan compares current D1 counts with incoming backup counts", async () => {
  const backup = fullBackup();
  backup.tables.products.push({ id: "p1" }, { id: "p2" });
  const db = mockD1({ products: 7 });
  const plan = await buildRestorePlan(db, backup);
  assert.equal(plan.currentCounts.products, 7);
  assert.equal(plan.incomingCounts.products, 2);
  assert.deepEqual(plan.operations.products, { deleteExisting: 7, insertIncoming: 2 });
  assert.equal(plan.willReplaceAllBusinessTables, true);
});

test("restore requires explicit dev D1 confirmation", async () => {
  const db = mockD1();
  await assert.rejects(() => restoreBackupPackage(db, fullBackup(), { confirm: "wrong" }), /RESTORE_TO_DEV_D1/);
  await assert.rejects(
    () => restoreBackupPackage(db, fullBackup(), { confirm: cmsRestoreConfirmationToken, environment: "production" }),
    /生产环境/
  );
});

test("restore clears all CMS tables and inserts backup rows after confirmation", async () => {
  const backup = fullBackup();
  backup.tables.admin_roles.push({ id: "role_super", name: "super_admin" });
  backup.tables.products.push({ id: "p1", slug: "demo" });
  const db = mockD1({ products: 3 });
  const result = await restoreBackupPackage(db, backup, { confirm: cmsRestoreConfirmationToken, environment: "preview" });
  assert.equal(result.deleted.products, 3);
  assert.equal(result.inserted.admin_roles, 1);
  assert.equal(result.inserted.products, 1);
  assert.equal(result.skipped, 0);
  assert.equal(db.calls.filter((call) => call.sql.startsWith("DELETE FROM")).length, cmsBackupTables.length);
  assert.equal(db.calls.some((call) => call.sql.includes('INSERT INTO "products"')), true);
});

test("backup table names match migration tables", () => {
  const sql = readFileSync(join(repoRoot, "migrations", "0001_admin_cms.sql"), "utf8");
  const migrationTables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z_]+)/g)].map((match) => match[1]);
  assert.equal(cmsBackupTables.length, 31);
  assert.equal(cmsBackupTables.includes("product_images"), true);
  assert.equal(cmsBackupTables.includes("product_media"), false);
  assert.deepEqual([...cmsBackupTables].sort(), migrationTables.sort());
});
