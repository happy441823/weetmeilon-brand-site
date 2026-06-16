import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const src = (...parts) => path.join(root, "src", ...parts);

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
        return {
          tmallLiveProducts: loadTsExport(src("data", "catalog", "tmall-live-products.ts"), "tmallLiveProducts")
        };
      }
      return {};
    },
    console
  };
  vm.runInNewContext(output, sandbox, { filename: filePath });
  return module.exports[exportName];
}

function merge(product, override) {
  if (!override) {
    return product;
  }
  return {
    ...product,
    ...override,
    channelLinks: {
      tmall: { ...product.channelLinks.tmall, ...(override.channelLinks?.tmall || {}) },
      jd: { ...product.channelLinks.jd, ...(override.channelLinks?.jd || {}) }
    }
  };
}

const baseProducts = loadTsExport(src("data", "catalog", "products.ts"), "baseCatalogProducts");
const manualOverrides = loadTsExport(src("data", "catalog", "manual-overrides.ts"), "manualProductOverrides") || {};
const generatedOverrides = JSON.parse(fs.readFileSync(src("data", "catalog", "generated-overrides.json"), "utf8"));
const products = baseProducts.map((product) => merge(merge(product, generatedOverrides[product.id]), manualOverrides[product.id]));

function hasImage(product) {
  return Boolean(product.coverImage && fs.existsSync(path.join(root, "public", product.coverImage.replace(/^\//, ""))));
}

function hasApproved(product) {
  return Boolean(product.coverImage?.includes("/approved/") && hasImage(product));
}

function verifiedChannelCount(product) {
  return ["tmall", "jd"].filter((channel) => {
    const link = product.channelLinks[channel];
    return link.enabled && link.verified && link.url;
  }).length;
}

function countBy(predicate) {
  return products.filter(predicate).length;
}

const publishReady = products.filter((product) => product.status === "upcoming" || product.publishReady === true);
const hiddenMissingImages = products.filter((product) => product.status === "active" && !hasApproved(product));
const hiddenBadVisual = products.filter((product) => product.status === "active" && product.visualAssetStatus === "pending");
const hiddenMissingLinks = products.filter((product) => product.status === "active" && verifiedChannelCount(product) === 0);
const hiddenNameCategory = products.filter((product) => product.status === "active" && (!product.displayName || product.categoryId === "other"));
const featuredActive = products.filter((product) => product.status === "active" && product.featured && product.publishReady).slice(0, 4);

const audit = `# CATALOG_CONTENT_AUDIT

审计时间：2026-06-14

## 统计

1. 当前商品总数：${products.length}
2. active 商品数量：${countBy((p) => p.status === "active")}
3. upcoming 商品数量：${countBy((p) => p.status === "upcoming")}
4. draft 商品数量：${countBy((p) => p.status === "draft")}
5. discontinued 商品数量：${countBy((p) => p.status === "discontinued")}
6. 有可用图片的商品数量：${countBy(hasImage)}
7. 没有可用图片的商品数量：${countBy((p) => !hasImage(p))}
8. 图片风格不适合官网的商品数量：${hiddenBadVisual.length}
9. 有已验证天猫链接的商品数量：${countBy((p) => p.channelLinks.tmall.enabled && p.channelLinks.tmall.verified && p.channelLinks.tmall.url)}
10. 有已验证京东链接的商品数量：${countBy((p) => p.channelLinks.jd.enabled && p.channelLinks.jd.verified && p.channelLinks.jd.url)}
11. 同时有天猫、京东链接的商品数量：${countBy((p) => verifiedChannelCount(p) === 2)}
12. 只有平台长标题、没有官网展示名称的商品数量：${countBy((p) => !p.displayName)}
13. 分类无法确认的商品数量：${countBy((p) => p.categoryId === "other" && p.status === "active")}
14. 已达到公开发布条件的商品数量：${countBy((p) => p.status === "active" && p.publishReady) + countBy((p) => p.status === "upcoming")}

## 审计结论

- 原生肌凝硅三款保持 upcoming、visible、featured，且不展示购买按钮。
- 已上架商品必须具备 approved 官网主图、官网展示名、分类和至少一个已验证平台链接。
- 商家后台素材中心已作为白底图/透明图来源；后台白底图审核不通过或审核中的商品仍保留人工复核记录。
`;

const publish = `# CATALOG_PUBLISH_REPORT

审计时间：2026-06-14

## 发布结果

1. 商品总数：${products.length}
2. 可公开发布数量：${publishReady.length}
3. 因缺图被隐藏数量：${hiddenMissingImages.length}
4. 因图片不适合官网被隐藏数量：${hiddenBadVisual.length}
5. 因缺链接被隐藏数量：${hiddenMissingLinks.length}
6. 因名称或分类待审核数量：${hiddenNameCategory.length}
7. upcoming 新品数量：${countBy((p) => p.status === "upcoming")}
8. 首页精选商品列表：${featuredActive.map((p) => p.displayName || p.name).join("、") || "暂无"}
9. 半身款天猫链接：${products.find((p) => p.id === "tmall-856316241725")?.channelLinks.tmall.url || "待确认"}；京东链接：待确认
10. 仍需人工补充素材：${hiddenMissingImages.map((p) => p.id).join("、") || "无"}

## 公开页面规则

- active 商品只在 \`publishReady === true\` 时进入前台。
- upcoming 商品只作为新品预告展示，不展示价格、库存、销量、评价或购买按钮。
- 后台审核状态、素材来源、内部 ID 和生成提示词只保存在报告/CSV，不出现在公开官网页面。
`;

fs.writeFileSync(path.join(root, "CATALOG_CONTENT_AUDIT.md"), audit, "utf8");
fs.writeFileSync(path.join(root, "CATALOG_PUBLISH_REPORT.md"), publish, "utf8");
console.log(`[catalog] reports written, publishReady=${publishReady.length}`);
