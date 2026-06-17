import test from "node:test";
import assert from "node:assert/strict";
import { getPublicRedirectForPath, validatePublicRedirect } from "../../src/lib/cms/public-redirects.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

function redirectDb(rows) {
  return {
    prepare() {
      return {
        async all() {
          return { results: rows, success: true, meta: {} };
        }
      };
    }
  };
}

test("public redirects validate only same-site 301 and 302 paths", () => {
  assert.deepEqual(validatePublicRedirect({ source_path: "/old", destination_path: "/new", status_code: 301 }), {
    source: "/old",
    destination: "/new",
    status: 301
  });
  assert.equal(validatePublicRedirect({ source_path: "/admin/old", destination_path: "/new", status_code: 301 }), null);
  assert.equal(validatePublicRedirect({ source_path: "/old", destination_path: "/api/admin", status_code: 301 }), null);
  assert.equal(validatePublicRedirect({ source_path: "/old", destination_path: "https://example.com", status_code: 302 }), null);
  assert.equal(validatePublicRedirect({ source_path: "/old", destination_path: "/new", status_code: 307 }), null);
});

test("public redirects read D1 rows and reject loops", async () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  setCmsBindingsForTest({
    CMS_DB: redirectDb([
      { source_path: "/old", destination_path: "/new", status_code: 302 },
      { source_path: "/loop-a", destination_path: "/loop-b", status_code: 301 },
      { source_path: "/loop-b", destination_path: "/loop-a", status_code: 301 }
    ])
  });

  assert.deepEqual(await getPublicRedirectForPath("/old"), { destination: "/new", status: 302 });
  assert.equal(await getPublicRedirectForPath("/loop-a"), null);
  assert.equal(await getPublicRedirectForPath("/admin/old"), null);

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = old;
});
