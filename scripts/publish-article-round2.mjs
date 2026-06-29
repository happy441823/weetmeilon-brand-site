import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const database = "sweetmeilon-cms-prod";
const now = new Date().toISOString();

const articles = [
  {
    file: "ARTICLE_ROUND2_DRAFT_OFFICIAL_CHANNEL_GUIDE.md",
    slug: "official-site-to-tmall",
    category: { id: "article-category-official-channel", name: "官方渠道", slug: "official-channel" },
    tags: ["官方渠道", "购买前确认", "隐私说明"],
    sortOrder: 31,
  },
  {
    file: "ARTICLE_ROUND2_DRAFT_PRODUCT_PHOTO_CHECKLIST.md",
    slug: "material-photo-checklist",
    category: { id: "article-category-buying-before", name: "购买前确认", slug: "buying-before" },
    tags: ["产品图", "购买前确认", "清洁收纳"],
    sortOrder: 32,
  },
  {
    file: "ARTICLE_ROUND2_DRAFT_BEGINNER_BUYING_CHECKLIST.md",
    slug: "beginner-buying-questions",
    category: { id: "article-category-buying-before", name: "购买前确认", slug: "buying-before" },
    tags: ["新手指南", "购买前确认", "隐私说明"],
    sortOrder: 33,
  },
  {
    file: "ARTICLE_ROUND2_DRAFT_PRODUCT_INFO_CONFIRMATION.md",
    slug: "product-info-before-buying",
    category: { id: "article-category-buying-before", name: "购买前确认", slug: "buying-before" },
    tags: ["商品信息", "购买前确认", "官方渠道"],
    sortOrder: 34,
  },
  {
    file: "ARTICLE_ROUND2_DRAFT_WEEKLY_CARE_ROUTINE.md",
    slug: "weekly-care-routine",
    category: { id: "article-category-cleaning-guide", name: "清洁指南", slug: "cleaning-guide" },
    tags: ["清洁指南", "收纳护理", "日常维护"],
    sortOrder: 35,
  },
];

const forbidden = [
  "真人",
  "熟女",
  "可插入",
  "超大屁股",
  "充气娃娃",
  "成人男士性用品",
  "付款人数",
  "近365天付款",
  "销量",
  "实时价格",
  "库存",
  "优惠",
  "治疗",
  "改善疾病",
  "医疗级",
  "100%",
  "最强",
  "全网第一",
  "原生肌凝硅",
  "Native Skin Silicone",
  "native-skin-silicone",
];

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineMarkdown(value) {
  return escapeHtml(value).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const safeHref = href.startsWith("/") || href.startsWith("https://sweetmeilon.com/");
    if (!safeHref) return label;
    return `<a href="${href}">${label}</a>`;
  });
}

function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  let list = [];
  const flushList = () => {
    if (!list.length) return;
    html.push(`<ul>${list.map((item) => `<li>${inlineMarkdown(item)}</li>`).join("")}</ul>`);
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }
    if (line.startsWith("# ")) continue;
    if (line.startsWith("### ")) {
      flushList();
      html.push(`<h3>${inlineMarkdown(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith("## ")) {
      flushList();
      html.push(`<h2>${inlineMarkdown(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith("- ")) {
      list.push(line.slice(2));
      continue;
    }
    flushList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }
  flushList();
  return html.join("\n");
}

function parseDraft(file) {
  const markdown = readFileSync(file, "utf8");
  const [metaPart, ...bodyParts] = markdown.split(/\n---\n/);
  const body = bodyParts.join("\n---\n").trim();
  const title = metaPart.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const meta = {};
  for (const match of metaPart.matchAll(/^([a-z_]+):\s+`([^`]*)`/gm)) {
    meta[match[1]] = match[2].trim();
  }
  if (!title || !meta.slug || !meta.seo_title || !meta.seo_description || !meta.excerpt || !meta.canonical) {
    throw new Error(`${file} metadata is incomplete`);
  }
  const faq = [...body.matchAll(/^###\s+(.+)\n\n([\s\S]*?)(?=\n###|\n##|\n*$)/gm)]
    .filter((entry) => body.slice(0, entry.index).includes("## FAQ"))
    .map((entry) => ({ question: entry[1].trim(), answer: entry[2].trim().replace(/\n+/g, " ") }));
  const relatedLinks = [...body.matchAll(/^- \[([^\]]+)\]\(([^)]+)\)$/gm)].map((entry) => ({
    label: entry[1],
    href: entry[2],
  }));
  const blocks = [...body.matchAll(/^##\s+(.+)\n([\s\S]*?)(?=\n##\s+|\n*$)/gm)].map((entry) => ({
    type: entry[1].trim() === "FAQ" ? "faq" : "section",
    title: entry[1].trim(),
    markdown: entry[2].trim(),
  }));
  return {
    title,
    slug: meta.slug,
    seoTitle: meta.seo_title,
    seoDescription: meta.seo_description,
    excerpt: meta.excerpt,
    canonical: meta.canonical,
    body,
    bodyHtml: markdownToHtml(body),
    blocks,
    faq,
    relatedLinks,
    markdown,
  };
}

const parsed = articles.map((entry) => ({ ...entry, draft: parseDraft(entry.file) }));
const scanHits = parsed.flatMap((entry) =>
  forbidden
    .filter((word) => entry.draft.markdown.includes(word))
    .map((word) => `${entry.slug}: ${word}`),
);
if (scanHits.length) {
  throw new Error(`Risk words found:\n${scanHits.join("\n")}`);
}

const sqlLines = [
  "PRAGMA foreign_keys = ON;",
];

const categories = new Map(parsed.map((entry) => [entry.category.id, entry.category]));
for (const category of categories.values()) {
  sqlLines.push(
    `INSERT INTO article_categories (id, name, slug, sort_order, is_active, created_at, updated_at)
VALUES (${sql(category.id)}, ${sql(category.name)}, ${sql(category.slug)}, 50, 1, ${sql(now)}, ${sql(now)})
ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, is_active=1, updated_at=excluded.updated_at;`,
  );
}

for (const entry of parsed) {
  const draft = entry.draft;
  const contentBlocks = {
    version: 1,
    source: "ARTICLE_ROUND2",
    blocks: draft.blocks,
    faq: draft.faq,
    related_links: draft.relatedLinks,
  };

  sqlLines.push(
    `UPDATE articles SET
  title=${sql(draft.title)},
  subtitle=NULL,
  excerpt=${sql(draft.excerpt)},
  author=${sql("SWEETMEILON 编辑部")},
  category_id=${sql(entry.category.id)},
  status='published',
  featured=0,
  pinned=0,
  sort_order=${entry.sortOrder},
  body_html=${sql(draft.bodyHtml)},
  markdown_source=${sql(draft.body)},
  content_blocks_json=${sql(JSON.stringify(contentBlocks))},
  toc_json=${sql(JSON.stringify(draft.blocks.filter((block) => block.type === "section").map((block) => block.title)))},
  seo_title=${sql(draft.seoTitle)},
  seo_description=${sql(draft.seoDescription)},
  canonical_url=${sql(draft.canonical)},
  keywords_json=${sql(JSON.stringify(entry.tags))},
  indexable=1,
  structured_data_type='Article',
  first_published_at=COALESCE(first_published_at, ${sql(now)}),
  published_at=${sql(now)},
  scheduled_at=NULL,
  updated_at=${sql(now)}
WHERE slug=${sql(entry.slug)};`,
  );
  sqlLines.push(`DELETE FROM article_tag_relations WHERE article_id = (SELECT id FROM articles WHERE slug=${sql(entry.slug)});`);
  for (const tag of entry.tags) {
    const tagId = `article-tag-${tag.toLowerCase().replaceAll(/\s+/g, "-")}`;
    sqlLines.push(
      `INSERT INTO article_tags (id, name, slug, created_at, updated_at)
VALUES (${sql(tagId)}, ${sql(tag)}, ${sql(tagId.replace("article-tag-", ""))}, ${sql(now)}, ${sql(now)})
ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, updated_at=excluded.updated_at;`,
    );
    sqlLines.push(
      `INSERT OR IGNORE INTO article_tag_relations (article_id, tag_id)
SELECT id, ${sql(tagId)} FROM articles WHERE slug=${sql(entry.slug)};`,
    );
  }
}

const sqlPath = "ARTICLE_ROUND2_PUBLISH.sql";
writeFileSync(sqlPath, `${sqlLines.join("\n\n")}\n`, "utf8");

function runCmd(command) {
  return spawnSync("cmd.exe", ["/d", "/s", "/c", command], { stdio: "pipe", encoding: "utf8" });
}

const execute = spawnSync(
  "cmd.exe",
  ["/d", "/s", "/c", `npx.cmd wrangler d1 execute ${database} --remote --file ${sqlPath}`],
  { stdio: "pipe", encoding: "utf8" },
);

const verifyPath = "ARTICLE_ROUND2_VERIFY.sql";
writeFileSync(
  verifyPath,
  `SELECT slug, status, indexable, published_at FROM articles WHERE slug IN (${parsed.map((entry) => sql(entry.slug)).join(",")}) ORDER BY sort_order;\n`,
  "utf8",
);
const verify = runCmd(`npx.cmd wrangler d1 execute ${database} --remote --json --file ${verifyPath}`);

function commandOutput(result) {
  return [
    result.stdout || "",
    result.stderr || "",
    result.error ? String(result.error.stack || result.error.message || result.error) : "",
  ].filter(Boolean).join("\n").trim();
}

const report = [
  "# ARTICLE ROUND2 CMS PUBLISH REPORT",
  "",
  `Generated at: ${now}`,
  `Database: ${database}`,
  "",
  "## Published Articles",
  "",
  ...parsed.flatMap((entry) => [
    `- ${entry.draft.title}`,
    `  - slug: ${entry.slug}`,
    `  - status: published`,
    `  - indexable: true`,
    `  - category: ${entry.category.name}`,
    `  - canonical: ${entry.draft.canonical}`,
  ]),
  "",
  "## Safety Checks",
  "",
  `- Risk word scan: ${scanHits.length === 0 ? "passed" : "failed"}`,
  "- Product data modified: no",
  "- Cloudflare config modified: no",
  "- Deployment triggered: no",
  "- IndexNow auto submit changed: no",
  "",
  "## Wrangler Execute Output",
  "",
  "```text",
  commandOutput(execute),
  "```",
  "",
  "## D1 Verify Output",
  "",
  "```json",
  commandOutput(verify),
  "```",
  "",
].join("\n");

writeFileSync("ARTICLE_ROUND2_CMS_PUBLISH_REPORT.md", report, "utf8");

if (execute.status !== 0) {
  console.error(commandOutput(execute));
  process.exit(execute.status);
}
if (verify.status !== 0) {
  console.error(commandOutput(verify));
  process.exit(verify.status);
}

console.log(report);
