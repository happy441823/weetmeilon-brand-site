const forbiddenTags = new Set(["script", "style", "iframe", "object", "embed", "svg", "math", "link", "meta", "base", "form"]);
const allowedTags = new Set(["p", "br", "strong", "b", "em", "i", "u", "s", "a", "ul", "ol", "li", "blockquote", "h2", "h3", "h4", "table", "thead", "tbody", "tr", "th", "td", "img", "figure", "figcaption", "code", "pre"]);
const globalAttrs = new Set(["class"]);
const allowedAttrs: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  th: new Set(["colspan", "rowspan"]),
  td: new Set(["colspan", "rowspan"])
};

const blockSchemas: Record<string, Record<string, "string" | "number" | "boolean" | "string[]" | "object[]" | "object">> = {
  paragraph: { type: "string", text: "string" },
  heading: { type: "string", level: "number", text: "string" },
  image: { type: "string", media_id: "string", alt: "string", caption: "string" },
  gallery: { type: "string", items: "object[]" },
  quote: { type: "string", text: "string", cite: "string" },
  product_card: { type: "string", product_id: "string" },
  product_list: { type: "string", product_ids: "string[]" },
  related_articles: { type: "string", article_ids: "string[]" },
  cta: { type: "string", label: "string", href: "string" },
  table: { type: "string", rows: "object[]" },
  faq: { type: "string", faq_ids: "string[]" }
};

const moduleSchemas: Record<string, Record<string, "string" | "number" | "boolean" | "string[]" | "object[]" | "object">> = {
  hero: { type: "string", title: "string", subtitle: "string", media_id: "string", cta_label: "string", cta_href: "string" },
  product_grid: { type: "string", title: "string", product_ids: "string[]" },
  article_grid: { type: "string", title: "string", article_ids: "string[]" },
  faq: { type: "string", title: "string", faq_ids: "string[]" },
  rich_text: { type: "string", body_html: "string" },
  media: { type: "string", media_id: "string", alt: "string" },
  cta: { type: "string", label: "string", href: "string" }
};

function decodeHtmlEntities(input: string) {
  return input
    .replace(/&#x([0-9a-f]+);?/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#([0-9]+);?/g, (_match, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&colon;/gi, ":")
    .replace(/&sol;/gi, "/")
    .replace(/&Tab;/gi, "\t")
    .replace(/&NewLine;/gi, "\n")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeUrl(value: string) {
  return decodeHtmlEntities(value)
    .trim()
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f\s]+/g, "");
}

function isSafeUrl(value: string) {
  const url = normalizeUrl(value);
  if (!url || /^\/\//.test(url)) return false;
  if (/^(javascript|data|vbscript|file):/i.test(url)) return false;
  return url.startsWith("/") || /^https?:\/\//i.test(url);
}

function sanitizeAttributes(tag: string, attrs: string) {
  const allowed = allowedAttrs[tag] || new Set<string>();
  const output: string[] = [];
  const attrPattern = /([:\w-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>`]+)))?/g;
  for (const match of attrs.matchAll(attrPattern)) {
    const name = match[1].toLowerCase();
    const rawValue = match[3] ?? match[4] ?? match[5] ?? "";
    const value = decodeHtmlEntities(rawValue).replace(/[\u0000-\u001f\u007f]/g, "").trim();
    if (name.startsWith("on") || name === "style" || name === "srcdoc" || name === "srcset" || name === "formaction" || name === "rel" || name.includes(":")) continue;
    if (!globalAttrs.has(name) && !allowed.has(name)) continue;
    if ((name === "href" || name === "src") && !isSafeUrl(value)) continue;
    if (tag === "a" && name === "target" && value !== "_blank") continue;
    output.push(`${name}="${escapeHtml(value)}"`);
  }
  if (tag === "a" && output.some((attr) => attr.startsWith("target="))) {
    output.push('rel="noopener noreferrer"');
  }
  return output.length ? ` ${output.join(" ")}` : "";
}

export function sanitizeHtml(input: unknown) {
  let html = String(input || "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<\s*(script|style|iframe|object|embed|svg|math|link|meta|base|form)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  html = html.replace(/<\s*(script|style|iframe|object|embed|svg|math|link|meta|base|form)\b[^>]*\/?\s*>/gi, "");
  html = html.replace(/<\s*\/?\s*([a-z0-9-]+)([^>]*)>/gi, (match, rawTag: string, attrs: string) => {
    const closing = /^<\s*\//.test(match);
    const tag = rawTag.toLowerCase();
    if (forbiddenTags.has(tag)) return "";
    if (!allowedTags.has(tag)) return "";
    if (closing) return `</${tag}>`;
    if (tag === "br") return "<br>";
    return `<${tag}${sanitizeAttributes(tag, attrs || "")}>`;
  });
  return html;
}

export function markdownToSafeHtml(input: unknown) {
  const escaped = escapeHtml(String(input || ""));
  const html = escaped
    .split(/\n{2,}/)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("#### ")) return `<h4>${trimmed.slice(5)}</h4>`;
      if (trimmed.startsWith("### ")) return `<h3>${trimmed.slice(4)}</h3>`;
      if (trimmed.startsWith("## ")) return `<h2>${trimmed.slice(3)}</h2>`;
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

function assertSafeScalar(value: unknown, label: string) {
  if (typeof value !== "string") return;
  const normalized = decodeHtmlEntities(value).normalize("NFKC").replace(/[\u0000-\u001f\u007f\s]+/g, "");
  if (/(<script|<style|<iframe|<object|<embed|<svg|<math|javascript:|data:text\/html|vbscript:|srcdoc=|onerror=|onclick=)/i.test(normalized)) {
    throw new Error(`${label} 包含不安全内容。`);
  }
}

function assertSafeRecursive(value: unknown, label: string) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeRecursive(item, `${label}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) {
      assertSafeRecursive(entry, `${label}.${key}`);
    }
    return;
  }
  assertSafeScalar(value, label);
}

function validateTypedValue(value: unknown, expected: string, label: string) {
  if (value == null || value === "") return;
  if (expected === "string" && typeof value !== "string") throw new Error(`${label} 必须是字符串。`);
  if (expected === "number" && typeof value !== "number") throw new Error(`${label} 必须是数字。`);
  if (expected === "boolean" && typeof value !== "boolean") throw new Error(`${label} 必须是布尔值。`);
  if (expected === "string[]" && (!Array.isArray(value) || value.some((item) => typeof item !== "string"))) throw new Error(`${label} 必须是字符串数组。`);
  if (expected === "object[]" && (!Array.isArray(value) || value.some((item) => !item || typeof item !== "object" || Array.isArray(item)))) throw new Error(`${label} 必须是对象数组。`);
  if (expected === "object") assertPlainObject(value);
  assertSafeRecursive(value, label);
}

function validateBlocks(value: unknown, schemas: typeof blockSchemas, fieldName: string) {
  const blocks = typeof value === "string" ? JSON.parse(value || "[]") : value;
  if (!Array.isArray(blocks)) {
    throw new Error(`${fieldName} 必须是数组。`);
  }
  for (const block of blocks) {
    assertPlainObject(block);
    const type = String(block.type || "");
    const schema = schemas[type];
    if (!schema) {
      throw new Error(`不支持的内容块类型：${type}`);
    }
    for (const key of Object.keys(block)) {
      if (!(key in schema)) {
        throw new Error(`${fieldName}.${type}.${key} 不是允许字段。`);
      }
    }
    for (const [key, expected] of Object.entries(schema)) {
      validateTypedValue(block[key], expected, `${fieldName}.${type}.${key}`);
    }
  }
  return JSON.stringify(blocks);
}

export function validateContentBlocksJson(value: unknown) {
  return validateBlocks(value, blockSchemas, "content_blocks_json");
}

export function validateModulesJson(value: unknown) {
  return validateBlocks(value, moduleSchemas, "modules_json");
}

export function validateConfigJson(value: unknown) {
  const config = typeof value === "string" ? JSON.parse(value || "{}") : value;
  assertPlainObject(config);
  assertSafeRecursive(config, "config_json");
  return JSON.stringify(config);
}

function normalizeGalleryJson(value: unknown, fallback: string) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") {
    assertSafeRecursive(value, "gallery_json");
    return JSON.stringify(value);
  }

  const raw = value.trim();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    assertSafeRecursive(parsed, "gallery_json");
    return JSON.stringify(parsed);
  } catch {
    const urls = Array.from(raw.matchAll(/https?:\/\/[^\s"',\]\)）]+|\/[^\s"',\]\)）]+/gi))
      .map((match) => normalizeUrl(match[0]).replace(/[，,。.;；]+$/g, ""))
      .filter((url) => isSafeUrl(url));
    const uniqueUrls = Array.from(new Set(urls));
    if (uniqueUrls.length === 0) {
      throw new Error("商品图集 JSON 格式不正确，请填写标准 JSON 数组，或直接粘贴一行一个的 http/https 图片链接。");
    }
    return JSON.stringify(uniqueUrls);
  }
}

function parsePlainLines(value: string) {
  return value
    .split(/\r?\n|[；;]/)
    .map((line) =>
      line
        .trim()
        .replace(/^[-*•]\s*/, "")
        .replace(/^\d+\s*[.|、:：｜|-]\s*/, "")
        .trim()
    )
    .filter(Boolean);
}

function normalizeStringArrayJson(name: string, value: unknown, fallback: string) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") {
    assertSafeRecursive(value, name);
    return JSON.stringify(value);
  }

  const raw = value.trim();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    assertSafeRecursive(parsed, name);
    return JSON.stringify(parsed);
  } catch {
    const lines = parsePlainLines(raw);
    if (lines.length === 0) {
      throw new Error(`${name} 格式不正确，请填写标准 JSON 数组，或直接填写一行一个的文字。`);
    }
    assertSafeRecursive(lines, name);
    return JSON.stringify(lines);
  }
}

function normalizeSpecificationsJson(value: unknown, fallback: string) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") {
    assertSafeRecursive(value, "specifications_json");
    return JSON.stringify(value);
  }

  const raw = value.trim();
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw);
    assertSafeRecursive(parsed, "specifications_json");
    return JSON.stringify(parsed);
  } catch {
    const items = parsePlainLines(raw).map((line) => {
      const separator = line.match(/\s*[:：｜|]\s*/);
      if (!separator || separator.index == null) {
        return { label: "说明", value: line };
      }
      const label = line.slice(0, separator.index).trim();
      const valueText = line.slice(separator.index + separator[0].length).trim();
      return { label: label || "说明", value: valueText || line };
    });
    if (items.length === 0) {
      throw new Error("规格 JSON 格式不正确，请填写标准 JSON 数组，或直接填写一行一个的“名称：内容”。");
    }
    assertSafeRecursive(items, "specifications_json");
    return JSON.stringify(items);
  }
}

export function normalizeCmsJsonField(name: string, value: unknown, fallback: string) {
  if (name === "content_blocks_json") return validateContentBlocksJson(value);
  if (name === "modules_json") return validateModulesJson(value);
  if (name === "config_json") return validateConfigJson(value);
  if (name === "gallery_json") return normalizeGalleryJson(value, fallback);
  if (name === "highlights_json" || name === "concerns_json") return normalizeStringArrayJson(name, value, fallback);
  if (name === "specifications_json") return normalizeSpecificationsJson(value, fallback);
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") {
    assertSafeRecursive(value, name || "json");
    return JSON.stringify(value);
  }
  const parsed = JSON.parse(value);
  assertSafeRecursive(parsed, name || "json");
  return JSON.stringify(parsed);
}
