import { catalogCategories as rawCatalogCategories } from "@/data/catalog/categories";
import generatedProductOverrides from "@/data/catalog/generated-overrides.json";
import { manualProductOverrides } from "@/data/catalog/manual-overrides";
import { baseCatalogProducts } from "@/data/catalog/products";
import { catalogSeries } from "@/data/catalog/series";
import type { CatalogChannelLink, CatalogProduct, ProductStatus, PublicCatalogProduct, StoreChannel } from "@/types/catalog";
import {
  categorySeoDescription,
  categorySeoTitle,
  publicProductDisplayName,
  publicProductSeoDescription,
  publicProductSeoTitle,
  safePublicSpecifications,
  safePublicTags,
  safeSeoKeywords
} from "@/lib/public-seo-copy";

const publicStatuses: ProductStatus[] = ["active", "upcoming"];
type CatalogProductOverride = Partial<Omit<CatalogProduct, "channelLinks">> & {
  channelLinks?: Partial<Record<StoreChannel, Partial<CatalogChannelLink>>>;
};
const generatedOverrides = generatedProductOverrides as unknown as Record<string, CatalogProductOverride>;

export const catalogCategories = rawCatalogCategories.map((category) => ({
  ...category,
  seoTitle: categorySeoTitle(category.name),
  seoDescription: categorySeoDescription(category.name)
}));

function mergeProductOverride(product: CatalogProduct, override: CatalogProductOverride | undefined): CatalogProduct {
  if (!override) {
    return product;
  }

  return {
    ...product,
    ...override,
    channelLinks: {
      tmall: {
        ...product.channelLinks.tmall,
        ...override.channelLinks?.tmall
      },
      jd: {
        ...product.channelLinks.jd,
        ...override.channelLinks?.jd
      }
    }
  };
}

function hasApprovedLocalImage(product: CatalogProduct) {
  return Boolean(product.coverImage && product.coverImage.includes("/approved/"));
}

function hasVerifiedChannel(product: CatalogProduct) {
  return (["tmall", "jd"] as StoreChannel[]).some((channel) => {
    const link = product.channelLinks[channel];
    return link.enabled && link.verified && Boolean(link.url);
  });
}

function isSafeChannelUrl(url: string | null) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function hasPublicChannel(product: CatalogProduct) {
  return (["tmall", "jd"] as StoreChannel[]).some((channel) => {
    const link = product.channelLinks[channel];
    return link.enabled && isSafeChannelUrl(link.url);
  });
}

function publicChannelLink(link: CatalogChannelLink) {
  return link.enabled && isSafeChannelUrl(link.url)
    ? link
    : { ...link, enabled: false, url: null, verified: false };
}

function withPublishStatus(product: CatalogProduct): CatalogProduct {
  if (product.status === "upcoming") {
    return {
      ...product,
      primaryCategoryId: product.primaryCategoryId ?? null,
      subcategoryId: product.subcategoryId ?? null,
      categoryReviewStatus: product.categoryReviewStatus ?? "needs-review",
      publishReady: true,
      publishIssues: [],
      imageStatus: product.imageStatus || "needs-review",
      linkStatus: "missing",
      contentStatus: product.contentStatus || "ready",
      visualAssetStatus: product.visualAssetStatus || "pending",
      manualReviewed: product.manualReviewed ?? true,
      reviewedAt: product.reviewedAt ?? null,
      reviewedBy: product.reviewedBy ?? null,
      assetWorkflowStatus: product.assetWorkflowStatus || "waiting_user_assets"
    };
  }

  const issues: string[] = [];

  if (product.status !== "active") {
    issues.push("商品不是 active 状态");
  }
  if (!product.visible) {
    issues.push("商品未设置公开可见");
  }
  if (!hasApprovedLocalImage(product)) {
    issues.push("缺少 approved 官网主图");
  }
  if (!hasPublicChannel(product)) {
    issues.push("缺少已验证购买链接");
  }
  if (!product.displayName && !product.name) {
    issues.push("缺少官网展示名称");
  }
  if (!product.categoryId || product.categoryId === "other") {
    issues.push("商品分类仍待确认");
  }
  if (!product.primaryCategoryId || product.categoryReviewStatus !== "confirmed") {
    issues.push("商品新分类仍待确认");
  }
  if (product.visualAssetStatus === "pending" || product.visualAssetStatus === "rejected") {
    issues.push("视觉素材尚未批准");
  }
  if (product.contentStatus !== "ready") {
    issues.push("商品内容尚未人工审核完成");
  }
  if (product.manualReviewed !== true) {
    issues.push("商品尚未人工审核");
  }

  const publishReady = issues.length === 0;

  return {
    ...product,
    primaryCategoryId: product.primaryCategoryId ?? null,
    subcategoryId: product.subcategoryId ?? null,
    categoryReviewStatus: product.categoryReviewStatus ?? "needs-review",
    publishReady,
    publishIssues: issues,
    imageStatus: product.imageStatus || (hasApprovedLocalImage(product) ? "ready" : "missing"),
    linkStatus: product.linkStatus || (hasVerifiedChannel(product) ? "verified" : hasPublicChannel(product) ? "partial" : "missing"),
    contentStatus: product.contentStatus || "needs-review",
    visualAssetStatus: product.visualAssetStatus || (hasApprovedLocalImage(product) ? "composited" : "pending"),
    manualReviewed: product.manualReviewed ?? false,
    reviewedAt: product.reviewedAt ?? null,
    reviewedBy: product.reviewedBy ?? null,
    assetWorkflowStatus: product.assetWorkflowStatus || "waiting_user_assets"
  };
}

function applyOverrides(product: CatalogProduct): CatalogProduct {
  const generated = mergeProductOverride(product, generatedOverrides[product.id]);
  const manual = mergeProductOverride(generated, manualProductOverrides[product.id]);
  return withPublishStatus(manual);
}

function isPublicProduct(product: CatalogProduct) {
  if (!product.visible || !publicStatuses.includes(product.status)) {
    return false;
  }

  if (product.status === "upcoming") {
    return true;
  }

  return product.publishReady === true;
}

function publicLinkSet(product: CatalogProduct) {
  return {
    tmall: publicChannelLink(product.channelLinks.tmall),
    jd: publicChannelLink(product.channelLinks.jd)
  };
}

function publicTags(product: CatalogProduct) {
  if (product.status === "upcoming") {
    return safePublicTags(product.tags).slice(0, 3);
  }

  return safePublicTags(product.tags);
}

function publicSpecifications(product: CatalogProduct) {
  return safePublicSpecifications(product.specifications, product.status);
}

function normalizeStaticCategory(product: CatalogProduct) {
  const source = `${product.slug} ${product.displayName || product.name} ${product.shortName} ${product.categoryId} ${product.primaryCategoryId || ""} ${product.subcategoryId || ""}`.toLowerCase();
  const material = source.includes("silicone") || source.includes("硅胶") ? "silicone" : "tpe";

  if (product.primaryCategoryId === "realistic-dolls" || product.categoryId === "realistic-dolls") {
    return {
      primaryCategoryId: "realistic-dolls",
      subcategoryId: material === "silicone" ? "silicone-realistic-dolls" : "tpe-realistic-dolls"
    };
  }

  if (product.primaryCategoryId === "masturbator-cups" || product.categoryId === "masturbator-cups" || source.includes("飞机杯")) {
    return {
      primaryCategoryId: "masturbator-cups",
      subcategoryId: "masturbator-cup"
    };
  }

  if (source.includes("名器") || source.includes("local")) {
    return {
      primaryCategoryId: "intimate-molds",
      subcategoryId: material === "silicone" ? "silicone-local-mold" : "tpe-local-mold"
    };
  }

  if (source.includes("腿") || source.includes("leg")) {
    return {
      primaryCategoryId: "intimate-molds",
      subcategoryId: "tpe-leg-mold"
    };
  }

  if (source.includes("半身") || source.includes("half-body")) {
    return {
      primaryCategoryId: "intimate-molds",
      subcategoryId: material === "silicone" ? "silicone-half-body" : "tpe-half-body"
    };
  }

  if (source.includes("臀") || source.includes("hip")) {
    return {
      primaryCategoryId: "intimate-molds",
      subcategoryId: material === "silicone" ? "silicone-hip-mold" : "tpe-hip-mold"
    };
  }

  return {
    primaryCategoryId: product.primaryCategoryId === "tpe-mold" || product.primaryCategoryId === "silicone-mold" ? "intimate-molds" : product.primaryCategoryId || product.categoryId,
    subcategoryId: product.subcategoryId ?? null
  };
}

function normalizeStaticSeries(product: CatalogProduct, category: { primaryCategoryId: string; subcategoryId: string | null }) {
  if (category.primaryCategoryId === "masturbator-cups") return "masturbator-cup-series";
  if (category.primaryCategoryId === "realistic-dolls") return "realistic-doll-series";
  if (category.subcategoryId?.includes("half-body")) return "half-body-doll-series";
  if (category.subcategoryId?.includes("hip")) return "hip-mold-series";
  if (category.subcategoryId?.includes("silicone")) return "silicone-mold-series";
  if (product.seriesId === "native-skin-silicone") return "silicone-mold-series";
  if (product.seriesId === "fine-texture") return "hip-mold-series";
  if (product.seriesId === "beginner") return "half-body-doll-series";
  return product.seriesId;
}

function toPublicProduct(product: CatalogProduct): PublicCatalogProduct {
  const isUpcoming = product.status === "upcoming";
  const normalizedCategory = normalizeStaticCategory(product);
  const normalizedSeriesId = normalizeStaticSeries(product, normalizedCategory);
  const seriesName = getSeriesById(normalizedSeriesId)?.name;
  const categoryName = getCategoryById(normalizedCategory.primaryCategoryId || product.categoryId)?.name;
  const subcategoryName = getCategoryById(normalizedCategory.subcategoryId || "")?.name;
  const displayName = publicProductDisplayName({
    id: product.id,
    displayName: product.displayName,
    name: product.name,
    shortName: product.shortName,
    status: product.status,
    seriesName,
    categoryName,
    subcategoryName
  });
  const useReviewedContent = product.contentStatus === "ready" && product.manualReviewed === true;
  const activeDescription = `了解${displayName}的材质体验、产品类型、清洁保养与隐私购买说明。具体规格、发货、物流和售后以蜜女郎官方旗舰店页面为准。`;
  const primaryCategoryId = normalizedCategory.primaryCategoryId;

  return {
    id: product.id,
    slug: product.slug,
    displayName,
    shortName: product.shortName,
    categoryId: primaryCategoryId,
    primaryCategoryId,
    subcategoryId: normalizedCategory.subcategoryId,
    seriesId: normalizedSeriesId,
    publicTags: publicTags(product),
    status: product.status,
    featured: product.featured,
    sortOrder: product.sortOrder,
    launchDate: product.launchDate,
    coverImage: product.coverImage,
    gallery: [],
    imageAlt: product.imageAlt,
    shortDescription: isUpcoming || useReviewedContent ? product.shortDescription : activeDescription,
    fullDescription: isUpcoming || useReviewedContent ? product.fullDescription : activeDescription,
    heroLine: isUpcoming || useReviewedContent ? product.heroLine : activeDescription,
    highlights: isUpcoming || useReviewedContent
      ? product.highlights
      : [
          "商品购买、发货、售后由官方旗舰店提供。",
          "官网仅保留购买前需要确认的基础信息，不展示交易动态或活动标签。"
        ],
    publicSpecifications: publicSpecifications(product),
    careNotes: isUpcoming ? product.careNotes : product.careNotes.slice(0, 3),
    privacyNotes: isUpcoming ? product.privacyNotes : ["包装、面单与配送规则以官方旗舰店页面和客服说明为准。"],
    channelLinks: isUpcoming
      ? {
          tmall: { ...product.channelLinks.tmall, enabled: false, url: null, verified: false },
          jd: { ...product.channelLinks.jd, enabled: false, url: null, verified: false }
        }
      : publicLinkSet(product),
    seoTitle: publicProductSeoTitle({ displayName, status: product.status, seriesName, categoryName, subcategoryName }),
    seoDescription: publicProductSeoDescription({ displayName, status: product.status, seriesName, categoryName, subcategoryName }),
    seoKeywords: safeSeoKeywords(product.seoKeywords),
    updatedAt: product.updatedAt
  };
}

export const catalogProducts = baseCatalogProducts
  .map(applyOverrides)
  .sort((a, b) => a.sortOrder - b.sortOrder);

export { catalogSeries };

export function getPublicCatalogProducts(): PublicCatalogProduct[] {
  return catalogProducts.filter(isPublicProduct).map(toPublicProduct);
}

export function getFeaturedUpcomingProducts() {
  return getPublicCatalogProducts().filter((product) => product.status === "upcoming" && product.featured);
}

export function getFeaturedActiveProducts() {
  return getPublicCatalogProducts().filter((product) => product.status === "active" && product.featured);
}

export function getCatalogProductBySlug(slug: string) {
  return catalogProducts.find((product) => product.slug === slug);
}

export function getPublicCatalogProductBySlug(slug: string) {
  const product = getCatalogProductBySlug(slug);
  return product && isPublicProduct(product) ? toPublicProduct(product) : undefined;
}

export function getProductsByCategory(categoryId: string) {
  return getPublicCatalogProducts().filter(
    (product) => product.primaryCategoryId === categoryId || product.subcategoryId === categoryId
  );
}

export function getProductsByStatus(status: ProductStatus) {
  return getPublicCatalogProducts().filter((product) => product.status === status);
}

export function getCategoryBySlug(slug: string) {
  return catalogCategories.find((category) => category.slug === slug);
}

export function getCategoryById(id: string) {
  return catalogCategories.find((category) => category.id === id);
}

export function getPrimaryCategories() {
  return catalogCategories.filter((category) => category.visible && category.level === "primary");
}

export function getSubcategories(parentId?: string | null) {
  return catalogCategories.filter(
    (category) => category.visible && category.level === "secondary" && (!parentId || category.parentId === parentId)
  );
}

export function getPublicCategoryIds() {
  const ids = new Set<string>();

  for (const product of getPublicCatalogProducts()) {
    ids.add(product.primaryCategoryId);
    if (product.subcategoryId) {
      ids.add(product.subcategoryId);
    }
  }

  return ids;
}

export function getPrimaryCategoriesWithProducts() {
  const publicCategoryIds = getPublicCategoryIds();
  return getPrimaryCategories().filter((category) => publicCategoryIds.has(category.id));
}

export function getSubcategoriesWithProducts(parentId?: string | null) {
  const publicCategoryIds = getPublicCategoryIds();
  return getSubcategories(parentId).filter((category) => publicCategoryIds.has(category.id));
}

export function getSeriesById(id: string | null) {
  return id ? catalogSeries.find((series) => series.id === id) : undefined;
}

export function getVerifiedProductChannels(product: CatalogProduct) {
  return (["tmall", "jd"] as StoreChannel[])
    .map((channel) => ({ channel, link: product.channelLinks[channel] }))
    .filter(({ link }) => link.enabled && link.verified && Boolean(link.url));
}
