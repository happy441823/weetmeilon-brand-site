import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const publicImagesDir = path.join(repoRoot, "public", "images");
const bucketName = process.env.CMS_MEDIA_BUCKET || "sweetmeilon-cms-media-prod";
const databaseName = process.env.CMS_DB_NAME || "sweetmeilon-cms-prod";
const publicBaseUrl = (process.env.CMS_LEGACY_PUBLIC_BASE_URL || "https://sweetmeilon.com").replace(/\/$/, "");
const shouldUpload = process.argv.includes("--upload-r2");
const shouldApply = process.argv.includes("--apply");

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);
const mimeByExtension = new Map([
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".avif", "image/avif"]
]);

function hash(value) {
  return createHash("sha1").update(value).digest("hex").slice(0, 24);
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function normalizePath(value) {
  return value.split(path.sep).join("/");
}

async function walk(dir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile() && allowedExtensions.has(path.extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

function inferAssetGroup(relativePath) {
  if (relativePath.startsWith("brand/")) return "brand";
  if (relativePath.startsWith("products/")) return "product";
  if (relativePath.startsWith("admin-products/")) return "product";
  if (relativePath.includes("template")) return "brand";
  return "brand";
}

function inferProductId(relativePath) {
  const productIdMatch = relativePath.match(/^products\/(tmall-\d+|half-body-public-review)\//);
  if (productIdMatch) return productIdMatch[1];
  const tmallFlatMatch = relativePath.match(/^products\/tmall\/(\d+)\.(?:png|jpg|jpeg|webp|gif|avif)$/i);
  if (tmallFlatMatch) return `tmall-${tmallFlatMatch[1]}`;
  return null;
}

function inferRole(relativePath) {
  if (/\/cover\.(?:png|jpg|jpeg|webp|gif|avif)$/i.test(relativePath)) return "cover";
  if (relativePath.includes("/approved/")) return "cover";
  if (/^products\/tmall\/\d+\./i.test(relativePath)) return "cover";
  return "gallery";
}

function run(command, args) {
  const result = spawnSync(command, args, { cwd: repoRoot, stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

const files = existsSync(publicImagesDir) ? await walk(publicImagesDir) : [];
const rows = files.map((filePath) => {
  const relativePath = normalizePath(path.relative(publicImagesDir, filePath));
  const ext = path.extname(filePath).toLowerCase();
  const mediaId = `legacy_${hash(relativePath)}`;
  const r2Key = `legacy-public/images/${relativePath}`;
  const publicUrl = `${publicBaseUrl}/images/${relativePath}`;
  const productId = inferProductId(relativePath);
  return {
    filePath,
    relativePath,
    id: mediaId,
    fileName: path.basename(filePath),
    r2Key,
    publicUrl,
    fileType: ext.slice(1),
    mimeType: mimeByExtension.get(ext) || "application/octet-stream",
    fileSize: existsSync(filePath) ? statSync(filePath).size : 0,
    assetGroup: inferAssetGroup(relativePath),
    productId,
    role: inferRole(relativePath)
  };
});

if (shouldUpload) {
  for (const row of rows) {
    run("npx.cmd", [
      "wrangler",
      "r2",
      "object",
      "put",
      `${bucketName}/${row.r2Key}`,
      "--remote",
      "--file",
      row.filePath,
      "--content-type",
      row.mimeType
    ]);
  }
}

const statements = [];
for (const row of rows) {
  statements.push(
    `INSERT OR IGNORE INTO media_assets (id, file_name, r2_key, public_url, file_type, mime_type, file_size, asset_group, uploaded_by, alt, title)
VALUES (${sql(row.id)}, ${sql(row.fileName)}, ${sql(row.r2Key)}, ${sql(row.publicUrl)}, ${sql(row.fileType)}, ${sql(row.mimeType)}, ${row.fileSize}, ${sql(row.assetGroup)}, NULL, ${sql(row.fileName)}, ${sql(row.fileName)});`
  );
  if (row.productId) {
    const linkId = `pimg_${hash(`${row.productId}:${row.id}`)}`;
    statements.push(
      `INSERT OR IGNORE INTO product_images (id, product_id, media_id, role, alt, sort_order)
SELECT ${sql(linkId)}, ${sql(row.productId)}, ${sql(row.id)}, ${sql(row.role)}, ${sql(row.fileName)}, CASE WHEN ${sql(row.role)} = 'cover' THEN 0 ELSE 10 END
WHERE EXISTS (SELECT 1 FROM products WHERE id = ${sql(row.productId)});`
    );
    if (row.role === "cover") {
      statements.push(
        `UPDATE products SET cover_media_id = ${sql(row.id)}, hero_media_id = COALESCE(NULLIF(hero_media_id, ''), ${sql(row.id)})
WHERE id = ${sql(row.productId)} AND (cover_media_id IS NULL OR cover_media_id = '');`
      );
    }
  }
}

statements.push("UPDATE media_assets SET usage_count = (SELECT COUNT(*) FROM media_usages WHERE media_id = media_assets.id);");

await mkdir(path.join(repoRoot, "tmp"), { recursive: true });
const outputPath = path.join(repoRoot, "tmp", "cms-register-public-images.sql");
await writeFile(outputPath, `${statements.join("\n")}\n`, "utf8");

console.log(`Prepared ${rows.length} media rows.`);
console.log(`Product-linked files: ${rows.filter((row) => row.productId).length}.`);
console.log(`SQL written to ${outputPath}.`);

if (shouldApply) {
  run("npx.cmd", ["wrangler", "d1", "execute", databaseName, "--remote", "--file", outputPath]);
}
