import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { CmsBindings } from "@/types/cloudflare";

export function getCmsBindings(): CmsBindings {
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

