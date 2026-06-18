import test from "node:test";
import assert from "node:assert/strict";
import { getPublicFaqs } from "../../src/lib/cms/public-faqs.ts";
import { setCmsBindingsForTest } from "../../src/lib/cms/env.ts";

test("public FAQs do not fall back when D1 returns an empty set", async () => {
  const old = process.env.CMS_PUBLIC_D1_READS;
  process.env.CMS_PUBLIC_D1_READS = "true";
  setCmsBindingsForTest({
    CMS_DB: {
      prepare() {
        return {
          async all() {
            return { results: [], success: true, meta: {} };
          }
        };
      }
    }
  });

  assert.deepEqual(await getPublicFaqs([["fallback", "answer"]]), []);

  setCmsBindingsForTest(null);
  process.env.CMS_PUBLIC_D1_READS = old;
});
