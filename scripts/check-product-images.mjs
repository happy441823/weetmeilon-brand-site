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
      if (request.endsWith("generated-overrides.json")) {
        return JSON.parse(fs.readFileSync(src("data", "catalog", "generated-overrides.json"), "utf8"));
      }
      if (request.includes("manual-overrides")) {
        return {
          manualProductOverrides: loadTsExport(src("data", "catalog", "manual-overrides.ts"), "manualProductOverrides")
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

function readImageSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  if (buffer.slice(0, 4).toString("hex") === "52494646" && buffer.slice(8, 12).toString("ascii") === "WEBP") {
    const chunk = buffer.slice(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      const width = 1 + buffer.readUIntLE(24, 3);
      const height = 1 + buffer.readUIntLE(27, 3);
      return { width, height };
    }
    if (chunk === "VP8 ") {
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      return { width, height };
    }
    if (chunk === "VP8L") {
      const bits = buffer.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

const products = loadTsExport(src("data", "catalog", "products.ts"), "baseCatalogProducts");
const overrides = JSON.parse(fs.readFileSync(src("data", "catalog", "generated-overrides.json"), "utf8"));
const manualOverrides = loadTsExport(src("data", "catalog", "manual-overrides.ts"), "manualProductOverrides") || {};
const mergeOverride = (product, override = {}) => ({
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
});
const merged = products
  .map((product) => mergeOverride(product, overrides[product.id]))
  .map((product) => mergeOverride(product, manualOverrides[product.id]));
const errors = [];
const warnings = [];

for (const product of merged) {
  const imagePath = product.coverImage ? path.join(root, "public", product.coverImage.replace(/^\//, "")) : "";
  const hasImage = imagePath && fs.existsSync(imagePath);
  const isPublicActive = product.status === "active"
    && product.visible === true
    && product.publishReady === true
    && product.manualReviewed === true
    && product.contentStatus === "ready";

  if (isPublicActive) {
    if (!product.coverImage?.includes("/approved/")) {
      errors.push(`${product.id} publishReady=true 但 coverImage 不是 approved 路径`);
    }
    if (!hasImage) {
      errors.push(`${product.id} publishReady=true 但图片不存在: ${product.coverImage}`);
    }
  }

  if (isPublicActive && hasImage && product.coverImage.includes("/approved/cover.webp")) {
    const size = readImageSize(imagePath);
    if (!size) {
      warnings.push(`${product.id} 无法读取 WebP 尺寸: ${product.coverImage}`);
    } else if (size.width !== 1200 || size.height !== 900) {
      errors.push(`${product.id} approved cover 尺寸应为 1200x900，当前 ${size.width}x${size.height}`);
    }
    const fileSize = fs.statSync(imagePath).size;
    if (fileSize > 900 * 1024) {
      warnings.push(`${product.id} approved cover 文件偏大: ${Math.round(fileSize / 1024)}KB`);
    }
  }
}

for (const warning of warnings) {
  console.warn(`[catalog:image-warning] ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`[catalog:image-error] ${error}`);
  }
  process.exit(1);
}

console.log(`[catalog] image check passed, approved=${merged.filter((product) => product.coverImage?.includes("/approved/cover.webp")).length}`);
