const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function assertImportImageAllowed(input: {
  authorized: boolean;
  mimeType: string;
  size: number;
  maxSize?: number;
}) {
  if (!input.authorized) {
    throw new Error("未确认授权的图片不能入库。");
  }
  if (!allowedImageTypes.has(input.mimeType.toLowerCase())) {
    throw new Error("只允许 JPG、PNG、WebP、GIF 图片，禁止 SVG。");
  }
  if (input.size > (input.maxSize || 5 * 1024 * 1024)) {
    throw new Error("单张图片超过大小限制。");
  }
}

export function safeImportedFileName(input: { platform: string; productId?: string | null; checksum?: string; extension: string }) {
  const productId = (input.productId || "manual").replace(/[^a-zA-Z0-9_-]/g, "");
  const checksum = (input.checksum || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 18);
  const extension = input.extension.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
  return `imports/${input.platform}/${productId}/${checksum}.${extension}`;
}
