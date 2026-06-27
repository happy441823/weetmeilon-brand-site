import { getCmsDb } from "./env";

export type PublicReadOptions = {
  now?: Date;
};

export type PublicReadResult<T> = {
  rows: T[];
  dbReady: boolean;
  source: "d1" | "fallback";
  fallbackReason?: "feature_disabled" | "unbound" | "query_error";
};

const publicStatusByResource: Record<string, string[]> = {
  products: ["published", "coming_soon"],
  categories: [],
  product_series: [],
  articles: ["published"],
  pages: ["published"],
  faqs: [],
  navigation_items: [],
  footer_groups: [],
  footer_items: [],
  homepage_sections: [],
  site_settings: [],
  redirects: []
};

const tableByResource: Record<string, string> = {
  products: "products",
  categories: "categories",
  product_series: "product_series",
  articles: "articles",
  pages: "pages",
  faqs: "faqs",
  navigation_items: "navigation_items",
  footer_groups: "footer_groups",
  footer_items: "footer_items",
  homepage_sections: "homepage_sections",
  site_settings: "site_settings",
  redirects: "redirects"
};

const orderByResource: Record<string, string> = {
  products: "sort_order ASC, updated_at DESC",
  categories: "sort_order ASC, updated_at DESC",
  product_series: "sort_order ASC, updated_at DESC",
  faqs: "sort_order ASC, updated_at DESC",
  homepage_sections: "sort_order ASC, updated_at DESC",
  navigation_items: "sort_order ASC, updated_at DESC",
  footer_groups: "sort_order ASC, updated_at DESC",
  footer_items: "sort_order ASC, updated_at DESC",
  articles: "published_at DESC, updated_at DESC",
  pages: "updated_at DESC",
  site_settings: "setting_group ASC, key ASC",
  redirects: "source_path ASC"
};

function quote(name: string) {
  return `"${name.replace(/"/g, "")}"`;
}

export function publicD1Enabled(resource?: string) {
  if (resource === "products" && process.env.CMS_PUBLIC_PRODUCTS_D1_READS === "true") {
    return true;
  }
  if (resource === "articles" && process.env.CMS_PUBLIC_ARTICLES_D1_READS === "true") {
    return true;
  }
  return process.env.CMS_PUBLIC_D1_READS === "true";
}

export function publicVisibilityWhere(resource: string) {
  if (resource === "faqs") {
    return "is_public = 1";
  }
  if (resource === "navigation_items") {
    return "is_visible = 1";
  }
  if (resource === "categories" || resource === "product_series") {
    return "is_active = 1";
  }
  if (resource === "footer_groups" || resource === "footer_items") {
    return "is_visible = 1";
  }
  if (resource === "redirects") {
    return "is_active = 1";
  }
  if (resource === "homepage_sections") {
    return "is_enabled = 1";
  }
  if (resource === "site_settings") {
    return "is_sensitive = 0";
  }

  const statuses = publicStatusByResource[resource] || [];
  if (statuses.length === 0) {
    return "1 = 0";
  }
  const statusSql = statuses.map((status) => `'${status}'`).join(", ");
  return `status IN (${statusSql}) AND (published_at IS NULL OR published_at <= ?) AND (scheduled_at IS NULL OR scheduled_at <= ?)`;
}

export async function readPublicCmsRows<T extends Record<string, unknown>>(
  resource: keyof typeof tableByResource,
  options: PublicReadOptions = {}
): Promise<PublicReadResult<T>> {
  if (!publicD1Enabled(resource)) {
    return { rows: [], dbReady: false, source: "fallback", fallbackReason: "feature_disabled" };
  }

  const db = getCmsDb();
  if (!db) {
    return { rows: [], dbReady: false, source: "fallback", fallbackReason: "unbound" };
  }

  const now = (options.now || new Date()).toISOString();
  const table = tableByResource[resource];
  const where = publicVisibilityWhere(resource);
  const needsTime = where.includes("published_at") || where.includes("scheduled_at");

  try {
    const orderBy = orderByResource[resource] || "updated_at DESC";
    const statement = db.prepare(`SELECT * FROM ${quote(table)} WHERE ${where} ORDER BY ${orderBy}`);
    const result = needsTime ? await statement.bind(now, now).all<T>() : await statement.all<T>();
    return { rows: result.results || [], dbReady: true, source: "d1" };
  } catch {
    return { rows: [], dbReady: false, source: "fallback", fallbackReason: "query_error" };
  }
}

export async function getPublicCmsItem<T extends Record<string, unknown>>(
  resource: keyof typeof tableByResource,
  key: string,
  value: string,
  options: PublicReadOptions = {}
) {
  const rows = await readPublicCmsRows<T>(resource, options);
  return rows.rows.find((row) => row[key] === value) || null;
}
