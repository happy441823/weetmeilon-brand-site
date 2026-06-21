import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { catalogCategories, getCategoryBySlug, getPublicCatalogProducts, getProductsByCategory } from "@/lib/catalog";
import { getPublicCategoriesWithCmsFallback, getPublicProductsWithCmsFallback } from "@/lib/cms/public-products";
import { canonicalPath } from "@/lib/seo";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const categories = await getPublicCategoriesWithCmsFallback();
  const category = categories.find((item) => item.slug === slug) || getCategoryBySlug(slug);

  if (!category) {
    return {};
  }

  if (!category.visible || category.level === "legacy") {
    return {
      title: category.seoTitle,
      description: category.seoDescription,
      robots: {
        index: false,
        follow: false
      }
    };
  }

  return {
    title: {
      absolute: category.seoTitle
    },
    description: category.seoDescription,
    alternates: {
      canonical: canonicalPath(`/products/category/${category.slug}`)
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const [categories, publicProducts] = await Promise.all([
    getPublicCategoriesWithCmsFallback(),
    getPublicProductsWithCmsFallback()
  ]);
  const category = categories.find((item) => item.slug === slug) || getCategoryBySlug(slug);

  if (!category || !category.visible || category.level === "legacy") {
    notFound();
  }

  const products =
    publicProducts.length > 0
      ? publicProducts.filter((product) => product.primaryCategoryId === category.id || product.subcategoryId === category.id)
      : getProductsByCategory(category.id);

  return (
    <main>
      <section className="container-shell py-12 md:py-16">
        <SectionHeader eyebrow="Category" title={category.name} description={category.description} />
        {products.length > 0 ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-aura/72">
            当前分类暂无已上架商品，请先返回产品中心查看其他分类。新品上架后会自动出现在这里。
          </div>
        )}
      </section>

      <section className="bg-white/[0.025] py-12 md:py-16">
        <div className="container-shell">
          <SectionHeader
            eyebrow="Official Channels"
            title="查看具体商品，请以官方旗舰店页面为准"
            description="具体规格、发货、售后与商品详情，以天猫官方旗舰店或京东官方旗舰店页面展示为准。"
          />
          <div className="mt-7">
            <StoreButtons source="category_page" />
          </div>
        </div>
      </section>
    </main>
  );
}
