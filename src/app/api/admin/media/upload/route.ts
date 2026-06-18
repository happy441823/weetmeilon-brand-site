import { NextResponse } from "next/server";
import { adminErrorResponse, requireRole, writeAuditLog } from "@/lib/cms/auth";
import { getCmsDb, getCmsMediaBucket } from "@/lib/cms/env";
import { assertAllowedMediaGroup, assertUploadBatch, safeMediaName, validateMediaFile } from "@/lib/cms/media-security";

export async function POST(request: Request) {
  const uploadedKeys: string[] = [];
  const createdIds: string[] = [];

  try {
    const admin = await requireRole(request, ["super_admin", "editor"]);
    const bucket = getCmsMediaBucket();
    const db = getCmsDb();
    if (!bucket || !db) {
      return NextResponse.json({ error: "CMS_MEDIA 或 CMS_DB 未绑定，无法上传到 R2。" }, { status: 503 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((item): item is File => item instanceof File);
    const group = assertAllowedMediaGroup(String(formData.get("group") || "brand"));
    assertUploadBatch(files);

    const created: unknown[] = [];
    for (const file of files) {
      const { buffer, detected } = await validateMediaFile(file);
      const key = `${group}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeMediaName(file.name || `upload${detected.extension}`)}`;
      await bucket.put(key, buffer, { httpMetadata: { contentType: detected.mimeType } });
      uploadedKeys.push(key);
      const asset = await insertMedia(db, file, key, group, admin.id, detected.mimeType, detected.fileType);
      if (asset?.id) createdIds.push(String(asset.id));
      created.push(asset);
    }

    await writeAuditLog({ request, actor: admin, action: "upload", entityType: "media_assets", summary: `上传 ${created.length} 个素材` });
    return NextResponse.json({ assets: created }, { status: 201 });
  } catch (error) {
    const bucket = getCmsMediaBucket();
    if (bucket && uploadedKeys.length > 0) {
      await Promise.allSettled(uploadedKeys.map((key) => bucket.delete(key)));
    }
    const db = getCmsDb();
    if (db && createdIds.length > 0) {
      await Promise.allSettled(createdIds.map((id) => db.prepare("DELETE FROM media_assets WHERE id = ?").bind(id).run()));
    }
    return adminErrorResponse(error);
  }
}

async function insertMedia(db: D1Database, file: File, key: string, group: string, adminId: string, mimeType: string, fileType: string) {
  const id = crypto.randomUUID();
  const publicBase = await db.prepare("SELECT value_json FROM site_settings WHERE key = 'cms.media_public_base_url'").first<{ value_json: string }>();
  const settingBase = publicBase?.value_json ? String(JSON.parse(publicBase.value_json)) : "";
  const base = settingBase || process.env.CMS_MEDIA_PUBLIC_BASE_URL || "";
  if (!base) {
    throw new Error("CMS 媒体 public_url 未配置：请设置 cms.media_public_base_url 或 CMS_MEDIA_PUBLIC_BASE_URL。");
  }
  const publicUrl = `${base.replace(/\/$/, "")}/${key}`;
  await db
    .prepare(
      `INSERT INTO media_assets (id, file_name, r2_key, public_url, file_type, mime_type, file_size, asset_group, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, file.name, key, publicUrl, fileType, mimeType, file.size, group, adminId)
    .run();
  return db.prepare("SELECT * FROM media_assets WHERE id = ?").bind(id).first<{ id: string } & Record<string, unknown>>();
}
