import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const rawDir = path.join(root, "data", "catalog", "raw");
const normalizedPath = path.join(root, "data", "catalog", "normalized", "products.discovered.json");

function normalizeItem(item, channel) {
  return {
    discoveredId: `${channel}:${item.platformProductId || item.url || item.title}`,
    channel,
    originalTitle: item.title || "",
    cleanTitle: (item.title || "").replace(/官方旗舰店|旗舰店|优惠|促销/g, "").trim(),
    productUrl: item.url || null,
    imageUrl: item.imageUrl || null,
    platformProductId: item.platformProductId || null,
    suggestedCategoryId: item.suggestedCategoryId || null,
    confidence: item.url ? 0.7 : 0.2,
    collectedAt: item.collectedAt || null
  };
}

const files = ["tmall-products.json", "jd-products.json"];
const products = [];

for (const file of files) {
  const snapshot = JSON.parse(await fs.readFile(path.join(rawDir, file), "utf8"));
  for (const item of snapshot.products || []) {
    products.push(normalizeItem(item, snapshot.channel));
  }
}

await fs.mkdir(path.dirname(normalizedPath), { recursive: true });
await fs.writeFile(
  normalizedPath,
  JSON.stringify({ normalizedAt: new Date().toISOString(), products }, null, 2),
  "utf8"
);

console.log(`[catalog:normalize] normalized ${products.length} discovered products`);
