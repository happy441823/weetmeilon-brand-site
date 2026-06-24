import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const publicCopyFiles = [
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/products/page.tsx",
  "src/app/faq/page.tsx",
  "src/app/guide/page.tsx",
  "src/app/privacy-shipping/page.tsx",
  "src/app/articles/page.tsx",
  "src/app/articles/[slug]/page.tsx",
  "src/app/brand/page.tsx",
  "src/app/buy/page.tsx",
  "src/app/contact/page.tsx",
  "src/app/disclaimer/page.tsx",
  "src/lib/articles.ts",
  "src/lib/catalog.ts"
];

const unstableCommerceTerms = /价格|库存|优惠|销量|付款人数|近365天付款|实时价格|动态价格|动态销量/;
const mojibakeHints = /铚|鍟|绔|闅|浣|锝|锟|�/;

test("public indexing copy avoids unstable commerce terms", () => {
  for (const file of publicCopyFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, unstableCommerceTerms, file);
  }
});

test("public indexing copy is readable UTF-8 Chinese, not mojibake", () => {
  for (const file of publicCopyFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, mojibakeHints, file);
  }
});
