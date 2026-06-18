export type ImportPlatform = "tmall" | "jd" | "unknown";

export type PlatformDetection = {
  platform: ImportPlatform;
  normalizedUrl: string;
  productId: string | null;
  host: string;
};

const allowedHosts = [
  "tmall.com",
  "detail.tmall.com",
  "taobao.com",
  "item.jd.com",
  "mall.jd.com",
  "3.cn",
  "jd.com"
];

function isAllowedHost(host: string) {
  return allowedHosts.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

function detectPlatform(host: string): ImportPlatform {
  if (host.includes("tmall.com") || host.includes("taobao.com")) return "tmall";
  if (host.includes("jd.com") || host.endsWith("3.cn")) return "jd";
  return "unknown";
}

function readProductId(url: URL, platform: ImportPlatform) {
  const candidates = [
    url.searchParams.get("id"),
    url.searchParams.get("itemId"),
    url.searchParams.get("sku"),
    url.searchParams.get("skuId"),
    url.searchParams.get("wareId")
  ].filter(Boolean);
  if (candidates[0]) return candidates[0];

  if (platform === "jd") {
    const match = url.pathname.match(/\/(\d+)\.html$/);
    return match?.[1] || null;
  }
  return null;
}

export function detectImportPlatform(input: string): PlatformDetection {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("请输入完整的 https 商品链接。");
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("只允许 http/https 商品链接。");
  }
  if (url.protocol === "http:") {
    url.protocol = "https:";
  }
  url.hash = "";

  const host = url.hostname.toLowerCase();
  if (!isAllowedHost(host)) {
    throw new Error("只允许导入天猫、淘宝或京东的人工授权商品链接。");
  }

  const platform = detectPlatform(host);
  if (platform === "unknown") {
    throw new Error("无法识别商品平台。");
  }

  return {
    platform,
    normalizedUrl: url.toString(),
    productId: readProductId(url, platform),
    host
  };
}

export function parseUrlLines(input: string, maxUrls = 50) {
  const urls = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(urls));
  if (unique.length > maxUrls) {
    throw new Error(`单次最多允许导入 ${maxUrls} 个链接。`);
  }
  return unique;
}
