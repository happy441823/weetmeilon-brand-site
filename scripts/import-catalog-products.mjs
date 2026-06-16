import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const src = (...parts) => path.join(root, "src", ...parts);
const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, "data", "catalog", "templates", "product.template.json");
const previewPath = path.join(root, "data", "catalog", "review", "catalog-import-preview.json");

function loadTsExport(filePath, exportName) {
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true
    }
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    exports: module.exports,
    module,
    require: (request) => {
      if (request.includes("tmall-live-products")) {
        return { tmallLiveProducts: loadTsExport(src("data", "catalog", "tmall-live-products.ts"), "tmallLiveProducts") };
      }
      if (request.includes("manual-products")) {
        return { userCatalogProducts: loadTsExport(src("data", "catalog", "manual-products.ts"), "userCatalogProducts") };
      }
      return {};
    },
    console
  };
  vm.runInNewContext(output, sandbox, { filename: filePath });
  return module.exports[exportName];
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

function fromCsv(raw) {
  const [headerLine, ...lines] = raw.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(headerLine);
  return lines.map((line) => {
    const cells = parseCsvLine(line);
    return Object.fromEntries(headers.map((key, index) => [key, cells[index] || ""]));
  });
}

function splitList(value) {
  return String(value || "").split(/[|，,]/).map((item) => item.trim()).filter(Boolean);
}

function normalizeCsvProduct(row) {
  const now = new Date().toISOString();
  const status = row.status || "draft";
  const tmallUrl = row.tmallUrl || "";
  const jdUrl = row.jdUrl || "";
  return {
    id: row.id,
    slug: row.slug,
    skuCode: row.id?.toUpperCase(),
    name: row.name,
    shortName: row.shortName || row.name,
    subtitle: row.subtitle || "",
    categoryId: row.primaryCategoryId,
    primaryCategoryId: row.primaryCategoryId,
    subcategoryId: row.subcategoryId || null,
    categoryReviewStatus: status === "active" ? "confirmed" : "needs-review",
    seriesId: row.seriesId || null,
    tags: splitList(row.tags),
    status,
    visible: row.visible === "true",
    featured: row.featured === "true",
    sortOrder: Number(row.sortOrder || 500),
    launchDate: null,
    coverImage: row.coverImage || "",
    gallery: splitList(row.gallery),
    imageAlt: row.imageAlt || `${row.name}官网商品主图`,
    imageTag: status === "active" ? "官网主图" : "新品预告",
    shortDescription: row.shortDescription || "",
    fullDescription: row.fullDescription || row.shortDescription || "",
    heroLine: row.subtitle || row.shortDescription || "",
    bestFor: [],
    highlights: splitList(row.highlights),
    specifications: splitList(row.specifications).map((item) => {
      const [label, ...rest] = item.split(":");
      return { label, value: rest.join(":") };
    }).filter((item) => item.label && item.value),
    careNotes: splitList(row.careNotes),
    privacyNotes: splitList(row.privacyNotes),
    channelLinks: {
      tmall: {
        enabled: status === "active" && Boolean(tmallUrl),
        url: tmallUrl || null,
        label: "查看天猫同款",
        verified: status === "active" && Boolean(tmallUrl),
        sourceUrl: tmallUrl || null,
        lastCheckedAt: status === "active" && tmallUrl ? now : null
      },
      jd: {
        enabled: status === "active" && Boolean(jdUrl),
        url: jdUrl || null,
        label: "查看京东同款",
        verified: status === "active" && Boolean(jdUrl),
        sourceUrl: jdUrl || null,
        lastCheckedAt: status === "active" && jdUrl ? now : null
      }
    },
    sourceRecords: [],
    verificationStatus: status === "active" ? "verified" : "needs_review",
    publishReady: status === "active" && row.visible === "true",
    publishIssues: [],
    imageStatus: row.coverImage ? "ready" : "missing",
    linkStatus: status === "active" && (tmallUrl || jdUrl) ? "verified" : "missing",
    contentStatus: status === "active" ? "ready" : "needs-review",
    visualAssetStatus: row.coverImage ? "ready" : "pending",
    manualReviewed: status === "active",
    reviewedAt: status === "active" ? now : null,
    reviewedBy: status === "active" ? "merchant" : null,
    assetWorkflowStatus: row.coverImage ? "ready" : "waiting_user_assets",
    seoTitle: `${row.name}｜蜜女郎官方商品`,
    seoDescription: row.shortDescription || "",
    seoKeywords: ["蜜女郎", ...splitList(row.tags)].slice(0, 6),
    createdAt: now,
    updatedAt: now
  };
}

function isValidUrl(value, channel) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return channel === "tmall"
      ? url.hostname.endsWith("tmall.com") || url.hostname.endsWith("taobao.com")
      : url.hostname.endsWith("jd.com");
  } catch {
    return false;
  }
}

function validate(products) {
  const categories = loadTsExport(src("data", "catalog", "categories.ts"), "catalogCategories");
  const existing = loadTsExport(src("data", "catalog", "products.ts"), "baseCatalogProducts");
  const ids = new Set(existing.map((item) => item.id));
  const slugs = new Set(existing.map((item) => item.slug));
  const primary = new Set(categories.filter((item) => item.level === "primary").map((item) => item.id));
  const secondary = new Map(categories.filter((item) => item.level === "secondary").map((item) => [item.id, item.parentId]));
  const errors = [];

  for (const product of products) {
    if (!product.id) errors.push("缺少商品 ID");
    if (!product.slug) errors.push(`${product.id || "新商品"} 缺少 slug`);
    if (ids.has(product.id)) errors.push(`${product.id} 商品 ID 已存在`);
    if (slugs.has(product.slug)) errors.push(`${product.id} slug 已存在`);
    if (!product.name) errors.push(`${product.id} 缺少商品名称`);
    if (!primary.has(product.primaryCategoryId)) errors.push(`${product.id} 一级分类不存在`);
    if (product.subcategoryId && secondary.get(product.subcategoryId) !== product.primaryCategoryId) errors.push(`${product.id} 二级分类不匹配`);
    if (!isValidUrl(product.channelLinks.tmall.url, "tmall")) errors.push(`${product.id} 天猫链接格式错误`);
    if (!isValidUrl(product.channelLinks.jd.url, "jd")) errors.push(`${product.id} 京东链接格式错误`);
    if (product.status === "active" && !product.channelLinks.tmall.url && !product.channelLinks.jd.url) errors.push(`${product.id} active 商品缺少购买链接`);
    if (product.status === "active" && !product.coverImage) errors.push(`${product.id} active 商品缺少主图`);
    if (product.status === "upcoming" && (product.channelLinks.tmall.url || product.channelLinks.jd.url)) errors.push(`${product.id} upcoming 商品不能有购买链接`);
  }

  return errors;
}

const raw = fs.readFileSync(inputPath, "utf8");
const imported = inputPath.endsWith(".csv") ? fromCsv(raw).map(normalizeCsvProduct) : [JSON.parse(raw)];
const errors = validate(imported);

fs.mkdirSync(path.dirname(previewPath), { recursive: true });
fs.writeFileSync(previewPath, `${JSON.stringify({ inputPath, imported, errors }, null, 2)}\n`, "utf8");

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[catalog:import] ${error}`);
  }
  console.error(`[catalog:import] preview written to ${path.relative(root, previewPath)}`);
  process.exit(1);
}

console.log(`[catalog:import] preview written to ${path.relative(root, previewPath)}`);
console.log("[catalog:import] no files were changed automatically; review the preview before merging data.");
