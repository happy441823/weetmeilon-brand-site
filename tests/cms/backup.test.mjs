import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildRestorePreview, cmsBackupTables, validateBackupPackage } from "../../src/lib/cms/backup.ts";

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
  const preview = buildRestorePreview(backup);
  assert.equal(preview.tableCounts.products, 1);
  assert.equal(preview.tableCounts.audit_logs, 1);
  assert.equal(preview.requiresManualConfirmation, true);
  assert.equal(preview.r2BackupRequired, true);
});

test("backup table names match migration tables", () => {
  const sql = readFileSync(join(repoRoot, "migrations", "0001_admin_cms.sql"), "utf8");
  const migrationTables = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-z_]+)/g)].map((match) => match[1]);
  assert.equal(cmsBackupTables.length, 31);
  assert.equal(cmsBackupTables.includes("product_images"), true);
  assert.equal(cmsBackupTables.includes("product_media"), false);
  assert.deepEqual([...cmsBackupTables].sort(), migrationTables.sort());
});
