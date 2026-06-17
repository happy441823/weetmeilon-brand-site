#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "data", "cms-migration-report.json");

function readArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (["apply", "local", "remote", "yes", "print-sql"].includes(key)) {
      options[key] = true;
    } else {
      options[key] = argv[index + 1];
      index += 1;
    }
  }
  return options;
}

function requireSource(file) {
  const absolute = path.join(root, file);
  if (!existsSync(absolute)) {
    throw new Error(`Required seed source is missing: ${file}`);
  }
  return absolute;
}

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function json(value) {
  return JSON.stringify(value ?? []);
}

function insertSql(table, columns, rows, conflictColumn = "id") {
  return rows
    .map((row) => {
      const values = columns.map((column) => sqlString(row[column]));
      const updates = columns
        .filter((column) => column !== conflictColumn)
        .map((column) => `${column} = excluded.${column}`)
        .join(", ");
      return `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT(${conflictColumn}) DO UPDATE SET ${updates};`;
    })
    .join("\n");
}

function productStatus(status) {
  return status === "upcoming" ? "coming_soon" : status === "active" ? "published" : "draft";
}

function isComingSoon(product) {
  return product.status === "upcoming" || /native-skin|原生|鍘熺敓/i.test(`${product.id} ${product.slug} ${product.name}`);
}

function productRow(product) {
  const comingSoon = isComingSoon(product);
  const status = comingSoon ? "coming_soon" : productStatus(product.status);
  const tmall = product.channelLinks?.tmall;
  const jd = product.channelLinks?.jd;
  return {
    id: product.id,
    name: product.displayName || product.name,
    short_name: product.shortName || product.name,
    slug: product.slug,
    subtitle: product.subtitle || "",
    primary_category_id: product.primaryCategoryId || product.categoryId || null,
    subcategory_id: product.subcategoryId || null,
    series_id: product.seriesId || null,
    status,
    sort_order: Number(product.sortOrder || 0),
    featured: product.featured ? 1 : 0,
    visible_home: product.featured ? 1 : 0,
    visible_catalog: product.visible === false ? 0 : 1,
    summary: product.shortDescription || product.heroLine || "",
    body_html: product.fullDescription || product.shortDescription || "",
    highlights_json: json(product.highlights || []),
    concerns_json: json([]),
    material_notes: "",
    specifications_json: json(product.specifications || []),
    package_list: "",
    care_notes: (product.careNotes || []).join("\n"),
    storage_notes: "",
    privacy_notes: (product.privacyNotes || []).join("\n"),
    usage_tips: (product.bestFor || []).join("\n"),
    compliance_notes: "",
    gallery_json: json(product.gallery || []),
    image_alt: product.imageAlt || product.name,
    seo_title: product.seoTitle || product.name,
    seo_description: product.seoDescription || product.shortDescription || "",
    keywords_json: json(product.seoKeywords || []),
    tmall_url: comingSoon ? null : tmall?.url || null,
    jd_url: comingSoon ? null : jd?.url || null,
    tmall_enabled: comingSoon ? 0 : tmall?.enabled ? 1 : 0,
    jd_enabled: comingSoon ? 0 : jd?.enabled ? 1 : 0,
    links_verified: tmall?.verified || jd?.verified ? 1 : 0,
    buy_button_enabled: comingSoon ? 0 : 1,
    published_at: status === "published" ? product.updatedAt || new Date().toISOString() : null,
    created_at: product.createdAt || new Date().toISOString(),
    updated_at: product.updatedAt || new Date().toISOString()
  };
}

function articleBody(article) {
  return (article.sections || [])
    .map((section) => `<h2>${section.heading}</h2>${(section.body || []).map((text) => `<p>${text}</p>`).join("")}`)
    .join("");
}

async function loadStaticData() {
  requireSource("src/lib/catalog.ts");
  requireSource("src/lib/articles.ts");
  requireSource("src/data/catalog/categories.ts");
  requireSource("src/data/catalog/series.ts");
  const catalog = await import("../src/lib/catalog.ts");
  const articlesModule = await import("../src/lib/articles.ts");
  return {
    products: catalog.catalogProducts,
    categories: catalog.catalogCategories,
    series: catalog.catalogSeries,
    articles: articlesModule.articles || []
  };
}

function buildSeedRows(staticData) {
  const now = new Date().toISOString();
  const categories = staticData.categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    parent_id: category.parentId || null,
    level: category.level === "secondary" ? "secondary" : "primary",
    sort_order: Number(category.sortOrder || 0),
    is_active: category.visible === false ? 0 : 1,
    seo_title: category.seoTitle || category.name,
    seo_description: category.seoDescription || "",
    created_at: now,
    updated_at: now
  }));
  const series = staticData.series.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description || "",
    sort_order: Number(item.sortOrder || 0),
    is_active: item.visible === false ? 0 : 1,
    seo_title: item.name,
    seo_description: item.description || "",
    created_at: now,
    updated_at: now
  }));
  const products = staticData.products.map(productRow);
  const articles = staticData.articles.map((article) => ({
    id: `article_${article.slug}`,
    title: article.title,
    slug: article.slug,
    excerpt: article.description,
    author: "SWEETMEILON",
    status: article.status === "published" ? "published" : "draft",
    body_html: articleBody(article),
    markdown_source: "",
    content_blocks_json: json([]),
    toc_json: json(article.outline || []),
    seo_title: article.title,
    seo_description: article.description,
    keywords_json: json(article.keywords || []),
    indexable: article.indexable ? 1 : 0,
    published_at: article.status === "published" ? now : null,
    first_published_at: article.status === "published" ? now : null,
    created_at: now,
    updated_at: now
  }));
  const faqs = [
    ["faq-brand-official", "这是 SWEETMEILON 官方官网吗？", "是。官网用于介绍品牌、材质体验、产品系列、隐私发货和清洁保养。具体购买请前往官方渠道。"],
    ["faq-material", "官网如何说明材质信息？", "官网介绍品牌材质概念和体验方向，具体商品材质、规格、尺寸与使用说明以官方旗舰店商品页面为准。"],
    ["faq-coming-soon", "即将上新的商品可以购买吗？", "coming_soon 商品仅展示新品预告，不显示购买按钮、价格、库存或上架时间。"],
    ["faq-cleaning", "产品如何清洁和收纳？", "使用前后应按商品说明清洁，充分晾干后单独收纳。不同材质和结构可能有不同要求。"]
  ].map(([id, question, answer], index) => ({ id, question, answer, sort_order: index + 1, is_public: 1, show_on_home: index < 3 ? 1 : 0, created_at: now, updated_at: now }));
  const pages = [
    ["page_brand", "brand", "品牌页", "brand", "SWEETMEILON 品牌介绍"],
    ["page_guide", "guide", "清洁指南", "guide", "清洁、晾干、收纳与日常维护指南"],
    ["page_material", "material", "原生肌凝硅", "material", "品牌材质体验概念说明"]
  ].map(([id, page_key, title, slug, body]) => ({ id, page_key, title, slug, status: "published", modules_json: json([]), body_html: `<p>${body}</p>`, seo_title: title, seo_description: body, indexable: 1, published_at: now, created_at: now, updated_at: now }));
  const navigation = [
    ["nav_home", "首页", "/"],
    ["nav_products", "产品中心", "/products"],
    ["nav_articles", "文章", "/articles"],
    ["nav_faq", "FAQ", "/faq"],
    ["nav_brand", "品牌", "/brand"]
  ].map(([id, label, href], index) => ({ id, label, href, page_type: "internal", sort_order: index + 1, is_visible: 1, show_desktop: 1, show_mobile: 1, created_at: now, updated_at: now }));
  const footerGroups = [{ id: "footer_main", title: "SWEETMEILON", sort_order: 1, is_visible: 1, created_at: now, updated_at: now }];
  const footerItems = [
    ["footer_privacy", "footer_main", "隐私政策", "/privacy-policy"],
    ["footer_terms", "footer_main", "使用条款", "/terms"],
    ["footer_contact", "footer_main", "联系", "/contact"]
  ].map(([id, group_id, label, href], index) => ({ id, group_id, label, href, content: "", sort_order: index + 1, is_visible: 1, created_at: now, updated_at: now }));
  const settings = [
    { key: "brand.en_name", value_json: json("SWEETMEILON"), setting_group: "brand", is_sensitive: 0 },
    { key: "seo.default_title", value_json: json("SWEETMEILON 官方网站"), setting_group: "seo", is_sensitive: 0 },
    { key: "cms.media_public_base_url", value_json: json(""), setting_group: "media", is_sensitive: 0 }
  ].map((item) => ({ ...item, created_at: now, updated_at: now }));
  return { categories, series, products, articles, faqs, pages, navigation, footerGroups, footerItems, settings };
}

export function buildProductSeedSql(products) {
  const columns = [
    "id",
    "name",
    "short_name",
    "slug",
    "subtitle",
    "status",
    "summary",
    "tmall_url",
    "jd_url",
    "tmall_enabled",
    "jd_enabled",
    "links_verified",
    "buy_button_enabled",
    "image_alt",
    "created_at",
    "updated_at"
  ];
  return `PRAGMA foreign_keys = ON;\n${insertSql("products", columns, products)}\n`;
}

export function buildFullSeedSql(rows) {
  return [
    "PRAGMA foreign_keys = ON;",
    insertSql("categories", ["id", "name", "slug", "parent_id", "level", "sort_order", "is_active", "seo_title", "seo_description", "created_at", "updated_at"], rows.categories),
    insertSql("product_series", ["id", "name", "slug", "description", "sort_order", "is_active", "seo_title", "seo_description", "created_at", "updated_at"], rows.series),
    insertSql("products", ["id", "name", "short_name", "slug", "subtitle", "primary_category_id", "subcategory_id", "series_id", "status", "sort_order", "featured", "visible_home", "visible_catalog", "summary", "body_html", "highlights_json", "concerns_json", "material_notes", "specifications_json", "package_list", "care_notes", "storage_notes", "privacy_notes", "usage_tips", "compliance_notes", "gallery_json", "image_alt", "seo_title", "seo_description", "tmall_url", "jd_url", "tmall_enabled", "jd_enabled", "links_verified", "buy_button_enabled", "published_at", "created_at", "updated_at"], rows.products),
    insertSql("articles", ["id", "title", "slug", "excerpt", "author", "status", "body_html", "markdown_source", "content_blocks_json", "toc_json", "seo_title", "seo_description", "keywords_json", "indexable", "published_at", "first_published_at", "created_at", "updated_at"], rows.articles),
    insertSql("faqs", ["id", "question", "answer", "sort_order", "is_public", "show_on_home", "created_at", "updated_at"], rows.faqs),
    insertSql("pages", ["id", "page_key", "title", "slug", "status", "modules_json", "body_html", "seo_title", "seo_description", "indexable", "published_at", "created_at", "updated_at"], rows.pages),
    insertSql("navigation_items", ["id", "label", "href", "page_type", "sort_order", "is_visible", "show_desktop", "show_mobile", "created_at", "updated_at"], rows.navigation),
    insertSql("footer_groups", ["id", "title", "sort_order", "is_visible", "created_at", "updated_at"], rows.footerGroups),
    insertSql("footer_items", ["id", "group_id", "label", "href", "content", "sort_order", "is_visible", "created_at", "updated_at"], rows.footerItems),
    insertSql("site_settings", ["key", "value_json", "setting_group", "is_sensitive", "created_at", "updated_at"], rows.settings, "key")
  ].filter(Boolean).join("\n");
}

async function writeReport(report) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function applySql(sql, options) {
  if (!options.database) throw new Error("--database is required with --apply.");
  if (!options.local && !options.remote) throw new Error("Choose --local or --remote with --apply.");
  if (options.local && options.remote) throw new Error("Choose only one of --local or --remote.");
  if (!options.yes) throw new Error("--yes is required before writing to D1.");

  const dir = await mkdtemp(path.join(tmpdir(), "sweetmeilon-cms-seed-"));
  const file = path.join(dir, "seed.sql");
  await writeFile(file, sql, "utf8");
  const args = ["wrangler", "d1", "execute", String(options.database), "--file", file];
  if (options.env) args.push("--env", String(options.env));
  args.push(options.remote ? "--remote" : "--local");
  try {
    const result = spawnSync("npx.cmd", args, { stdio: "inherit", shell: false });
    if (result.status !== 0) throw new Error(`wrangler d1 execute failed with exit code ${result.status}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function main() {
  const options = readArgs(process.argv.slice(2));
  const staticData = await loadStaticData();
  const rows = buildSeedRows(staticData);
  const sql = buildFullSeedSql(rows);
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: !options.apply,
    applied: Boolean(options.apply),
    source: {
      products: staticData.products.length,
      categories: staticData.categories.length,
      series: staticData.series.length,
      articles: staticData.articles.length
    },
    result: {
      products: rows.products.length,
      categories: rows.categories.length,
      series: rows.series.length,
      articles: rows.articles.length,
      faqs: rows.faqs.length,
      pages: rows.pages.length,
      navigation_items: rows.navigation.length,
      footer_groups: rows.footerGroups.length,
      footer_items: rows.footerItems.length,
      site_settings: rows.settings.length,
      skipped: 0,
      failed: 0
    },
    r2UploadRequired: true,
    r2UploadNote: "This seed writes media relationships and URLs only when source data already has them. Uploading binary images to R2 must run as a separate explicit step after dev R2 is configured."
  };

  if (options["print-sql"]) console.log(sql);
  if (options.apply) await applySql(sql, options);
  await writeReport(report);
  console.log(`CMS migration report written: ${reportPath}`);
  console.log(`Prepared products=${rows.products.length}, articles=${rows.articles.length}, faqs=${rows.faqs.length}, pages=${rows.pages.length}, applied=${Boolean(options.apply)}`);
}

if (import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
