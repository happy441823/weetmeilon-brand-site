import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = process.cwd();
const src = (...parts) => path.join(root, "src", ...parts);
const channelMapPath = path.join(root, "data", "catalog", "product-channel-map.json");
const channelMap = JSON.parse(fs.readFileSync(channelMapPath, "utf8"));

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
      if (request.endsWith("generated-overrides.json")) {
        return JSON.parse(fs.readFileSync(src("data", "catalog", "generated-overrides.json"), "utf8"));
      }
      if (request.includes("manual-overrides")) {
        return { manualProductOverrides: loadTsExport(src("data", "catalog", "manual-overrides.ts"), "manualProductOverrides") };
      }
      return {};
    },
    console
  };
  vm.runInNewContext(output, sandbox, { filename: filePath });
  return module.exports[exportName];
}

const urls = [];
for (const match of channelMap.matches || []) {
  if (match.tmallProductUrl) {
    urls.push(["tmall", match.tmallProductUrl]);
  }
  if (match.jdProductUrl) {
    urls.push(["jd", match.jdProductUrl]);
  }
}

const products = loadTsExport(src("data", "catalog", "products.ts"), "baseCatalogProducts");
const generatedOverrides = JSON.parse(fs.readFileSync(src("data", "catalog", "generated-overrides.json"), "utf8"));
const manualOverrides = loadTsExport(src("data", "catalog", "manual-overrides.ts"), "manualProductOverrides") || {};
const mergeOverride = (product, override = {}) => ({
  ...product,
  ...override,
  channelLinks: {
    tmall: { ...product.channelLinks.tmall, ...(override.channelLinks?.tmall || {}) },
    jd: { ...product.channelLinks.jd, ...(override.channelLinks?.jd || {}) }
  }
});

for (const product of products
  .map((item) => mergeOverride(item, generatedOverrides[item.id]))
  .map((item) => mergeOverride(item, manualOverrides[item.id]))
  .filter((item) => item.status === "active" && item.visible && item.publishReady && item.manualReviewed === true && item.contentStatus === "ready")) {
  for (const channel of ["tmall", "jd"]) {
    const link = product.channelLinks[channel];
    if (link?.enabled && link.verified && link.url) {
      urls.push([channel, link.url]);
    }
  }
}

const uniqueUrls = Array.from(new Map(urls.map(([channel, url]) => [`${channel}:${url}`, [channel, url]])).values());

if (uniqueUrls.length === 0) {
  console.log("[catalog:check-links] no confirmed product links to check");
  process.exit(0);
}

for (const [channel, url] of uniqueUrls) {
  try {
    const response = await fetch(url, { method: "HEAD", redirect: "manual" });
    console.log(`[catalog:check-links] ${channel} ${url} -> ${response.status}`);
  } catch (error) {
    console.warn(`[catalog:check-links] ${channel} ${url} failed: ${error instanceof Error ? error.message : error}`);
  }
}
