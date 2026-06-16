import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { AdminProductSubmission } from "@/types/admin-product";

export const runtime = "nodejs";

const dataFile = path.join(process.cwd(), "data", "catalog", "admin-products.json");
const uploadDir = path.join(process.cwd(), "public", "images", "admin-products");
const adminPassword = process.env.ADMIN_UPLOAD_PASSWORD;

async function readSubmissions(): Promise<AdminProductSubmission[]> {
  try {
    const raw = await readFile(dataFile, "utf8");
    return JSON.parse(raw) as AdminProductSubmission[];
  } catch {
    return [];
  }
}

async function writeSubmissions(items: AdminProductSubmission[]) {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(items, null, 2)}\n`, "utf8");
}

function safeFileName(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isAuthorized(request: Request) {
  if (!adminPassword) {
    return true;
  }

  return request.headers.get("x-admin-upload-password") === adminPassword;
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "请输入正确的上传密码。" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  const items = await readSubmissions();
  return NextResponse.json({
    products: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return unauthorizedResponse();
  }

  const formData = await request.formData();
  const name = getString(formData, "name");
  const seriesLabel = getString(formData, "seriesLabel");
  const cardTitle = getString(formData, "cardTitle");
  const cardDescription = getString(formData, "cardDescription");
  const categoryId = getString(formData, "categoryId");
  const subcategoryId = getString(formData, "subcategoryId") || null;
  const tmallUrl = getString(formData, "tmallUrl") || null;
  const jdUrl = getString(formData, "jdUrl") || null;
  const notes = getString(formData, "notes");
  const image = formData.get("image");

  if (!name || !seriesLabel || !cardTitle || !cardDescription || !categoryId || (!tmallUrl && !jdUrl) || !(image instanceof File) || image.size === 0) {
    return NextResponse.json(
      { error: "请填写商品名称、卡片文案、类目、至少一个天猫或京东商品链接，并上传产品主图。" },
      { status: 400 }
    );
  }

  if (!image.type.startsWith("image/")) {
    return NextResponse.json({ error: "只能上传图片文件。" }, { status: 400 });
  }

  const id = randomUUID();
  const extension = path.extname(image.name) || ".png";
  const fileName = `${Date.now()}-${safeFileName(name) || "product"}${extension.toLowerCase()}`;
  const filePath = path.join(uploadDir, fileName);
  const publicPath = `/images/admin-products/${fileName}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, Buffer.from(await image.arrayBuffer()));

  const now = new Date().toISOString();
  const item: AdminProductSubmission = {
    id,
    name,
    seriesLabel,
    cardTitle,
    cardDescription,
    categoryId,
    subcategoryId,
    tmallUrl,
    jdUrl,
    coverImage: publicPath,
    originalFileName: image.name,
    notes,
    reviewStatus: "pending_review",
    createdAt: now,
    updatedAt: now
  };

  const items = await readSubmissions();
  items.unshift(item);
  await writeSubmissions(items);

  return NextResponse.json({ product: item }, { status: 201 });
}
