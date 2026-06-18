import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CmsBindings } from "@/types/cloudflare";

const testBindingsKey = "__sweetmeilonCmsTestBindings";

function testGlobal() {
  return globalThis as typeof globalThis & { [testBindingsKey]?: CmsBindings | null };
}

export function setCmsBindingsForTest(bindings: CmsBindings | null) {
  testGlobal()[testBindingsKey] = bindings;
}

export function getCmsBindings(): CmsBindings {
  const testBindings = testGlobal()[testBindingsKey];
  if (testBindings) {
    return testBindings;
  }

  try {
    const context = getCloudflareContext({ async: false });
    return context.env as CmsBindings;
  } catch {
    return {};
  }
}

export function getCmsDb() {
  return getCmsBindings().CMS_DB;
}

export function getCmsMediaBucket() {
  return getCmsBindings().CMS_MEDIA;
}
