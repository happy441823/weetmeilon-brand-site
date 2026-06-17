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

export function buildRestorePreview(input: unknown) {
  const backup = validateBackupPackage(input);
  return {
    exportedAt: backup.exportedAt,
    tableCounts: Object.fromEntries(cmsBackupTables.map((table) => [table, backup.tables[table].length])),
    requiresManualConfirmation: true,
    r2BackupRequired: backup.r2BackupRequired
  };
}
