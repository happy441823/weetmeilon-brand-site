import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const reviewDir = path.join(root, "data", "catalog", "review");

await fs.mkdir(reviewDir, { recursive: true });

await fs.writeFile(
  path.join(reviewDir, "products-review.csv"),
  [
    "productId,productName,status,visible,categoryId,seriesId,tmallUrl,jdUrl,reviewStatus,reason",
    "half-body-public-review,半身款（待官方链接复核）,draft,false,half-body,,,,needs_review,用户说明已上架；公开页面未确认商品级链接，暂不前台展示"
  ].join("\n") + "\n",
  "utf8"
);

await fs.writeFile(
  path.join(reviewDir, "category-suggestions.csv"),
  [
    "productId,productName,suggestedCategoryId,suggestedSeriesId,confidence,reason,reviewStatus",
    "half-body-public-review,半身款（待官方链接复核）,half-body,,0.8,用户明确说明为半身款；具体商品链接和系列仍待确认,open"
  ].join("\n") + "\n",
  "utf8"
);

console.log("[catalog:review] exported review CSV files");
