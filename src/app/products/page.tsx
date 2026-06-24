import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCatalogView } from "@/components/ProductCatalogView";
import { SectionHeader } from "@/components/SectionHeader";
import { StoreButtons } from "@/components/StoreButtons";
import { TrackView } from "@/components/TrackView";
import { getPublicCategoriesWithCmsFallback, getPublicProductsWithCmsFallback, getPublicSeriesWithCmsFallback } from "@/lib/cms/public-products";
import { withCanonical } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = withCanonical({
  title: "蜜女郎产品中心｜按材质、类型与系列了解官方商品",
  description: "在蜜女郎产品中心按材质、类型、系列与商品状态浏览产品，了解清洁保养、隐私购买与官方旗舰店购买入口。"
}, "/products");

export default async function ProductsPage() {
  const [publicProducts, categories, series] = await Promise.all([
    getPublicProductsWithCmsFallback(),
    getPublicCategoriesWithCmsFallback(),
    getPublicSeriesWithCmsFallback()
  ]);
  const primaryCategories = categories.filter((category) => category.visible && category.level === "primary");
  const subcategories = categories.filter((category) => category.visible && category.level === "secondary");
  const visibleSeries = series.filter((item) => item.visible);

  return (
    <main>
      <TrackView event="view_product_list" />
      <section className="container-shell py-12 md:py-16">
        <SectionHeader
          eyebrow="Product Center"
          title={"不是把商品推出，\n而是帮你先知道怎么选"}
          description="先了解材质、触感、清洁方式和官方购买渠道，再决定适合自己的系列。"
        />
        <Suspense fallback={<div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.045] p-6 text-aura/68">正在加载商品筛选...</div>}>
          <ProductCatalogView products={publicProducts} primaryCategories={primaryCategories} subcategories={subcategories} series={visibleSeries} />
        </Suspense>
      </section>

      <section className="bg-white/[0.025] py-12 md:py-16">
        <div className="container-shell">
          <SectionHeader eyebrow="Official Channels" title="购买前先确认商品状态" description="新品预告不展示购买按钮；已上架商品展示可前往官方渠道查看的入口。" />
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              ["即将上新", "原生肌凝硅三款目前为新品预告，暂不显示购买按钮。"],
              ["已上架", "已开放展示的商品会提供官方渠道入口，具体信息以旗舰店页面为准。"],
              ["信息边界", "官网不展示交易动态或平台活动标签。"],
              ["官方渠道", "官网用于种草和信任建立，最终在天猫旗舰店或京东旗舰店完成成交。"]
            ].map(([title, text]) => (
              <div key={title} className="rounded-[26px] border border-white/10 bg-white/[0.045] p-6">
                <h2 className="text-xl font-black text-white">{title}</h2>
                <p className="mt-3 text-sm leading-7 text-aura/68">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <StoreButtons source="products_page_official_channels" />
          </div>
        </div>
      </section>
    </main>
  );
}
