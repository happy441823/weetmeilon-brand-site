export const allowedMediaGroups = new Set(["brand", "products", "articles", "pages", "homepage", "faq"]);
export const maxUploadFiles = 8;
export const maxUploadFileSize = 8 * 1024 * 1024;
export const maxUploadTotalSize = 32 * 1024 * 1024;

export type DetectedMedia = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  fileType: "image";
  extension: ".jpg" | ".png" | ".webp";
};

export class MediaValidationError extends Error {
  status = 400;
}

export function safeMediaName(name: string) {
  return name.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "asset";
}

export function assertAllowedMediaGroup(group: string) {
  if (!allowedMediaGroups.has(group)) {
    throw new MediaValidationError("素材分组不在允许范围内。");
  }
  return group;
}

export function assertUploadBatch(files: File[]) {
  if (files.length === 0) {
    throw new MediaValidationError("请选择要上传的文件。");
  }
  if (files.length > maxUploadFiles) {
    throw new MediaValidationError(`单次最多上传 ${maxUploadFiles} 个文件。`);
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > maxUploadTotalSize) {
    throw new MediaValidationError("单次上传总大小不能超过 32MB。");
  }
}

export function detectImageFromMagic(bytes: Uint8Array): DetectedMedia {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mimeType: "image/jpeg", fileType: "image", extension: ".jpg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mimeType: "image/png", fileType: "image", extension: ".png" };
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mimeType: "image/webp", fileType: "image", extension: ".webp" };
  }

  throw new MediaValidationError("文件内容不是允许的 JPEG、PNG 或 WebP 图片。SVG 暂不允许上传。");
}

export async function validateMediaFile(file: File) {
  if (file.size > maxUploadFileSize) {
    throw new MediaValidationError(`${file.name} 超过 8MB。`);
  }
  if (file.type === "image/svg+xml" || /\.svg$/i.test(file.name)) {
    throw new MediaValidationError("SVG 暂不允许上传。");
  }

  const buffer = await file.arrayBuffer();
  const detected = detectImageFromMagic(new Uint8Array(buffer.slice(0, 16)));
  return { buffer, detected };
}
