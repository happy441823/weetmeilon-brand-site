import { catalogCategories, catalogSeries, getPublicCatalogProductBySlug, getPublicCatalogProducts } from "@/lib/catalog";
import type { CatalogCategory, CatalogSeries, PublicCatalogProduct } from "@/types/catalog";
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

function toPublicProduct(row: ProductRow): PublicCatalogProduct {
  const upcoming = row.status === "coming_soon";
  const displayName = row.name;
  const summary = row.summary || row.subtitle || displayName;
  const channelEnabled = !upcoming && row.buy_button_enabled !== 0;
  return {
    id: row.id,
    slug: row.slug,
    displayName,
    shortName: row.short_name || displayName,
    categoryId: row.primary_category_id || "other",
    primaryCategoryId: row.primary_category_id || "other",
    subcategoryId: row.subcategory_id || null,
    seriesId: row.series_id || null,
    publicTags: [],
    status: upcoming ? "upcoming" : "active",
    featured: row.featured === 1,
    sortOrder: Number(row.sort_order || 0),
    launchDate: null,
    coverImage: "/images/products/product-01.png",
    gallery: parseJsonArray<string>(row.gallery_json),
    imageAlt: row.image_alt || displayName,
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
  if (result.source !== "d1" || result.rows.length === 0) {
    return getPublicCatalogProducts();
  }
  return result.rows.map(toPublicProduct).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublicProductBySlugWithCmsFallback(slug: string) {
  const products = await getPublicProductsWithCmsFallback();
  return products.find((product) => product.slug === slug) || getPublicCatalogProductBySlug(slug);
}

export async function getPublicCategoriesWithCmsFallback() {
  const result = await readPublicCmsRows<CategoryRow>("categories");
  if (result.source !== "d1" || result.rows.length === 0) return catalogCategories;
  return result.rows.map(toCategory).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPublicSeriesWithCmsFallback() {
  const result = await readPublicCmsRows<SeriesRow>("product_series");
  if (result.source !== "d1" || result.rows.length === 0) return catalogSeries;
  return result.rows.map(toSeries).sort((a, b) => a.sortOrder - b.sortOrder);
}
