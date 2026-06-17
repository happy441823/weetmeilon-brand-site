import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "data", "cms-migration-report.json");

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(path.join(root, file), "utf8"));
  } catch {
    return fallback;
  }
}

const adminProducts = await readJson("data/catalog/admin-products.json", []);
const productMap = await readJson("data/catalog/product-channel-map.json", {});

const products = [];
const skipped = [];
const seen = new Set();

for (const item of adminProducts) {
  const slug = slugify(item.cardTitle || item.name || item.id);
  if (!slug || seen.has(slug)) {
    skipped.push({ type: "product", id: item.id, reason: "slug 为空或重复" });
    continue;
  }
  seen.add(slug);
  products.push({
    id: item.id,
    name: item.cardTitle || item.name,
    short_name: item.name,
    slug,
    subtitle: item.seriesLabel || "",
    status: "pending_review",
    summary: item.cardDescription || "",
    tmall_url: item.tmallUrl || null,
    jd_url: item.jdUrl || null,
    tmall_enabled: item.tmallUrl ? 1 : 0,
    jd_enabled: item.jdUrl ? 1 : 0,
    links_verified: 0,
    buy_button_enabled: 1,
    image_alt: item.cardTitle || item.name,
    created_at: item.createdAt,
    updated_at: item.updatedAt
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  dryRun: true,
  source: {
    adminProducts: adminProducts.length,
    productChannelMapKeys: Object.keys(productMap).length
  },
  result: {
    products: products.length,
    articles: 0,
    faqs: 0,
    pages: 0,
    skipped: skipped.length,
    failed: 0
  },
  manualReviewRequired: [
    "请核对商品分类、系列、主图是否已迁移到 R2。",
    "原生肌凝硅三款新品需要保持 coming_soon，且不要添加虚假购买链接。",
    "文章、FAQ、页面文案需要从现有静态页面人工复核后再批量导入。"
  ],
  skipped,
  products
};

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`CMS migration dry-run report written: ${reportPath}`);
console.log(`Products prepared: ${products.length}, skipped: ${skipped.length}`);

