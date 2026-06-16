export type StoreChannel = "tmall" | "jd";

export type ProductStatus = "draft" | "upcoming" | "active" | "discontinued";

export type VerificationStatus = "verified" | "needs_review" | "unverified";

export type MatchStatus = "confirmed" | "probable" | "unmatched" | "needs_review";

export type PublishImageStatus = "ready" | "needs-design" | "missing" | "low-quality" | "needs-review";

export type PublishLinkStatus = "verified" | "partial" | "missing" | "needs-review";

export type PublishContentStatus = "ready" | "raw" | "needs-review";

export type VisualAssetStatus = "ready" | "generated" | "composited" | "pending" | "rejected";

export type ProductAssetWorkflowStatus = "ready" | "waiting_user_assets";

export type CategoryLevel = "primary" | "secondary" | "legacy";

export type CategoryReviewStatus = "confirmed" | "needs-review";

export type ProductImageSourceType = "user-original" | "official-store" | "generated" | "composited" | "unknown";

export type ProductImageReview = {
  sourceType: ProductImageSourceType;
  suitabilityScore: number;
  productAccuracyScore: number;
  brandFitScore: number;
  problems: string[];
  recommendedAction:
    | "use-directly"
    | "crop"
    | "remove-background"
    | "clean-promo-text"
    | "recompose"
    | "generate-background"
    | "generate-new-visual"
    | "request-original"
    | "reject";
};

export type ProductVisualAssets = {
  sourceWhiteBg?: string | null;
  sourceTransparent?: string | null;
  approvedCover?: string | null;
  approvedDetailHero?: string | null;
  materialCenterItemId?: string | null;
  materialCenterWhiteBgStatus?: string | null;
  materialCenterTransparentStatus?: string | null;
  imageReview?: ProductImageReview;
};

export type PublicCatalogProduct = {
  id: string;
  slug: string;
  displayName: string;
  shortName: string;
  categoryId: string;
  primaryCategoryId: string;
  subcategoryId: string | null;
  seriesId: string | null;
  publicTags: string[];
  status: ProductStatus;
  featured: boolean;
  sortOrder: number;
  launchDate: string | null;
  coverImage: string;
  gallery: string[];
  imageAlt: string;
  shortDescription: string;
  fullDescription: string;
  heroLine: string;
  highlights: string[];
  publicSpecifications: ProductSpecification[];
  careNotes: string[];
  privacyNotes: string[];
  channelLinks: Record<StoreChannel, CatalogChannelLink>;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  updatedAt: string;
};

export type CatalogCategory = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  level: CategoryLevel;
  parentId?: string | null;
  description: string;
  coverImage: string;
  sortOrder: number;
  visible: boolean;
  seoTitle: string;
  seoDescription: string;
};

export type CatalogSeries = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImage: string;
  sortOrder: number;
  visible: boolean;
};

export type CatalogSourceRecord = {
  platform: StoreChannel | "manual";
  storeUrl: string;
  productUrl: string | null;
  collectedAt: string;
  method: "public_page" | "manual_note" | "manual_override";
  note: string;
};

export type CatalogChannelLink = {
  enabled: boolean;
  url: string | null;
  label: string;
  verified: boolean;
  sourceUrl: string | null;
  lastCheckedAt: string | null;
};

export type ProductSpecification = {
  label: string;
  value: string;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  skuCode: string;
  sourceTitle?: string;
  displayName?: string;
  name: string;
  shortName: string;
  subtitle: string;
  categoryId: string;
  primaryCategoryId?: string | null;
  subcategoryId?: string | null;
  categoryReviewStatus?: CategoryReviewStatus;
  seriesId: string | null;
  tags: string[];
  status: ProductStatus;
  visible: boolean;
  featured: boolean;
  sortOrder: number;
  launchDate: string | null;
  coverImage: string;
  gallery: string[];
  imageAlt: string;
  imageTag: string;
  shortDescription: string;
  fullDescription: string;
  heroLine: string;
  bestFor: string[];
  highlights: string[];
  specifications: ProductSpecification[];
  careNotes: string[];
  privacyNotes: string[];
  channelLinks: Record<StoreChannel, CatalogChannelLink>;
  sourceRecords: CatalogSourceRecord[];
  verificationStatus: VerificationStatus;
  publishReady?: boolean;
  publishIssues?: string[];
  imageStatus?: PublishImageStatus;
  linkStatus?: PublishLinkStatus;
  contentStatus?: PublishContentStatus;
  visualAssetStatus?: VisualAssetStatus;
  manualReviewed?: boolean;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  assetWorkflowStatus?: ProductAssetWorkflowStatus;
  visualAssets?: ProductVisualAssets;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  createdAt: string;
  updatedAt: string;
};

export type ManualCatalogProductOverride = Partial<
  Omit<CatalogProduct, "id" | "slug" | "channelLinks">
> & {
  channelLinks?: Partial<Record<StoreChannel, Partial<CatalogChannelLink>>>;
};
