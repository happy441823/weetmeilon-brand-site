import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const normalizedPath = path.join(root, "data", "catalog", "normalized", "products.discovered.json");
const mapPath = path.join(root, "data", "catalog", "product-channel-map.json");
const reviewPath = path.join(root, "data", "catalog", "review", "product-matching.csv");

const normalized = JSON.parse(await fs.readFile(normalizedPath, "utf8"));
const tmall = normalized.products.filter((item) => item.channel === "tmall");
const jd = normalized.products.filter((item) => item.channel === "jd");
const matches = [];
const reviewRows = [
  "reviewId,tmallProductName,tmallProductUrl,jdProductName,jdProductUrl,matchStatus,confidence,reason,reviewStatus"
];

if (tmall.length === 0 && jd.length === 0) {
  reviewRows.push("half-body-public-review,半身款待确认,,半身款待确认,,needs_review,0,公开页面未返回可验证商品详情页；不得强行合并天猫与京东同款关系,open");
}

await fs.writeFile(
  mapPath,
  JSON.stringify(
    {
      updatedAt: new Date().toISOString(),
      matches,
      manualReview: [
        {
          reviewId: "half-body-public-review",
          productName: "半身款",
          tmallProductUrl: null,
          jdProductUrl: null,
          matchStatus: "needs_review",
          reason: "未能通过公开页面确认商品级链接和同款关系。"
        }
      ]
    },
    null,
    2
  ),
  "utf8"
);

await fs.mkdir(path.dirname(reviewPath), { recursive: true });
await fs.writeFile(reviewPath, `${reviewRows.join("\n")}\n`, "utf8");

console.log(`[catalog:match] confirmed matches=${matches.length}, review rows=${reviewRows.length - 1}`);
