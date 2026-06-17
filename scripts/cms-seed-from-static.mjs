#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const root = process.cwd();
const reportPath = path.join(root, "data", "cms-migration-report.json");

function readArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    if (["apply", "local", "remote", "yes", "print-sql"].includes(key)) {
      options[key] = true;
    } else {
      options[key] = argv[index + 1];
      index += 1;
    }
  }
  return options;
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function sqlString(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(path.join(root, file), "utf8"));
  } catch {
    return fallback;
  }
}

function isComingSoonProduct(product) {
  const text = `${product.name || ""} ${product.short_name || ""} ${product.slug || ""} ${product.subtitle || ""}`;
  return /原生肌凝硅|native-skin|coming_soon|即将/i.test(text);
}

export function buildProductSeedSql(products) {
  const rows = products
    .map((product) => {
      const columns = [
        "id",
        "name",
        "short_name",
        "slug",
        "subtitle",
        "status",
        "summary",
        "tmall_url",
        "jd_url",
        "tmall_enabled",
        "jd_enabled",
        "links_verified",
        "buy_button_enabled",
        "image_alt",
        "created_at",
        "updated_at"
      ];
      const values = columns.map((column) => sqlString(product[column]));
      const updates = columns
        .filter((column) => column !== "id")
        .map((column) => `${column} = excluded.${column}`)
        .join(", ");
      return `INSERT INTO products (${columns.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT(id) DO UPDATE SET ${updates};`;
    })
    .join("\n");

  return `PRAGMA foreign_keys = ON;\n${rows}\n`;
}

async function buildSeedData() {
  const adminProducts = await readJson("data/catalog/admin-products.json", []);
  const productMap = await readJson("data/catalog/product-channel-map.json", {});
  const products = [];
  const skipped = [];
  const seen = new Set();

  for (const item of adminProducts) {
    const slug = slugify(item.cardTitle || item.name || item.id);
    if (!slug || seen.has(slug)) {
      skipped.push({ type: "product", id: item.id, reason: "slug empty or duplicated" });
      continue;
    }
    seen.add(slug);
    const product = {
      id: String(item.id || crypto.randomUUID()),
      name: item.cardTitle || item.name,
      short_name: item.name,
      slug,
      subtitle: item.seriesLabel || "",
      status: "pending_review",
      summary: item.cardDescription || "",
      tmall_url: item.tmallUrl || null,
      jd_url: item.jdUrl || null,
      tmall_enabled: item.tmallUrl ? 1 : 0,
      jd_enabled: item.jdUrl ? 1 : 0,
      links_verified: 0,
      buy_button_enabled: 1,
      image_alt: item.cardTitle || item.name,
      created_at: item.createdAt || new Date().toISOString(),
      updated_at: item.updatedAt || new Date().toISOString()
    };
    if (isComingSoonProduct(product)) {
      product.status = "coming_soon";
      product.buy_button_enabled = 0;
      product.tmall_enabled = 0;
      product.jd_enabled = 0;
    }
    products.push(product);
  }

  return {
    source: {
      adminProducts: adminProducts.length,
      productChannelMapKeys: Object.keys(productMap).length
    },
    result: {
      products: products.length,
      articles: 0,
      faqs: 0,
      pages: 0,
      skipped: skipped.length,
      failed: 0
    },
    skipped,
    products
  };
}

async function writeReport(report) {
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

async function applySql(sql, options) {
  if (!options.database) throw new Error("--database is required with --apply.");
  if (!options.local && !options.remote) throw new Error("Choose --local or --remote with --apply.");
  if (options.local && options.remote) throw new Error("Choose only one of --local or --remote.");
  if (!options.yes) throw new Error("--yes is required before writing to D1.");

  const dir = await mkdtemp(path.join(tmpdir(), "sweetmeilon-cms-seed-"));
  const file = path.join(dir, "seed.sql");
  await writeFile(file, sql, "utf8");
  const args = ["wrangler", "d1", "execute", String(options.database), "--file", file];
  if (options.env) args.push("--env", String(options.env));
  args.push(options.remote ? "--remote" : "--local");
  try {
    const result = spawnSync("npx.cmd", args, { stdio: "inherit", shell: false });
    if (result.status !== 0) throw new Error(`wrangler d1 execute failed with exit code ${result.status}`);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function main() {
  const options = readArgs(process.argv.slice(2));
  const data = await buildSeedData();
  const sql = buildProductSeedSql(data.products);
  const report = {
    generatedAt: new Date().toISOString(),
    dryRun: !options.apply,
    applied: Boolean(options.apply),
    source: data.source,
    result: data.result,
    skipped: data.skipped,
    manualReviewRequired: [
      "文章、FAQ 和页面仍需在 Preview D1 中按内容负责人复核后导入。",
      "图片文件需先上传到开发 R2，再补齐 media_assets 与产品主图关联。",
      "原生肌凝硅相关商品在 seed 中会强制 coming_soon 且 buy_button_enabled=false。"
    ],
    products: data.products
  };

  if (options["print-sql"]) {
    console.log(sql);
  }
  if (options.apply) {
    await applySql(sql, options);
  }
  await writeReport(report);
  console.log(`CMS migration report written: ${reportPath}`);
  console.log(`Products prepared: ${data.products.length}, skipped: ${data.skipped.length}, applied: ${Boolean(options.apply)}`);
}

if (import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
