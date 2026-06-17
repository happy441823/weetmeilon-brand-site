import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { getCmsDb } from "@/lib/cms/env";
import { getCmsMediaBucket } from "@/lib/cms/env";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const maxSize = 8 * 1024 * 1024;

function safeName(name: string) {
  return name.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "asset";
}

function extension(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext ? `.${ext}` : "";
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(request, ["super_admin", "editor"]);
    const bucket = getCmsMediaBucket();
    const db = getCmsDb();
    if (!bucket || !db) {
      return NextResponse.json({ error: "CMS_MEDIA 或 CMS_DB 未绑定，无法上传到 R2。" }, { status: 503 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);
    const group = String(formData.get("group") || "brand");
    const created: unknown[] = [];

    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        return NextResponse.json({ error: `${file.name} 文件类型不允许。` }, { status: 400 });
      }
      if (file.size > maxSize) {
        return NextResponse.json({ error: `${file.name} 超过 8MB。` }, { status: 400 });
      }
      if (file.type === "image/svg+xml") {
        const text = await file.text();
        if (/<script|javascript:/i.test(text)) {
          return NextResponse.json({ error: `${file.name} SVG 含有不安全脚本。` }, { status: 400 });
        }
        const key = `${group}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName(file.name)}`;
        await bucket.put(key, text, { httpMetadata: { contentType: file.type } });
        created.push(await insertMedia(db, file, key, group, admin.id));
        continue;
      }
      const key = `${group}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName(file.name || `upload${extension(file.name)}`)}`;
      await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
      created.push(await insertMedia(db, file, key, group, admin.id));
    }

    await writeAuditLog({ request, actor: admin, action: "upload", entityType: "media_assets", summary: `上传 ${created.length} 个素材` });
    return NextResponse.json({ assets: created }, { status: 201 });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

async function insertMedia(db: D1Database, file: File, key: string, group: string, adminId: string) {
  const id = crypto.randomUUID();
  const publicBase = await db.prepare("SELECT value_json FROM site_settings WHERE key = 'cms.media_public_base_url'").first<{ value_json: string }>();
  const base = publicBase?.value_json ? String(JSON.parse(publicBase.value_json)) : "";
  const publicUrl = base ? `${base.replace(/\/$/, "")}/${key}` : null;
  await db
    .prepare(
      `INSERT INTO media_assets (id, file_name, r2_key, public_url, file_type, mime_type, file_size, asset_group, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, file.name, key, publicUrl, file.type.startsWith("image/") ? "image" : "file", file.type, file.size, group, adminId)
    .run();
  return db.prepare("SELECT * FROM media_assets WHERE id = ?").bind(id).first();
}
