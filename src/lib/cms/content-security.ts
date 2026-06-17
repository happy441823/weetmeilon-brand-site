const dangerousTagBlocks = /<(script|style|iframe|object|embed|svg|math)\b[\s\S]*?<\/\1>/gi;
const dangerousVoidTags = /<(script|style|iframe|object|embed|svg|math)\b[^>]*\/?>/gi;
const eventAttributes = /\s+on[a-z]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const styleAttributes = /\s+style\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi;
const dangerousUrls = /\s+(href|src|xlink:href)\s*=\s*(["']?)\s*(javascript:|data:)[\s\S]*?\2/gi;
const allowedBlockTypes = new Set(["paragraph", "heading", "image", "gallery", "quote", "product_list", "faq"]);
const allowedModuleTypes = new Set(["hero", "product_grid", "article_grid", "faq", "rich_text", "media", "cta"]);

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeHtml(input: unknown) {
  return String(input || "")
    .replace(dangerousTagBlocks, "")
    .replace(dangerousVoidTags, "")
    .replace(eventAttributes, "")
    .replace(styleAttributes, "")
    .replace(dangerousUrls, "")
    .replace(/\s+srcdoc\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "");
}

export function markdownToSafeHtml(input: unknown) {
  const precleaned = String(input || "")
    .replace(dangerousTagBlocks, "")
    .replace(dangerousVoidTags, "")
    .replace(eventAttributes, "")
    .replace(styleAttributes, "")
    .replace(dangerousUrls, "");
  const escaped = escapeHtml(precleaned);
  const html = escaped
    .split(/\n{2,}/)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("### ")) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
      if (trimmed.startsWith("# ")) return `<h1>${trimmed.slice(2)}</h1>`;
      return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
  return sanitizeHtml(html);
}

function assertPlainObject(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("JSON 内容块必须是对象。");
  }
}

function assertSafeString(value: unknown, label: string) {
  if (typeof value !== "string") {
    return;
  }
  if (/(<script|<iframe|<svg|javascript:|data:text\/html|onerror=|onclick=)/i.test(value)) {
    throw new Error(`${label} 包含不安全内容。`);
  }
}

export function validateContentBlocksJson(value: unknown) {
  const blocks = typeof value === "string" ? JSON.parse(value || "[]") : value;
  if (!Array.isArray(blocks)) {
    throw new Error("content_blocks_json 必须是数组。");
  }
  for (const block of blocks) {
    assertPlainObject(block);
    const type = String(block.type || "");
    if (!allowedBlockTypes.has(type)) {
      throw new Error(`不支持的内容块类型：${type}`);
    }
    for (const [key, entryValue] of Object.entries(block)) {
      assertSafeString(entryValue, `内容块 ${key}`);
    }
  }
  return JSON.stringify(blocks);
}

export function validateModulesJson(value: unknown) {
  const modules = typeof value === "string" ? JSON.parse(value || "[]") : value;
  if (!Array.isArray(modules)) {
    throw new Error("modules_json 必须是数组。");
  }
  for (const module of modules) {
    assertPlainObject(module);
    const type = String(module.type || "");
    if (!allowedModuleTypes.has(type)) {
      throw new Error(`不支持的页面模块类型：${type}`);
    }
    for (const [key, entryValue] of Object.entries(module)) {
      assertSafeString(entryValue, `页面模块 ${key}`);
    }
  }
  return JSON.stringify(modules);
}

export function validateConfigJson(value: unknown) {
  const config = typeof value === "string" ? JSON.parse(value || "{}") : value;
  assertPlainObject(config);
  for (const [key, entryValue] of Object.entries(config)) {
    assertSafeString(entryValue, `配置 ${key}`);
  }
  return JSON.stringify(config);
}

export function normalizeCmsJsonField(name: string, value: unknown, fallback: string) {
  if (name === "content_blocks_json") return validateContentBlocksJson(value);
  if (name === "modules_json") return validateModulesJson(value);
  if (name === "config_json") return validateConfigJson(value);
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return JSON.stringify(value);
  JSON.parse(value);
  return value;
}
