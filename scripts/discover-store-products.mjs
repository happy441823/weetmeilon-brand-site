import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const storeSourcesPath = path.join(root, "data", "catalog", "store-sources.json");
const rawDir = path.join(root, "data", "catalog", "raw");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchStore(store) {
  const startedAt = new Date().toISOString();
  try {
    const response = await fetch(store.storeUrl, {
      redirect: "follow",
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; SWEETMEILONCatalogCheck/1.0)",
        "accept-language": "zh-CN,zh;q=0.9"
      }
    });
    const text = await response.text();
    const title = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
    const products = [];

    return {
      channel: store.channel,
      storeUrl: store.storeUrl,
      storeName: store.storeName,
      collectedAt: startedAt,
      collectionMethod: "public_page",
      httpStatus: response.status,
      accessStatus: products.length > 0 ? "products_found" : "store_checked_no_product_urls",
      pageTitle: title,
      note: "脚本只读取公开 HTML，不绕过登录、验证码或动态接口限制。未稳定识别商品详情页时保持空数组。",
      products
    };
  } catch (error) {
    return {
      channel: store.channel,
      storeUrl: store.storeUrl,
      storeName: store.storeName,
      collectedAt: startedAt,
      collectionMethod: "public_page",
      accessStatus: "fetch_failed",
      note: error instanceof Error ? error.message : String(error),
      products: []
    };
  }
}

const storeSources = JSON.parse(await fs.readFile(storeSourcesPath, "utf8"));
await fs.mkdir(rawDir, { recursive: true });

for (const store of storeSources.stores) {
  const snapshot = await fetchStore(store);
  const fileName = `${store.channel}-products.json`;
  await fs.writeFile(path.join(rawDir, fileName), JSON.stringify(snapshot, null, 2), "utf8");
  console.log(`[catalog:discover] wrote data/catalog/raw/${fileName}`);
  await sleep(1800);
}
