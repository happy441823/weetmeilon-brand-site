import test from "node:test";
import assert from "node:assert/strict";
import { getPublicFooterLinks, getPublicHeaderNavItems } from "../../src/lib/cms/public-site-chrome.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

function withPublicD1(db, fn) {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  setCmsBindingsForTest({ CMS_DB: db });
  return Promise.resolve()
    .then(fn)
    .finally(() => {
      if (old == null) delete process.env.CMS_PUBLIC_D1_READS;
      else process.env.CMS_PUBLIC_D1_READS = old;
      setCmsBindingsForTest(null);
    });
}

function mockChromeD1({ nav = [], groups = [], footer = [], fail = false } = {}) {
  return {
    prepare(sql) {
      return {
        async all() {
          if (fail) throw new Error("query failed");
          if (/FROM "navigation_items"/.test(sql)) return { results: nav };
          if (/FROM "footer_groups"/.test(sql)) return { results: groups };
          if (/FROM "footer_items"/.test(sql)) return { results: footer };
          return { results: [] };
        }
      };
    }
  };
}

test("public header navigation reads visible D1 links and filters unsafe paths", async () => {
  await withPublicD1(
    mockChromeD1({
      nav: [
        { label: "品牌", href: "/brand", show_desktop: 1, show_mobile: 1 },
        { label: "后台", href: "/admin", show_desktop: 1, show_mobile: 1 },
        { label: "API", href: "/api/admin/test", show_desktop: 1, show_mobile: 1 },
        { label: "外链", href: "https://example.com", show_desktop: 1, show_mobile: 1 }
      ]
    }),
    async () => {
      const items = await getPublicHeaderNavItems();
      assert.deepEqual(items, [{ label: "品牌", href: "/brand", showDesktop: true, showMobile: true }]);
    }
  );
});

test("public header navigation does not fall back when D1 returns an empty set", async () => {
  await withPublicD1(mockChromeD1({ nav: [] }), async () => {
    assert.deepEqual(await getPublicHeaderNavItems(), []);
  });
});

test("public footer reads D1 items in visible groups", async () => {
  await withPublicD1(
    mockChromeD1({
      groups: [{ id: "legal" }],
      footer: [
        { label: "隐私", href: "/privacy-policy", group_id: "legal" },
        { label: "隐藏组", href: "/hidden", group_id: "hidden" }
      ]
    }),
    async () => {
      const links = await getPublicFooterLinks();
      assert.deepEqual(links, [{ label: "隐私", href: "/privacy-policy", showDesktop: true, showMobile: true }]);
    }
  );
});

test("public site chrome falls back only when D1 query fails", async () => {
  await withPublicD1(mockChromeD1({ fail: true }), async () => {
    const header = await getPublicHeaderNavItems();
    const footer = await getPublicFooterLinks();
    assert.ok(header.length > 0);
    assert.ok(footer.length > 0);
  });
});
