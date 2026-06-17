import test from "node:test";
import assert from "node:assert/strict";
import {
  markdownToSafeHtml,
  sanitizeHtml,
  validateConfigJson,
  validateContentBlocksJson,
  validateModulesJson
} from "../../src/lib/cms/content-security.ts";

test("HTML sanitizer removes scripts, event handlers, dangerous URLs, iframes and SVG", () => {
  const dirty = `
    <h2 onclick="alert(1)">Title</h2>
    <img src="javascript:alert(1)" onerror="alert(1)">
    <a href="data:text/html,evil">bad</a>
    <iframe src="https://evil.example"></iframe>
    <svg><script>alert(1)</script></svg>
    <script>alert(1)</script>
  `;
  const clean = sanitizeHtml(dirty);
  assert.doesNotMatch(clean, /script|onclick|onerror|javascript:|data:text\/html|iframe|svg/i);
  assert.match(clean, /Title/);
});

test("Markdown is escaped before HTML conversion and sanitized afterwards", () => {
  const html = markdownToSafeHtml("## Safe\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>");
  assert.match(html, /<h2>Safe<\/h2>/);
  assert.doesNotMatch(html, /script|onerror|<img/i);
  assert.match(html, /&lt;img/);
});

test("content blocks and modules use strict allowed type schemas", () => {
  assert.equal(
    validateContentBlocksJson([{ type: "paragraph", text: "Safe text" }]),
    JSON.stringify([{ type: "paragraph", text: "Safe text" }])
  );
  assert.throws(() => validateContentBlocksJson([{ type: "script", text: "x" }]), /不支持/);
  assert.throws(() => validateContentBlocksJson([{ type: "paragraph", text: "javascript:alert(1)" }]), /不安全/);

  assert.equal(validateModulesJson([{ type: "hero", title: "Safe" }]), JSON.stringify([{ type: "hero", title: "Safe" }]));
  assert.throws(() => validateModulesJson([{ type: "iframe", src: "https://evil.example" }]), /不支持/);
});

test("config JSON rejects dangerous strings", () => {
  assert.equal(validateConfigJson({ layout: "default" }), JSON.stringify({ layout: "default" }));
  assert.throws(() => validateConfigJson({ href: "data:text/html,<script>alert(1)</script>" }), /不安全/);
});
