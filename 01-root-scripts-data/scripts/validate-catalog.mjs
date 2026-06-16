import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const src = (...parts) => path.join(root, "src", ...parts);
const data = (...parts) => path.join(root, "data", ...parts);

function loadTsExport(filePath, exportName) {
  const source = fs.readFileSync(filePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true
    }
  }).outputText;
  const module = { exports: {} };
  const sandbox = {
    exports: module.exports,
    module,
    require: (request) => {
      if (request.includes("tmall-live-products")) {
        return {
          tmallLiveProducts: loadTsExport(src("data", "catalog", "tmall-live-products.ts"), "tmallLiveProducts")
        };
      }
      if (request.includes("manual-products")) {
        return {
          userCatalogProducts: loadTsExport(src("data", "catalog", "manual-products.ts"), "userCatalogProducts")
        };
      }
      return {};
    },
    console
  };
  vm.runInNewContext(output, sandbox, { filename: filePath });
  return module.exports[exportName];
}

function applyManualOverride(product, overrides) {
  const override = overrides[product.id];
  if (!override) {
    return product;
  }

  return {
    ...product,
    ...override,
    channelLinks: {
      tmall: {
        ...product.channelLinks.tmall,
        ...(override.channelLinks?.tmall || {})
      },
      jd: {
        ...product.channelLinks.jd,
        ...(override.channelLinks?.jd || {})
      }
    }
  };
}

function isAllowedChannelUrl(channel, url) {
  if (!url) {
    return true;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (channel === "tmall") {
    return host.endsWith("tmall.com") || host.endsWith("taobao.com");
  }
  return host.endsWith("jd.com");
}

const categories = loadTsExport(src("data", "catalog", "categories.ts"), "catalogCategories");
const series = loadTsExport(src("data", "catalog", "series.ts"), "catalogSeries");
const baseProducts = loadTsExport(src("data", "catalog", "products.ts"), "baseCatalogProducts");
const manualOverrides = loadTsExport(src("data", "catalog", "manual-overrides.ts"), "manualProductOverrides") || {};
const generatedOverridesPath = src("data", "catalog", "generated-overrides.json");
const generatedOverrides = fs.existsSync(generatedOverridesPath)
  ? JSON.parse(fs.readFileSync(generatedOverridesPath, "utf8"))
  : {};
const products = baseProducts
  .map((product) => applyManualOverride(product, generatedOverrides))
  .map((product) => applyManualOverride(product, manualOverrides));

const errors = [];
const warnings = [];
const categoryIds = new Set(categories.map((category) => category.id));
const primaryCategoryIds = new Set(categories.filter((category) => category.level === "primary").map((category) => category.id));
const subcategoryIds = new Set(categories.filter((category) => category.level === "secondary").map((category) => category.id));
const seriesIds = new Set(series.map((item) => item.id));
const productIds = new Set();
const productSlugs = new Set();
const linkOwners = new Map();

function isStrictPublicActive(product) {
  return product.status === "active"
    && product.visible
    && product.contentStatus === "ready"
    && product.manualReviewed === true
    && product.publishReady === true;
}

for (const product of products) {
  if (!product.id || !product.slug || !product.name) {
    errors.push(`商品缺少 id/slug/name: ${JSON.stringify({ id: product.id, slug: product.slug, name: product.name })}`);
  }

  if (productIds.has(product.id)) {
    errors.push(`重复商品 id: ${product.id}`);
  }
  productIds.add(product.id);

  if (productSlugs.has(product.slug)) {
    errors.push(`重复商品 slug: ${product.slug}`);
  }
  productSlugs.add(product.slug);

  if (!categoryIds.has(product.categoryId)) {
    errors.push(`${product.id} 使用了不存在的 categoryId: ${product.categoryId}`);
  }

  if (product.primaryCategoryId && !primaryCategoryIds.has(product.primaryCategoryId)) {
    errors.push(`${product.id} 使用了不存在的 primaryCategoryId: ${product.primaryCategoryId}`);
  }

  if (product.subcategoryId && !subcategoryIds.has(product.subcategoryId)) {
    errors.push(`${product.id} 使用了不存在的 subcategoryId: ${product.subcategoryId}`);
  }

  if (product.subcategoryId) {
    const subcategory = categories.find((category) => category.id === product.subcategoryId);
    if (subcategory?.parentId !== product.primaryCategoryId) {
      errors.push(`${product.id} 的 subcategoryId 不属于 primaryCategoryId: ${product.subcategoryId}`);
    }
  }

  if (product.seriesId && !seriesIds.has(product.seriesId)) {
    errors.push(`${product.id} 使用了不存在的 seriesId: ${product.seriesId}`);
  }

  if (product.status === "draft" && product.visible) {
    errors.push(`${product.id} 是 draft，但 visible=true`);
  }

  if (product.featured && !product.visible) {
    errors.push(`${product.id} featured=true，但 visible=false`);
  }

  const channels = ["tmall", "jd"];
  const verifiedChannels = channels.filter((channel) => {
    const link = product.channelLinks[channel];
    return link.enabled && link.verified && link.url;
  });

  if (product.status === "active" && product.visible && verifiedChannels.length === 0) {
    errors.push(`${product.id} 是 active 公开商品，但没有已验证购买渠道`);
  }

  if (isStrictPublicActive(product)) {
    if (!product.coverImage.includes("/approved/")) {
      errors.push(`${product.id} publishReady=true，但没有使用 approved 主图`);
    }
    if (!product.displayName && !product.name) {
      errors.push(`${product.id} publishReady=true，但缺少官网展示名称`);
    }
    if (!product.primaryCategoryId || product.categoryReviewStatus !== "confirmed") {
      errors.push(`${product.id} publishReady=true，但新分类未确认`);
    }
  }

  if (product.status === "upcoming") {
    for (const channel of channels) {
      const link = product.channelLinks[channel];
      if (link.enabled || link.url) {
        errors.push(`${product.id} 是 upcoming，但出现了 ${channel} 购买链接或 enabled=true`);
      }
    }
    if (product.launchDate !== null) {
      errors.push(`${product.id} 是 upcoming，但 launchDate 不是 null`);
    }
  }

  for (const channel of channels) {
    const link = product.channelLinks[channel];
    if (!isAllowedChannelUrl(channel, link.url)) {
      errors.push(`${product.id} 的 ${channel} 链接域名异常: ${link.url}`);
    }
    if (link.url) {
      const key = `${channel}:${link.url}`;
      if (linkOwners.has(key) && linkOwners.get(key) !== product.id) {
        errors.push(`同一 ${channel} 链接绑定多个商品: ${link.url}`);
      }
      linkOwners.set(key, product.id);
    }
  }

  if (product.coverImage && !fs.existsSync(path.join(root, "public", product.coverImage.replace(/^\//, "")))) {
    warnings.push(`${product.id} 的图片暂未放入 public: ${product.coverImage}`);
  }
}

for (const file of [
  data("catalog", "raw", "tmall-products.json"),
  data("catalog", "raw", "jd-products.json"),
  data("catalog", "normalized", "products.discovered.json"),
  data("catalog", "review", "products-review.csv"),
  data("catalog", "review", "product-matching.csv"),
  data("catalog", "review", "category-suggestions.csv")
]) {
  if (!fs.existsSync(file)) {
    errors.push(`缺少目录维护文件: ${path.relative(root, file)}`);
  }
}

for (const requiredUpcoming of ["native-skin-silicone-soft", "texture-detail-series", "privacy-starter-kit"]) {
  const product = products.find((item) => item.id === requiredUpcoming);
  if (!product) {
    errors.push(`缺少原生肌凝硅新品: ${requiredUpcoming}`);
  } else if (product.status !== "upcoming" || !product.visible || !product.featured || product.launchDate !== null) {
    errors.push(`${requiredUpcoming} 未满足 upcoming/visible/featured/launchDate=null 要求`);
  }
}

const publicCount = products.filter((product) => product.visible && (product.status === "upcoming" || isStrictPublicActive(product))).length;
const activeCount = products.filter(isStrictPublicActive).length;
const upcomingCount = products.filter((product) => product.visible && product.status === "upcoming").length;
const reviewCount = products.filter((product) => product.verificationStatus === "needs_review").length;

for (const warning of warnings) {
  console.warn(`[catalog:warning] ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[catalog:error] ${error}`);
  }
  process.exit(1);
}

console.log(`[catalog] validation passed`);
console.log(`[catalog] products total=${products.length}, public=${publicCount}, active=${activeCount}, upcoming=${upcomingCount}, needs_review=${reviewCount}`);
