import test from "node:test";
import assert from "node:assert/strict";
import { detectImportPlatform, parseUrlLines } from "../../src/lib/cms/importers/platform-detect.ts";
import { extractPublicMetadata } from "../../src/lib/cms/importers/metadata-fetcher.ts";
import { buildImportDraftSuggestion, normalizeImportTaxonomy, previewImportInput } from "../../src/lib/cms/importers/import-job.ts";
import { assertImportImageAllowed, safeImportedFileName } from "../../src/lib/cms/importers/image-normalizer.ts";
import { sanitizeCreatePayload, sanitizeUpdatePayload } from "../../src/lib/cms/workflow.ts";

test("detectImportPlatform allows only supported Tmall and JD hosts", () => {
  const tmall = detectImportPlatform("https://detail.tmall.com/item.htm?id=123456");
  assert.equal(tmall.platform, "tmall");
  assert.equal(tmall.productId, "123456");

  const jd = detectImportPlatform("https://item.jd.com/100012345678.html");
  assert.equal(jd.platform, "jd");
  assert.equal(jd.productId, "100012345678");

  assert.throws(() => detectImportPlatform("javascript:alert(1)"));
  assert.throws(() => detectImportPlatform("//detail.tmall.com/item.htm?id=1"));
  assert.throws(() => detectImportPlatform("https://example.com/product/1"));
});

test("parseUrlLines deduplicates and enforces a maximum", () => {
  assert.deepEqual(parseUrlLines("https://item.jd.com/1.html\nhttps://item.jd.com/1.html"), ["https://item.jd.com/1.html"]);
  assert.deepEqual(parseUrlLines("请看 https://detail.tmall.com/item.htm?id=123，备用 https://item.jd.com/456.html。"), [
    "https://detail.tmall.com/item.htm?id=123",
    "https://item.jd.com/456.html"
  ]);
  assert.throws(() => parseUrlLines("a\nb\nc", 2));
});

test("extractPublicMetadata reads only public meta and JSON-LD", () => {
  const metadata = extractPublicMetadata(
    "https://detail.tmall.com/item.htm?id=987",
    `<html><head>
      <title>Demo Product</title>
      <meta property="og:title" content="OG Demo" />
      <meta property="og:description" content="Public description" />
      <meta property="og:image" content="https://img.example/demo.jpg" />
      <script>window.__pic='//img.alicdn.com/imgextra/i1/demo/O1CN01demo.jpg';</script>
      <script type="application/ld+json">{"@type":"Product","name":"Demo"}</script>
    </head></html>`
  );
  assert.equal(metadata.platform, "tmall");
  assert.equal(metadata.titleDetected, "OG Demo");
  assert.equal(metadata.description, "Public description");
  assert.deepEqual(metadata.imageUrls, [
    "https://img.example/demo.jpg",
    "https://img.alicdn.com/imgextra/i1/demo/O1CN01demo.jpg",
  ]);
  assert.equal(Array.isArray(metadata.metadata.jsonLd), true);
});

test("extractPublicMetadata detects JD public main images", () => {
  const metadata = extractPublicMetadata(
    "https://item.jd.com/100012345678.html",
    `<html><head><title>JD Demo</title></head><body>
      <img src="//img14.360buyimg.com/n0/jfs/demo-product.webp" />
    </body></html>`
  );
  assert.equal(metadata.platform, "jd");
  assert.deepEqual(metadata.imageUrls, ["https://img14.360buyimg.com/n0/jfs/demo-product.webp"]);
});

test("buildImportDraftSuggestion creates a safe non-public draft", () => {
  const draft = buildImportDraftSuggestion({
    sourceUrl: "https://detail.tmall.com/item.htm?id=123456",
    platform: "tmall",
    sourceProductId: "123456",
    titleDetected: "柔感半身款 - 天猫旗舰店",
    metadata: {
      platform: "tmall",
      sourceUrl: "https://detail.tmall.com/item.htm?id=123456",
      sourceProductId: "123456",
      titleDetected: "柔感半身款",
      sourceShopName: "蜜女郎旗舰店",
      imageUrls: ["https://img.alicdn.com/imgextra/i1/demo.jpg"],
      description: "",
      metadata: {}
    }
  });
  assert.equal(draft.productId, "tmall-123456");
  assert.equal(draft.name, "柔感半身款");
  assert.equal(draft.status, "draft");
  assert.equal(draft.primaryCategoryId, "intimate-molds");
  assert.equal(draft.subcategoryId, "tpe-hip-mold");
  assert.equal(draft.seriesId, "hip-mold-series");
  assert.equal(draft.indexable, false);
  assert.equal(draft.visibleCatalog, false);
  assert.equal(draft.buyButtonEnabled, false);
  assert.equal(draft.tmallEnabled, false);
  assert.deepEqual(draft.galleryJson, ["https://img.alicdn.com/imgextra/i1/demo.jpg"]);
});

test("previewImportInput applies selected catalog taxonomy", () => {
  const preview = previewImportInput({
    urls: "https://item.jd.com/100.html",
    authorized: true,
    primaryCategoryId: "masturbator-cups",
    subcategoryId: "masturbator-cup",
    seriesId: "masturbator-cup-series",
  });

  assert.equal(preview.length, 1);
  assert.equal(preview[0].draft.primaryCategoryId, "masturbator-cups");
  assert.equal(preview[0].draft.subcategoryId, "masturbator-cup");
  assert.equal(preview[0].draft.seriesId, "masturbator-cup-series");
  assert.equal(preview[0].draft.status, "draft");
  assert.equal(preview[0].draft.indexable, false);
  assert.equal(preview[0].draft.visibleCatalog, false);
  assert.equal(preview[0].draft.buyButtonEnabled, false);
});

test("normalizeImportTaxonomy rejects invalid category values", () => {
  assert.deepEqual(
    normalizeImportTaxonomy({
      primaryCategoryId: "bad-primary",
      subcategoryId: "bad-subcategory",
      seriesId: "bad-series",
    }),
    {
      primaryCategoryId: "intimate-molds",
      subcategoryId: "tpe-hip-mold",
      seriesId: "hip-mold-series",
    }
  );
});

test("previewImportInput keeps invalid links as errors and requires authorization", () => {
  const preview = previewImportInput({
    urls: "https://item.jd.com/100.html\nhttps://example.com/bad",
    authorized: false,
    productName: "Test"
  });
  assert.equal(preview.length, 2);
  assert.equal(preview[0].authorized, false);
  assert.equal(preview[0].errors.length, 0);
  assert.equal(preview[1].platform, "unknown");
  assert.equal(preview[1].errors.length > 0, true);
});

test("image import blocks unauthorized files and SVG", () => {
  assert.throws(() => assertImportImageAllowed({ authorized: false, mimeType: "image/jpeg", size: 100 }));
  assert.throws(() => assertImportImageAllowed({ authorized: true, mimeType: "image/svg+xml", size: 100 }));
  assert.doesNotThrow(() => assertImportImageAllowed({ authorized: true, mimeType: "image/webp", size: 100 }));
  assert.match(safeImportedFileName({ platform: "jd", productId: "100", checksum: "abc", extension: "webp" }), /^imports\/jd\/100\/abc\.webp$/);
});

test("import job status is not blocked by product publishing workflow guards", () => {
  assert.equal(sanitizeCreatePayload("import_jobs", { status: "needs_review" }).status, "needs_review");
  assert.equal(sanitizeUpdatePayload({ status: "failed" }, "import_jobs").status, "failed");
  assert.throws(() => sanitizeCreatePayload("products", { status: "published" }));
  assert.throws(() => sanitizeUpdatePayload({ status: "published" }, "products"));
});
