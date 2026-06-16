import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { catalogCategories, catalogSeries, catalogProducts } from "@/lib/catalog";
import { ProductEditorClient } from "./ProductEditorClient";

export const metadata: Metadata = {
  title: "本地商品录入工具",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

export default function ProductEditorPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="container-shell py-10 md:py-14">
      <div className="mb-7">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-mint-300">Internal Tool</p>
        <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">本地商品录入工具</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-aura/70">
          只在开发环境可用。填写后生成商品 JSON、TypeScript 数据和资料清单，不直接修改正式数据。
        </p>
      </div>
      <ProductEditorClient
        categories={catalogCategories.filter((item) => item.visible && item.level !== "legacy")}
        series={catalogSeries.filter((item) => item.visible)}
        existingProducts={catalogProducts.map((item) => ({ id: item.id, slug: item.slug }))}
      />
    </main>
  );
}
