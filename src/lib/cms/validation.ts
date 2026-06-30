import { articleStatusOptions, productStatusOptions } from "./schema";
import { markdownToSafeHtml, normalizeCmsJsonField, sanitizeHtml } from "./content-security";

const blockedProtocols = /^(javascript|data):/i;

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&#x([0-9a-f]+);?/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_match, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&colon;/gi, ":")
    .replace(/&sol;/gi, "/")
    .replace(/&Tab;/gi, "\t")
    .replace(/&NewLine;/gi, "\n")
    .replace(/&amp;/gi, "&");
}

function normalizeUrlForValidation(value: string) {
  return decodeHtmlEntities(value)
    .trim()
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f\s]+/g, "");
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

export function assertAsciiKebabSlug(value: unknown, label = "Slug") {
  const slug = String(value || "").trim();
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${label} format is invalid. Use lowercase letters, numbers, and hyphens.`);
  }
  return slug;
}

export function sanitizeText(input: unknown) {
  return typeof input === "string" ? input.trim() : "";
}

export function assertSafeUrl(value: string, label = "链接") {
  const url = normalizeUrlForValidation(value);
  if (!url) {
    return "";
  }
  if (blockedProtocols.test(url)) {
    throw new Error(`${label} 不允许使用 javascript: 或 data: 协议。`);
  }
  if (url.startsWith("//")) {
    throw new Error(`${label} 不允许使用协议相对 URL。`);
  }
  if (url.startsWith("/") || /^https?:\/\//i.test(url)) {
    return url;
  }
  throw new Error(`${label} 必须是站内路径或 http/https URL。`);
}

export function normalizeJsonText(value: unknown, fallback: string) {
  return normalizeCmsJsonField("", value, fallback);
}

export function normalizeCmsFieldValue(name: string, value: unknown, fallback: string) {
  if (name.endsWith("_json")) {
    return normalizeCmsJsonField(name, value, fallback);
  }
  if (name === "body_html") {
    return sanitizeHtml(value);
  }
  if (name === "markdown_source") {
    return String(value || "");
  }
  return value;
}

export function markdownSourceToHtml(value: unknown) {
  return markdownToSafeHtml(value);
}

export function validateSeo(input: { seo_title?: string | null; seo_description?: string | null }) {
  const issues: string[] = [];
  if (input.seo_title && input.seo_title.length > 70) {
    issues.push("SEO 标题建议不超过 70 个字符。");
  }
  if (input.seo_description && input.seo_description.length > 160) {
    issues.push("SEO 描述建议不超过 160 个字符。");
  }
  return issues;
}

export function validateArticlePublish(input: {
  title?: string | null;
  excerpt?: string | null;
  body_html?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
}) {
  const blocking: string[] = [];
  const warnings = validateSeo(input);
  if (!input.title) blocking.push("文章标题不能为空。");
  if (!input.excerpt) warnings.push("文章摘要为空。");
  if (!input.body_html || input.body_html.replace(/<[^>]*>/g, "").trim().length < 200) {
    warnings.push("正文偏短，建议发布前补充完整内容。");
  }
  if (input.body_html && !/<h2[\s>]/i.test(input.body_html)) {
    warnings.push("正文缺少 H2，小标题有助于阅读和 SEO。");
  }
  return { blocking, warnings };
}

export function validateProductPublish(input: {
  name?: string | null;
  slug?: string | null;
  status?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  tmall_url?: string | null;
  jd_url?: string | null;
}) {
  const blocking: string[] = [];
  const warnings = validateSeo(input);
  if (!input.name) blocking.push("商品名称不能为空。");
  if (!input.slug) blocking.push("商品 slug 不能为空。");
  if (input.status && !productStatusOptions.some((option) => option.value === input.status)) {
    blocking.push("商品状态不合法。");
  }
  if (!input.tmall_url && !input.jd_url) {
    warnings.push("商品缺少天猫或京东购买链接。");
  }
  return { blocking, warnings };
}

export function isValidArticleStatus(status: string) {
  return articleStatusOptions.some((option) => option.value === status);
}
