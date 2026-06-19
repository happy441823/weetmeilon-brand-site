import { catalogCategories, catalogSeries, getPublicCatalogProductBySlug, getPublicCatalogProducts } from "@/lib/catalog";
import type { CatalogCategory, CatalogSeries, PublicCatalogProduct } from "@/types/catalog";
import { getCmsDb } from "./env";
import { readPublicCmsRows } from "./public-content";

type ProductRow = Record<string, unknown> & {
  id: string;
  name: string;
  short_name?: string | null;
  slug: string;
  subtitle?: string | null;
  primary_category_id?: string | null;
  subcategory_id?: string | null;
  series_id?: string | null;
  status: string;
  sort_order?: number | null;
  featured?: number | null;
  tmall_url?: string | null;
  jd_url?: string | null;
  tmall_enabled?: number | null;
  jd_enabled?: number | null;
  links_verified?: number | null;
  buy_button_enabled?: number | null;
  summary?: string | null;
  body_html?: string | null;
  highlights_json?: string | null;
  specifications_json?: string | null;
  care_notes?: string | null;
  privacy_notes?: string | null;
  gallery_json?: string | null;
  image_alt?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  updated_at?: string | null;
};

type ProductMediaRow = {
  product_id: string;
  image_type?: string | null;
  sort_order?: number | null;
  alt_text?: string | null;
  public_url?: string | null;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  parent_id?: string | null;
  level: "primary" | "secondary";
  sort_order?: number | null;
  is_active?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

type SeriesRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  sort_order?: number | null;
  is_active?: number | null;
};

function parseJsonArray<T>(value: unknown, fallback: T[] = []) {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== "string" || !value.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeProductCategories(row: ProductRow) {
  const currentPrimary = row.primary_category_id || "other";
  const currentSubcategory = row.subcategory_id || null;
  const text = `${row.slug} ${row.name} ${row.short_name || ""} ${row.subtitle || ""}`.toLowerCase();

  if (
    [
      "tpe-mold",
      "silicone-mold",
      "realistic-dolls",
      "masturbator-cups"
    ].includes(currentPrimary)
  ) {
    return {
      primaryCategoryId: currentPrimary,
      subcategoryId: currentSubcategory
    };
  }

  const material = text.includes("silicone") || text.includes("硅胶") ? "silicone" : "tpe";
  const primaryCategoryId = material === "silicone" ? "silicone-mold" : "tpe-mold";

  if (currentPrimary === "hip-lower-body" || text.includes("hip") || text.includes("臀")) {
    return {
      primaryCategoryId,
      subcategoryId: material === "silicone" ? "silicone-hip-mold" : "tpe-hip-mold"
    };
  }

  if (currentPrimary === "local-mold" || text.includes("breast") || text.includes("名器") || text.includes("局部")) {
    return {
      primaryCategoryId,
      subcategoryId: material === "silicone" ? "silicone-local-mold" : "tpe-local-mold"
    };
  }

  if (text.includes("leg") || text.includes("腿")) {
    return {
      primaryCategoryId,
      subcategoryId: material === "silicone" ? "silicone-leg-mold" : "tpe-leg-mold"
    };
  }

  if (currentPrimary === "care-accessories") {
    return {
      primaryCategoryId: "masturbator-cups",
      subcategoryId: null
    };
  }

  if (currentPrimary === "half-body" || text.includes("half-body") || text.includes("半身")) {
    return {
      primaryCategoryId,
      subcategoryId: material === "silicone" ? "silicone-half-body" : "tpe-half-body"
    };
  }

  return {
    primaryCategoryId: currentPrimary,
    subcategoryId: currentSubcategory
  };
}

function toPublicProduct(row: ProductRow, media: ProductMediaRow[] = []): PublicCatalogProduct {
  const upcoming = row.status === "coming_soon";
  const displayName = row.name;
  const summary = row.summary || row.subtitle || displayName;
  const channelEnabled = !upcoming && row.buy_button_enabled !== 0;
  const categories = normalizeProductCategories(row);
  const sortedMedia = [...media].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
  const cover = sortedMedia.find((item) => item.image_type === "cover" && item.public_url) || sortedMedia.find((item) => item.public_url);
  const gallery = sortedMedia.map((item) => item.public_url).filter((url): url is string => Boolean(url));
  return {
    id: row.id,
    slug: row.slug,
    displayName,
    shortName: row.short_name || displayName,
    categoryId: categories.primaryCategoryId,
    primaryCategoryId: categories.primaryCategoryId,
    subcategoryId: categories.subcategoryId,
    seriesId: row.series_id || null,
    publicTags: [],
    status: upcoming ? "upcoming" : "active",
    featured: row.featured === 1,
    sortOrder: Number(row.sort_order || 0),
    launchDate: null,
    coverImage: cover?.public_url || "/images/products/product-01.png",
    gallery: gallery.length > 0 ? gallery : parseJsonArray<string>(row.gallery_json),
    imageAlt: cover?.alt_text || row.image_alt || displayName,
    shortDescription: summary,
    fullDescription: row.body_html || summary,
    heroLine: row.subtitle || summary,
    highlights: parseJsonArray<string>(row.highlights_json, summary ? [summary] : []),
    publicSpecifications: parseJsonArray<{ label: string; value: string }>(row.specifications_json),
    careNotes: row.care_notes ? [row.care_notes] : [],
    privacyNotes: row.privacy_notes ? [row.privacy_notes] : [],
    channelLinks: {
      tmall: {
        enabled: channelEnabled && row.tmall_enabled === 1 && Boolean(row.tmall_url),
        url: channelEnabled && row.tmall_enabled === 1 ? row.tmall_url || null : null,
        label: "天猫官方旗舰店",
        verified: row.links_verified === 1,
        sourceUrl: null,
        lastCheckedAt: null
      },
      jd: {
        enabled: channelEnabled && row.jd_enabled === 1 && Boolean(row.jd_url),
        url: channelEnabled && row.jd_enabled === 1 ? row.jd_url || null : null,
        label: "京东官方旗舰店",
        verified: row.links_verified === 1,
        sourceUrl: null,
        lastCheckedAt: null
      }
    },
    seoTitle: row.seo_title || displayName,
    seoDescription: row.seo_description || summary,
    seoKeywords: [],
    updatedAt: row.updated_at || new Date(0).toISOString()
  };
}

async function loadProductMedia(rows: ProductRow[]) {
  const db = getCmsDb();
  const ids = rows.map((row) => row.id).filter(Boolean);
  if (!db || ids.length === 0) return new Map<string, ProductMediaRow[]>();
  const placeholders = ids.map(() => "?").join(", ");
  const result = await db
    .prepare(
      `SELECT pi.product_id, pi.role AS image_type, pi.sort_order, pi.alt AS alt_text, ma.public_url
       FROM product_images pi
       INNER JOIN media_assets ma ON ma.id = pi.media_id
       WHERE pi.product_id IN (${placeholders})
       ORDER BY pi.product_id ASC, pi.sort_order ASC`
    )
    .bind(...ids)
    .all<ProductMediaRow>();
  const map = new Map<string, ProductMediaRow[]>();
  for (const row of result.results || []) {
    const current = map.get(row.product_id) || [];
    current.push(row);
    map.set(row.product_id, current);
  }
  return map;
}

function toCategory(row: CategoryRow): CatalogCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortName: row.name,
    level: row.level,
    parentId: row.parent_id || null,
    description: "",
    coverImage: "",
    sortOrder: Number(row.sort_order || 0),
    visible: row.is_active !== 0,
    seoTitle: row.seo_title || row.name,
    seoDescription: row.seo_description || ""
  };
}

function toSeries(row: SeriesRow): CatalogSeries {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    coverImage: "",
    sortOrder: Number(row.sort_order || 0),
    visible: row.is_active !== 0
  };
}

export async function getPublicProductsWithCmsFallback() {
  const result = await readPublicCmsRows<ProductRow>("products");
  if (result.source !== "d1") {
    return getPublicCatalogProducts();
  }
  const media = await loadProductMedia(result.rows);
  return result.rows.map((row) => toPublicProduct(row, media.get(row.id))).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublicProductBySlugWithCmsFallback(slug: string) {
  const result = await readPublicCmsRows<ProductRow>("products");
  if (result.source !== "d1") {
    return getPublicCatalogProductBySlug(slug);
  }
  const media = await loadProductMedia(result.rows);
  return result.rows.map((row) => toPublicProduct(row, media.get(row.id))).find((product) => product.slug === slug) || null;
}

export async function getPublicCategoriesWithCmsFallback() {
  const result = await readPublicCmsRows<CategoryRow>("categories");
  if (result.source !== "d1") return catalogCategories;
  return result.rows.map(toCategory).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublicSeriesWithCmsFallback() {
  const result = await readPublicCmsRows<SeriesRow>("product_series");
  if (result.source !== "d1") return catalogSeries;
  return result.rows.map(toSeries).sort((a, b) => a.sortOrder - b.sortOrder);
}
