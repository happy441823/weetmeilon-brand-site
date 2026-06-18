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

test("HTML sanitizer decodes entities before URL validation", () => {
  const clean = sanitizeHtml('<a href="&#x6a;avascript:alert(1)">x</a><a href="/safe">safe</a>');
  assert.doesNotMatch(clean, /javascript:/i);
  assert.match(clean, /href="\/safe"/);
});

test("HTML sanitizer normalizes anchor rel and blocks srcset/formaction", () => {
  const clean = sanitizeHtml(
    '<a href="https://sweetmeilon.com" target="_blank" rel="nofollow opener">ok</a><img src="/x.png" srcset="javascript:alert(1)" formaction="javascript:alert(1)">'
  );
  assert.equal(clean, '<a href="https://sweetmeilon.com" target="_blank" rel="noopener noreferrer">ok</a><img src="/x.png">');
  assert.equal((clean.match(/rel=/g) || []).length, 1);
  assert.equal(clean.includes("srcset"), false);
  assert.equal(clean.includes("formaction"), false);
});

test("HTML sanitizer rejects URLs with control characters", () => {
  const clean = sanitizeHtml('<a href="java\u0000script:alert(1)">bad</a><a href="/safe">safe</a>');
  assert.equal(clean, '<a>bad</a><a href="/safe">safe</a>');
});

test("HTML sanitizer blocks mixed-case forbidden tags and srcdoc", () => {
  const clean = sanitizeHtml('<SvG><script>alert(1)</script></SvG><iframe srcdoc="<script>alert(1)</script>"></iframe><p>ok</p>');
  assert.doesNotMatch(clean, /svg|iframe|srcdoc|script/i);
  assert.equal(clean, "<p>ok</p>");
});

test("Markdown is escaped before HTML conversion and sanitized afterwards", () => {
  const html = markdownToSafeHtml("## Safe\n\n<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>");
  assert.match(html, /<h2>Safe<\/h2>/);
  assert.doesNotMatch(html, /<script|<img/i);
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

test("content block validation rejects unknown fields and nested unsafe arrays", () => {
  assert.throws(() => validateContentBlocksJson([{ type: "paragraph", text: "ok", extra: "no" }]), /不是允许字段/);
  assert.throws(
    () => validateContentBlocksJson([{ type: "gallery", items: [{ caption: "ok", nested: ["java&#x73;cript:alert(1)"] }] }]),
    /不安全/
  );
});

test("config JSON rejects dangerous strings recursively", () => {
  assert.equal(validateConfigJson({ layout: "default" }), JSON.stringify({ layout: "default" }));
  assert.throws(() => validateConfigJson({ nested: { links: ["data:text/html,<script>alert(1)</script>"] } }), /不安全/);
});
