import { mkdir, copyFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, "tmp", "cms-backups", stamp);

await mkdir(backupDir, { recursive: true });

const files = [
  "migrations/0001_admin_cms.sql",
  "wrangler.jsonc",
  "data/catalog/admin-products.json",
  "data/cms-migration-report.json"
];

const copied = [];
for (const file of files) {
  try {
    const target = path.join(backupDir, file.replace(/[\\/]/g, "__"));
    await copyFile(path.join(root, file), target);
    copied.push(file);
  } catch {
    // Optional source files may not exist during first setup.
  }
}

await writeFile(
  path.join(backupDir, "README.txt"),
  `SWEETMEILON CMS local backup\nCreated at: ${new Date().toISOString()}\nFiles:\n${copied.map((file) => `- ${file}`).join("\n")}\n`,
  "utf8"
);

console.log(`Local CMS backup created: ${backupDir}`);
console.log((await readdir(backupDir)).join("\n"));

