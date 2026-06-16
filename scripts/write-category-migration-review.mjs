import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "data/catalog/review");
fs.mkdirSync(outDir, { recursive: true });

const overrides = JSON.parse(fs.readFileSync(path.join(root, "src/data/catalog/generated-overrides.json"), "utf8"));

function shapeSuggestion(title = "", oldCategory = "") {
  if (/胸|乳房/.test(title)) {
    return { shape: "chest-mold", confidence: "high", reason: "标题包含胸/乳房形态词" };
  }
  if (/腿|下半身|全腿|半腿/.test(title) || oldCategory === "hip-lower-body") {
    return { shape: "leg-or-hip-mold", confidence: "medium", reason: "标题或旧分类指向腿模/臀模/下半身，需要人工确认具体形态" };
  }
  if (/屁股|臀|臀部/.test(title)) {
    return { shape: "hip-mold", confidence: "high", reason: "标题包含臀部形态词" };
  }
  if (/半身/.test(title) || oldCategory === "half-body") {
    return { shape: "half-body", confidence: "medium", reason: "标题或旧分类指向半身形态" };
  }
  if (/收纳|清洁|护理/.test(title) || oldCategory === "care-accessories") {
    return { shape: "care-accessory", confidence: "high", reason: "护理/收纳配件，暂不进入主导航" };
  }
  if (/飞机杯|自慰器|名器/.test(title) || oldCategory === "local-mold") {
    return { shape: "local-mold-or-cup", confidence: "medium", reason: "可能为名器或飞机杯，需要确认是否独立飞机杯系列" };
  }
  return { shape: "", confidence: "low", reason: "标题无法稳定确认形态" };
}

function materialSuggestion(title = "") {
  if (/硅胶/.test(title)) {
    return { material: "silicone", primary: "silicone-mold", confidence: "medium", reason: "标题包含硅胶，但仍需图片/后台材质确认" };
  }
  if (/TPE/i.test(title)) {
    return { material: "tpe", primary: "tpe-mold", confidence: "medium", reason: "标题包含TPE，但仍需图片/后台材质确认" };
  }
  return { material: "", primary: "", confidence: "low", reason: "标题未明确TPE或硅胶，不猜材质" };
}

function subcategoryFor(material, shape) {
  if (!material) {
    return "";
  }
  if (shape === "hip-mold") {
    return `${material}-hip-mold`;
  }
  if (shape === "half-body") {
    return `${material}-half-body`;
  }
  if (shape === "chest-mold") {
    return `${material}-chest-mold`;
  }
  return "";
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

const header = [
  "productId",
  "sourceTitle",
  "currentDisplayName",
  "oldCategoryId",
  "suggestedPrimaryCategoryId",
  "suggestedSubcategoryId",
  "suggestedShape",
  "materialConfidence",
  "shapeConfidence",
  "categoryReviewStatus",
  "tmallUrl",
  "jdUrl",
  "notes"
];

const rows = Object.entries(overrides).map(([productId, product]) => {
  const title = product.sourceTitle || product.name || product.displayName || "";
  const shape = shapeSuggestion(title, product.categoryId || "");
  const material = materialSuggestion(title);
  const subcategory = subcategoryFor(material.material, shape.shape);
  const canSuggest = material.confidence !== "low" && shape.confidence === "high" && Boolean(subcategory);

  return {
    productId,
    sourceTitle: title,
    currentDisplayName: product.displayName || product.name || product.shortName || "",
    oldCategoryId: product.categoryId || "",
    suggestedPrimaryCategoryId: canSuggest ? material.primary : "",
    suggestedSubcategoryId: canSuggest ? subcategory : "",
    suggestedShape: shape.shape,
    materialConfidence: material.confidence,
    shapeConfidence: shape.confidence,
    categoryReviewStatus: "needs-review",
    tmallUrl: product.channelLinks?.tmall?.url || "",
    jdUrl: product.channelLinks?.jd?.url || "",
    notes: `${material.reason}；${shape.reason}；人工确认材质与形态后再迁移`
  };
});

const csv = [header.join(","), ...rows.map((row) => header.map((key) => csvCell(row[key])).join(","))].join("\n");
fs.writeFileSync(path.join(outDir, "category-migration-review.csv"), csv, "utf8");

const highConfidenceCount = rows.filter((row) => row.suggestedPrimaryCategoryId && row.suggestedSubcategoryId).length;
const needsReviewCount = rows.length - highConfidenceCount;

const summary = `# 商品分类迁移复核表

生成日期：2026-06-14

- 迁移对象：${rows.length} 个天猫在售商品覆盖记录。
- 可给出高置信度新分类建议：${highConfidenceCount} 个。
- 仍需人工确认材质或形态：${needsReviewCount} 个。
- 规则：无法从标题确认 TPE 或硅胶时，不自动猜测材质；无法确认具体形态时，不写入正式二级小类。
- 输出文件：data/catalog/review/category-migration-review.csv
`;

fs.writeFileSync(path.join(root, "CATEGORY_MIGRATION_REPORT.md"), summary, "utf8");
console.log(summary);
