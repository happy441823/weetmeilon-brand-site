import type { Metadata } from "next";
import { ProductAdminClient } from "./ProductAdminClient";
import { getPrimaryCategories, getSubcategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "本地商品后台",
  description: "本地上传产品主图、选择类目并录入商品链接。"
};

export default function AdminProductsPage() {
  const primaryCategories = getPrimaryCategories();
  const subcategories = getSubcategories();

  return (
    <main className="container-shell py-10 md:py-14">
      <section className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-mint-300">Local Admin</p>
        <h1 className="mt-3 text-3xl font-black leading-tight text-white md:text-5xl">商品主图与链接录入后台</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/68">
          先把产品主图、类目、商品链接保存到待检查列表。我检查通过后，再合并到官网正式商品中心。
        </p>
      </section>
      <ProductAdminClient primaryCategories={primaryCategories} subcategories={subcategories} />
    </main>
  );
}
