import type { MetadataRoute } from "next";
import { PRIMARY_SITE_URL } from "@/lib/constants";
import { getPublishedArticles } from "@/lib/articles";
import { getPublicCategoriesWithCmsFallback, getPublicProductsWithCmsFallback } from "@/lib/cms/public-products";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [publishedArticles, publicProducts, publicCategories] = await Promise.all([
    getPublishedArticles(),
    getPublicProductsWithCmsFallback(),
    getPublicCategoriesWithCmsFallback()
  ]);
  const staticRoutes = [
    "",
    "/brand",
    "/products",
    "/material",
    "/guide",
    "/privacy-shipping",
    "/faq",
    "/articles",
    "/contact",
    "/buy",
    "/privacy-policy",
    "/terms",
    "/disclaimer"
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${PRIMARY_SITE_URL}${route}`,
      lastModified: now,
      changeFrequency: (route === "" ? "weekly" : "monthly") as ChangeFrequency,
      priority: route === "" ? 1 : 0.7
    })),
    ...publicProducts.map((product) => ({
      url: `${PRIMARY_SITE_URL}/products/${product.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8
    })),
    ...publicCategories
      .filter((category) => category.visible && category.level !== "legacy")
      .filter((category) =>
        publicProducts.some((product) => product.primaryCategoryId === category.id || product.subcategoryId === category.id)
      )
      .map((category) => ({
        url: `${PRIMARY_SITE_URL}/products/category/${category.slug}`,
        lastModified: now,
        changeFrequency: "monthly" as const,
        priority: 0.62
      })),
    ...publishedArticles.map((article) => ({
      url: `${PRIMARY_SITE_URL}/articles/${article.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.65
    }))
  ];
}
