#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function usage() {
  return `
Usage:
  npm run cms:bootstrap-admin -- --email owner@example.com --database sweetmeilon-cms-dev --env preview --remote --yes

Options:
  --email <email>       Required admin email.
  --name <name>         Optional display name. Defaults to email.
  --database <name>     Required D1 database name, for example sweetmeilon-cms-dev.
  --env <name>          Wrangler environment, for example preview.
  --local               Apply to local D1.
  --remote              Apply to remote D1.
  --yes                 Required before executing.
  --print-sql           Print SQL only and do not execute.
  --verify              Print verification SQL only and do not execute.
`;
}

function readArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      if (["local", "remote", "yes", "print-sql", "verify"].includes(key)) {
        options[key] = true;
      } else {
        options[key] = argv[index + 1];
        index += 1;
      }
    }
  }
  return options;
}

function assertEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("A valid --email is required.");
  }
  return normalized;
}

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

export function buildBootstrapAdminSql({ email, name }) {
  const normalizedEmail = assertEmail(email);
  const displayName = String(name || normalizedEmail).trim() || normalizedEmail;
  const userId = `admin_${normalizedEmail.replace(/[^a-z0-9]+/g, "_")}`;

  return `
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO admin_roles (id, name, description, permissions_json)
VALUES ('role_super_admin', 'super_admin', '全部权限，可管理用户、系统设置、发布、导入导出和恢复。', '["*"]');

INSERT INTO admin_users (id, email, name, is_active, created_at, updated_at)
VALUES (${sqlString(userId)}, ${sqlString(normalizedEmail)}, ${sqlString(displayName)}, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT(email) DO UPDATE SET
  name = excluded.name,
  is_active = 1,
  updated_at = CURRENT_TIMESTAMP;

INSERT OR IGNORE INTO admin_user_roles (user_id, role_id, created_at, updated_at)
SELECT id, 'role_super_admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM admin_users
WHERE email = ${sqlString(normalizedEmail)};
`.trimStart();
}

export function buildBootstrapVerifySql(email) {
  const normalizedEmail = assertEmail(email);
  return `
SELECT u.email, u.is_active, r.name AS role
FROM admin_users u
INNER JOIN admin_user_roles ur ON ur.user_id = u.id
INNER JOIN admin_roles r ON r.id = ur.role_id
WHERE u.email = ${sqlString(normalizedEmail)};
`.trimStart();
}

function run() {
  const options = readArgs(process.argv.slice(2));
  if (options.help || options.h) {
    console.log(usage());
    return;
  }

  const email = assertEmail(options.email);
  const sql = options.verify ? buildBootstrapVerifySql(email) : buildBootstrapAdminSql({ email, name: options.name });

  if (options["print-sql"] || options.verify) {
    console.log(sql);
    return;
  }

  if (!options.database) {
    throw new Error("--database is required.");
  }
  if (!options.local && !options.remote) {
    throw new Error("Choose exactly one of --local or --remote.");
  }
  if (options.local && options.remote) {
    throw new Error("Choose exactly one of --local or --remote.");
  }
  if (!options.yes) {
    throw new Error("--yes is required before writing to D1.");
  }

  const dir = mkdtempSync(join(tmpdir(), "sweetmeilon-cms-bootstrap-"));
  const file = join(dir, "bootstrap-admin.sql");
  writeFileSync(file, sql, "utf8");

  const args = ["wrangler", "d1", "execute", String(options.database), "--file", file];
  if (options.env) {
    args.push("--env", String(options.env));
  }
  args.push(options.remote ? "--remote" : "--local");

  try {
    const result = spawnSync("npx.cmd", args, { stdio: "inherit", shell: false });
    if (result.status !== 0) {
      throw new Error(`wrangler d1 execute failed with exit code ${result.status}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    console.error(usage());
    process.exit(1);
  }
}
