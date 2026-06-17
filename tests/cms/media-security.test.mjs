import test from "node:test";
import assert from "node:assert/strict";
import {
  assertAllowedMediaGroup,
  assertUploadBatch,
  detectImageFromMagic,
  maxUploadFiles,
  validateMediaFile
} from "../../src/lib/cms/media-security.ts";

test("media magic detection accepts jpeg png and webp", () => {
  assert.equal(detectImageFromMagic(new Uint8Array([0xff, 0xd8, 0xff, 0x00])).mimeType, "image/jpeg");
  assert.equal(detectImageFromMagic(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])).mimeType, "image/png");
  assert.equal(detectImageFromMagic(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])).mimeType, "image/webp");
});

test("media magic detection rejects svg and MIME spoofing", async () => {
  await assert.rejects(
    () => validateMediaFile(new File(["<svg><script>alert(1)</script></svg>"], "x.svg", { type: "image/svg+xml" })),
    /SVG/
  );
  await assert.rejects(
    () => validateMediaFile(new File(["not actually png"], "x.png", { type: "image/png" })),
    /文件内容不是允许/
  );
});

test("media upload batch limits count, total size and group", () => {
  const tinyPng = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "x.png", { type: "image/png" });
  assert.equal(assertAllowedMediaGroup("products"), "products");
  assert.equal(assertAllowedMediaGroup("articles"), "articles");
  assert.equal(assertAllowedMediaGroup("pages"), "pages");
  assert.equal(assertAllowedMediaGroup("homepage"), "homepage");
  assert.equal(assertAllowedMediaGroup("faq"), "faq");
  assert.throws(() => assertAllowedMediaGroup("product"), /分组/);
  assert.throws(() => assertAllowedMediaGroup("article"), /分组/);
  assert.throws(() => assertAllowedMediaGroup("page"), /分组/);
  assert.throws(() => assertAllowedMediaGroup("../private"), /分组/);
  assert.doesNotThrow(() => assertUploadBatch([tinyPng]));
  assert.throws(() => assertUploadBatch([]), /请选择/);
  assert.throws(() => assertUploadBatch(Array.from({ length: maxUploadFiles + 1 }, () => tinyPng)), /最多上传/);
});
