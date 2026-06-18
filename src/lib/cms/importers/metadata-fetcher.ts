import { detectImportPlatform } from "./platform-detect";

export type ProductMetadata = {
  platform: "tmall" | "jd" | "unknown";
  sourceUrl: string;
  sourceProductId: string | null;
  titleDetected: string;
  sourceShopName: string;
  imageUrls: string[];
  description: string;
  metadata: Record<string, unknown>;
};

function firstMatch(html: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtml(match[1].trim());
    }
  }
  return "";
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function collectOgImages(html: string) {
  const images = new Set<string>();
  const pattern = /<meta\s+[^>]*(?:property|name)=["']og:image(?::url)?["'][^>]*content=["']([^"']+)["'][^>]*>/gi;
  let match = pattern.exec(html);
  while (match) {
    const value = decodeHtml(match[1] || "").trim();
    if (value.startsWith("http://") || value.startsWith("https://")) {
      images.add(value);
    }
    match = pattern.exec(html);
  }
  return Array.from(images).slice(0, 12);
}

function parseJsonLd(html: string) {
  const blocks: unknown[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = pattern.exec(html);
  while (match) {
    try {
      blocks.push(JSON.parse(match[1].trim()));
    } catch {
      // Ignore malformed public JSON-LD.
    }
    match = pattern.exec(html);
  }
  return blocks.slice(0, 8);
}

export function extractPublicMetadata(sourceUrl: string, html: string): ProductMetadata {
  const detected = detectImportPlatform(sourceUrl);
  const titleDetected =
    firstMatch(html, [
      /<meta\s+[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i
    ]) || "";
  const description =
    firstMatch(html, [
      /<meta\s+[^>]*(?:property|name)=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
      /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i
    ]) || "";

  return {
    platform: detected.platform,
    sourceUrl: detected.normalizedUrl,
    sourceProductId: detected.productId,
    titleDetected,
    sourceShopName: firstMatch(html, [/shopName["']?\s*:\s*["']([^"']+)["']/i]),
    imageUrls: collectOgImages(html),
    description,
    metadata: {
      host: detected.host,
      jsonLd: parseJsonLd(html),
      extractedAt: new Date().toISOString(),
      complianceMode: "public-meta-only"
    }
  };
}

export async function fetchPublicMetadata(sourceUrl: string, options: { timeoutMs?: number; userAgent?: string } = {}) {
  const detected = detectImportPlatform(sourceUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs || 8000);
  try {
    const response = await fetch(detected.normalizedUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": options.userAgent || "SWEETMEILON-CMS-Importer/1.0",
        accept: "text/html,application/xhtml+xml"
      }
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("text/html")) {
      throw new Error("公开页面 metadata 读取失败，请改用手动填写或 CSV 导入。");
    }
    const html = await response.text();
    return extractPublicMetadata(detected.normalizedUrl, html.slice(0, 500_000));
  } finally {
    clearTimeout(timer);
  }
}
