import { catalogCategories } from "@/data/catalog/categories";
import generatedProductOverrides from "@/data/catalog/generated-overrides.json";
import { manualProductOverrides } from "@/data/catalog/manual-overrides";
import { baseCatalogProducts } from "@/data/catalog/products";
import { catalogSeries } from "@/data/catalog/series";
import type { CatalogChannelLink, CatalogProduct, ProductStatus, PublicCatalogProduct, StoreChannel } from "@/types/catalog";

const publicStatuses: ProductStatus[] = ["active", "upcoming"];
type CatalogProductOverride = Partial<Omit<CatalogProduct, "channelLinks">> & {
  channelLinks?: Partial<Record<StoreChannel, Partial<CatalogChannelLink>>>;
};
const generatedOverrides = generatedProductOverrides as unknown as Record<string, CatalogProductOverride>;

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
  if (!hasVerifiedChannel(product)) {
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
    linkStatus: product.linkStatus || (hasVerifiedChannel(product) ? "verified" : "missing"),
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
    tmall: product.channelLinks.tmall.enabled && product.channelLinks.tmall.verified
      ? product.channelLinks.tmall
      : { ...product.channelLinks.tmall, enabled: false, url: null, verified: false },
    jd: product.channelLinks.jd.enabled && product.channelLinks.jd.verified
      ? product.channelLinks.jd
      : { ...product.channelLinks.jd, enabled: false, url: null, verified: false }
  };
}

function publicTags(product: CatalogProduct) {
  if (product.status === "upcoming") {
    return product.tags.slice(0, 3);
  }

  const blocked = /官方立减|已降|付款|销量|优惠|活动|天猫|京东|商品ID|审核|待补|同步|抓取/;
  return product.tags.filter((tag) => !blocked.test(tag)).slice(0, 2);
}

function publicSpecifications(product: CatalogProduct) {
  if (product.status === "upcoming") {
    return product.specifications.filter((spec) => !/价格|库存|销量|评价/.test(spec.label));
  }

  const allowed = /材质|尺寸|重量|颜色|包含|清洁|收纳|商品状态/;
  const blocked = /商品ID|官网分类|付款|价格|销量|库存|活动|优惠|天猫|京东|抓取|同步/;
  return product.specifications.filter((spec) => allowed.test(spec.label) && !blocked.test(spec.label));
}

function toPublicProduct(product: CatalogProduct): PublicCatalogProduct {
  const displayName = product.displayName || product.name;
  const isUpcoming = product.status === "upcoming";
  const useReviewedContent = product.contentStatus === "ready" && product.manualReviewed === true;
  const activeDescription = `${displayName}已确认官方渠道入口。具体规格、价格、库存、优惠和售后以官方旗舰店页面为准。`;
  const primaryCategoryId = product.primaryCategoryId || product.categoryId;

  return {
    id: product.id,
    slug: product.slug,
    displayName,
    shortName: product.shortName,
    categoryId: primaryCategoryId,
    primaryCategoryId,
    subcategoryId: product.subcategoryId ?? null,
    seriesId: product.seriesId,
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
          "官网仅保留购买前需要确认的基础信息，不展示动态价格、库存或活动标签。"
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
    seoTitle: isUpcoming ? product.seoTitle : `${displayName}｜蜜女郎官方在售商品`,
    seoDescription: isUpcoming ? product.seoDescription : activeDescription,
    seoKeywords: product.seoKeywords.filter((keyword) => !/^\d+$/.test(keyword)).slice(0, 6),
    updatedAt: product.updatedAt
  };
}

export const catalogProducts = baseCatalogProducts
  .map(applyOverrides)
  .sort((a, b) => a.sortOrder - b.sortOrder);

export { catalogCategories, catalogSeries };

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
