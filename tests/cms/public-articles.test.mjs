import test from "node:test";
import assert from "node:assert/strict";
import { articleFromCms, renderArticleContentBlocksToHtml } from "../../src/lib/articles.ts";

test("CMS article rendering preserves safe rich text structure", () => {
  const article = articleFromCms({
    slug: "safe-rich-text",
    title: "Safe rich text",
    excerpt: "excerpt",
    keywords_json: JSON.stringify(["one"]),
    indexable: 1,
    body_html: '<h2>Title</h2><p>Body <a href="/products">link</a></p><ul><li>One</li></ul><script>alert(1)</script>'
  });
  assert.match(article.renderedHtml, /<h2>Title<\/h2>/);
  assert.match(article.renderedHtml, /<ul><li>One<\/li><\/ul>/);
  assert.match(article.renderedHtml, /href="\/products"/);
  assert.doesNotMatch(article.renderedHtml, /script/i);
  assert.equal(article.readMinutes, 1);
});

test("CMS article content blocks render structured public HTML", () => {
  const html = renderArticleContentBlocksToHtml([
    { type: "heading", level: 2, text: "Section" },
    { type: "paragraph", text: "Text" },
    { type: "quote", text: "Quote", cite: "SWEETMEILON" },
    { type: "cta", label: "Read", href: "/guide" },
    { type: "table", rows: [["A", "B"]] },
    { type: "product_card", product_id: "product-1" }
  ]);
  assert.match(html, /<h2>Section<\/h2>/);
  assert.match(html, /class="cms-cta" href="\/guide"/);
  assert.match(html, /<table><tbody><tr><td>A<\/td><td>B<\/td><\/tr><\/tbody><\/table>/);
  assert.match(html, /class="cms-product-card"/);
});
