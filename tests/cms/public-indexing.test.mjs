import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("robots explicitly allows mainstream search crawlers and blocks private CMS paths", () => {
  const source = readFileSync("src/app/robots.ts", "utf8");

  for (const bot of ["Googlebot", "Bingbot", "Baiduspider", "Sogou web spider", "360Spider", "YisouSpider", "DuckDuckBot", "Applebot"]) {
    assert.match(source, new RegExp(JSON.stringify(bot).slice(1, -1)), bot);
  }

  for (const path of ["/admin/", "/api/", "/internal/", "/not-for-minors"]) {
    assert.match(source, new RegExp(JSON.stringify(path).slice(1, -1)), path);
  }

  assert.match(source, /allow:\s*"\/"/);
  assert.match(source, /sitemap:\s*`\$\{PRIMARY_SITE_URL\}\/sitemap\.xml`/);
  assert.match(source, /host:\s*PRIMARY_DOMAIN/);
});

test("public metadata and sitemap do not globally noindex crawlable pages", () => {
  const rootLayout = readFileSync("src/app/layout.tsx", "utf8");
  const sitemapSource = readFileSync("src/app/sitemap.ts", "utf8");

  assert.doesNotMatch(rootLayout, /robots:\s*\{\s*index:\s*false/);
  assert.match(rootLayout, /metadataBase:\s*new URL\(PRIMARY_SITE_URL\)/);
  assert.match(rootLayout, /canonical:\s*PRIMARY_SITE_URL/);

  assert.match(sitemapSource, /staticRoutes/);
  assert.match(sitemapSource, /getPublicProductsWithCmsFallback/);
  assert.match(sitemapSource, /getPublishedArticles/);
  assert.doesNotMatch(sitemapSource, /\/admin/);
  assert.doesNotMatch(sitemapSource, /\/api/);
  assert.doesNotMatch(sitemapSource, /\/internal/);
  assert.doesNotMatch(sitemapSource, /\/not-for-minors/);
});
