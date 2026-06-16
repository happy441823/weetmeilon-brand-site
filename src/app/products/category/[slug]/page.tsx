import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import {
  getCategoryBySlug,
  getPublicCatalogProducts,
  getProductsByCategory
} from "@/lib/catalog";
import { catalogCategories } from "@/lib/catalog";
import { canonicalPath } from "@/lib/seo";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  const publicProducts = getPublicCatalogProducts();

  return catalogCategories
    .filter((category) => category.visible && category.level !== "legacy")
    .filter((category) =>
      publicProducts.some((product) => product.primaryCategoryId === category.id || product.subcategoryId === category.id)
    )
    .map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category) {
    return {};
  }

  return {
    title: category.seoTitle,
    description: category.seoDescription,
    alternates: {
      canonical: canonicalPath(`/products/category/${category.slug}`)
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category || !category.visible || category.level === "legacy") {
    notFound();
  }

  const products = getProductsByCategory(category.id);

  if (products.length === 0) {
    notFound();
  }

  return (
    <main>
      <section className="container-shell py-12 md:py-16">
        <SectionHeader eyebrow="Category" title={category.name} description={category.description} />
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      </section>

      <section className="bg-white/[0.025] py-12 md:py-16">
        <div className="container-shell">
          <SectionHeader
            eyebrow="Official Channels"
            title="查看具体商品，请以官方旗舰店页面为准"
            description="优惠、库存、物流、售后和具体产品详情，以天猫旗舰店或京东旗舰店页面展示为准。"
          />
          <div className="mt-7">
            <StoreButtons source="category_page" />
          </div>
        </div>
      </section>
    </main>
  );
}
