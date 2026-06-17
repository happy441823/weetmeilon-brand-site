export const cmsBackupTables = [
  "admin_roles",
  "admin_users",
  "admin_user_roles",
  "categories",
  "product_series",
  "product_tags",
  "products",
  "product_tag_relations",
  "product_images",
  "product_revisions",
  "article_categories",
  "article_tags",
  "articles",
  "article_tag_relations",
  "article_related_products",
  "article_revisions",
  "pages",
  "page_revisions",
  "homepage_sections",
  "faqs",
  "faq_categories",
  "media_assets",
  "media_usages",
  "navigation_items",
  "footer_groups",
  "footer_items",
  "site_settings",
  "redirects",
  "audit_logs",
  "publish_jobs",
  "migration_logs"
] as const;

export type CmsBackupTable = (typeof cmsBackupTables)[number];

export type CmsBackupPackage = {
  version: 1;
  exportedAt: string;
  source: "sweetmeilon-cms";
  mode: "full-business-backup";
  includesR2Objects: false;
  r2BackupRequired: true;
  tables: Record<string, unknown[]>;
};

type D1BoundStatementLike = {
  run(): Promise<unknown>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
};

type D1PreparedStatementLike = {
  bind(...values: unknown[]): D1BoundStatementLike;
  run(): Promise<unknown>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
};

type D1DatabaseLike = {
  prepare(sql: string): D1PreparedStatementLike;
  batch?(statements: Array<D1PreparedStatementLike | D1BoundStatementLike>): Promise<unknown[]>;
};

type RestoreOptions = {
  confirm?: string;
  environment?: string;
  allowProduction?: boolean;
};

export const cmsRestoreConfirmationToken = "RESTORE_TO_DEV_D1";

function quote(name: string) {
  return `"${name.replace(/"/g, "")}"`;
}

function isPlainRow(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertSafeColumnNames(table: CmsBackupTable, columns: string[]) {
  for (const column of columns) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(column)) {
      throw new Error(`备份表 ${table} 包含非法字段名：${column}`);
    }
  }
}

function assertRestoreAllowed(options: RestoreOptions = {}) {
  if (options.confirm !== cmsRestoreConfirmationToken) {
    throw new Error(`恢复备份需要显式确认口令：${cmsRestoreConfirmationToken}`);
  }

  const environment = (options.environment || process.env.CMS_ENVIRONMENT || process.env.CF_PAGES_BRANCH || process.env.NODE_ENV || "local").toLowerCase();
  if (!options.allowProduction && ["main", "master", "production", "prod"].includes(environment)) {
    throw new Error("检测到生产环境标识，已拒绝执行 CMS 备份恢复。请仅在开发 D1 或 Preview D1 中恢复。");
  }
}

export function validateBackupPackage(input: unknown): CmsBackupPackage {
  if (!input || typeof input !== "object") {
    throw new Error("备份文件不是有效 JSON 对象。");
  }
  const backup = input as Partial<CmsBackupPackage>;
  if (backup.version !== 1 || backup.source !== "sweetmeilon-cms" || backup.mode !== "full-business-backup") {
    throw new Error("备份文件版本或来源不匹配。");
  }
  if (!backup.tables || typeof backup.tables !== "object") {
    throw new Error("备份文件缺少 tables。");
  }
  for (const table of cmsBackupTables) {
    if (!Array.isArray(backup.tables[table])) {
      throw new Error(`备份文件缺少业务表：${table}`);
    }
  }
  return backup as CmsBackupPackage;
}

export function listR2ObjectsInBackup(input: unknown) {
  const backup = validateBackupPackage(input);
  return (backup.tables.media_assets || [])
    .filter(isPlainRow)
    .map((row) => row.r2_key)
    .filter((key): key is string => typeof key === "string" && key.length > 0)
    .sort();
}

export function buildRestorePreview(input: unknown) {
  const backup = validateBackupPackage(input);
  return {
    exportedAt: backup.exportedAt,
    tableCounts: Object.fromEntries(cmsBackupTables.map((table) => [table, backup.tables[table].length])),
    r2ObjectKeys: listR2ObjectsInBackup(backup),
    requiresManualConfirmation: true,
    confirmationToken: cmsRestoreConfirmationToken,
    r2BackupRequired: backup.r2BackupRequired
  };
}

export async function buildRestorePlan(db: D1DatabaseLike, input: unknown) {
  const backup = validateBackupPackage(input);
  const currentCounts: Record<string, number> = {};
  const incomingCounts: Record<string, number> = {};
  const operations: Record<string, { deleteExisting: number; insertIncoming: number }> = {};

  for (const table of cmsBackupTables) {
    const current = await db.prepare(`SELECT COUNT(*) AS total FROM ${quote(table)}`).first<{ total: number }>();
    const incoming = backup.tables[table].length;
    currentCounts[table] = current?.total || 0;
    incomingCounts[table] = incoming;
    operations[table] = {
      deleteExisting: currentCounts[table],
      insertIncoming: incoming
    };
  }

  return {
    ...buildRestorePreview(backup),
    currentCounts,
    incomingCounts,
    operations,
    willReplaceAllBusinessTables: true
  };
}

async function insertRows(db: D1DatabaseLike, table: CmsBackupTable, rows: unknown[]) {
  let inserted = 0;
  let skipped = 0;
  for (const row of rows) {
    if (!isPlainRow(row)) {
      skipped += 1;
      continue;
    }
    const columns = Object.keys(row);
    if (columns.length === 0) {
      skipped += 1;
      continue;
    }
    assertSafeColumnNames(table, columns);
    await db
      .prepare(`INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`)
      .bind(...columns.map((column) => row[column]))
      .run();
    inserted += 1;
  }
  return { inserted, skipped };
}

function buildInsertStatement(db: D1DatabaseLike, table: CmsBackupTable, row: unknown) {
  if (!isPlainRow(row)) {
    return null;
  }
  const columns = Object.keys(row);
  if (columns.length === 0) {
    return null;
  }
  assertSafeColumnNames(table, columns);
  return db
    .prepare(`INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`)
    .bind(...columns.map((column) => row[column]));
}

function validateRestorableRows(backup: CmsBackupPackage) {
  for (const table of cmsBackupTables) {
    for (const row of backup.tables[table]) {
      if (!isPlainRow(row)) continue;
      const columns = Object.keys(row);
      if (columns.length === 0) continue;
      assertSafeColumnNames(table, columns);
    }
  }
}

export async function restoreBackupPackage(db: D1DatabaseLike, input: unknown, options: RestoreOptions = {}) {
  assertRestoreAllowed(options);
  const backup = validateBackupPackage(input);
  validateRestorableRows(backup);
  const startedAt = new Date().toISOString();
  const plan = await buildRestorePlan(db, backup);
  const deleted: Record<string, number> = {};
  const inserted: Record<string, number> = {};
  let skipped = 0;
  let executionMode: "d1_batch" | "sequential_fallback" = "sequential_fallback";

  if (db.batch) {
    const statements: Array<D1PreparedStatementLike | D1BoundStatementLike> = [];
    for (const table of [...cmsBackupTables].reverse()) {
      statements.push(db.prepare(`DELETE FROM ${quote(table)}`));
      deleted[table] = plan.currentCounts[table] || 0;
    }
    for (const table of cmsBackupTables) {
      inserted[table] = 0;
      for (const row of backup.tables[table]) {
        const statement = buildInsertStatement(db, table, row);
        if (!statement) {
          skipped += 1;
          continue;
        }
        statements.push(statement);
        inserted[table] += 1;
      }
    }
    await db.batch(statements);
    executionMode = "d1_batch";
  } else {
    for (const table of [...cmsBackupTables].reverse()) {
      await db.prepare(`DELETE FROM ${quote(table)}`).run();
      deleted[table] = plan.currentCounts[table] || 0;
    }

    for (const table of cmsBackupTables) {
      const result = await insertRows(db, table, backup.tables[table]);
      inserted[table] = result.inserted;
      skipped += result.skipped;
    }
  }

  return {
    restoredAt: new Date().toISOString(),
    startedAt,
    exportedAt: backup.exportedAt,
    deleted,
    inserted,
    skipped,
    executionMode,
    r2BackupRequired: backup.r2BackupRequired,
    r2ObjectKeys: listR2ObjectsInBackup(backup),
    rollbackPoint: {
      required: true,
      note: "恢复前请先导出当前开发 D1 备份。若恢复后需要回退，请使用恢复前备份重新执行 RESTORE_TO_DEV_D1。"
    }
  };
}
