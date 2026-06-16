"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard";
import type { CatalogCategory, CatalogSeries, ProductStatus, PublicCatalogProduct } from "@/types/catalog";
import { trackEvent } from "@/lib/analytics";

type ProductCatalogViewProps = {
  products: PublicCatalogProduct[];
  primaryCategories: CatalogCategory[];
  subcategories: CatalogCategory[];
  series: CatalogSeries[];
};

const statusOptions: { label: string; value: "all" | ProductStatus }[] = [
  { label: "已上架", value: "active" },
  { label: "即将上新", value: "upcoming" },
  { label: "全部", value: "all" }
];

const pageSize = 12;

export function ProductCatalogView({ products, primaryCategories, subcategories, series }: ProductCatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resultSummaryRef = useRef<HTMLDivElement>(null);

  const status = searchParams.get("status") || "active";
  const category = searchParams.get("category") || "all";
  const subcategory = searchParams.get("subcategory") || "all";
  const seriesId = searchParams.get("series") || "all";
  const query = searchParams.get("q") || "";
  const [searchInput, setSearchInput] = useState(query);
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchInput === query) {
        return;
      }
      setParam("q", searchInput);
      if (searchInput.trim()) {
        trackEvent("search_product", { keyword: searchInput });
      }
    }, 360);

    return () => window.clearTimeout(timer);
  }, [searchInput, query]);

  function setParam(key: string, value: string, resetPage = true) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all" || value.trim() === "" || (key === "status" && value === "active")) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (resetPage) {
      params.delete("page");
    }

    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  function setCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all" || value.trim() === "") {
      params.delete("category");
    } else {
      params.set("category", value);
    }
    params.delete("subcategory");
    params.delete("page");

    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  }

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesStatus = status === "all" || product.status === status;
      const matchesCategory = category === "all" || product.primaryCategoryId === category;
      const matchesSubcategory = subcategory === "all" || product.subcategoryId === subcategory;
      const matchesSeries = seriesId === "all" || product.seriesId === seriesId;
      const searchable = [
        product.displayName,
        product.shortName,
        product.shortDescription,
        product.heroLine,
        ...product.publicTags
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !q || searchable.includes(q);
      return matchesStatus && matchesCategory && matchesSubcategory && matchesSeries && matchesQuery;
    });
  }, [category, products, query, seriesId, status, subcategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleProducts = filteredProducts.slice((safePage - 1) * pageSize, safePage * pageSize);

  function setPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
    window.setTimeout(() => {
      resultSummaryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      resultSummaryRef.current?.focus();
    }, 80);
  }

  return (
    <div className="mt-8">
      <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-mint-300">Search</span>
            <input
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
              }}
              className="focus-ring h-12 rounded-full border border-white/12 bg-ink/60 px-4 text-sm text-white outline-none placeholder:text-aura/38"
              placeholder="搜索半身、原生肌凝硅、清洁..."
            />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-mint-300">Category</span>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                trackEvent("filter_product_category", { category: event.target.value });
              }}
              className="focus-ring h-12 rounded-full border border-white/12 bg-ink/60 px-4 text-sm text-white outline-none"
            >
              <option value="all">全部分类</option>
              {primaryCategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.shortName}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-mint-300">Subcategory</span>
            <select
              value={subcategory}
              onChange={(event) => {
                setParam("subcategory", event.target.value);
                trackEvent("filter_product_subcategory", { subcategory: event.target.value });
              }}
              className="focus-ring h-12 rounded-full border border-white/12 bg-ink/60 px-4 text-sm text-white outline-none"
            >
              <option value="all">全部小类</option>
              {subcategories
                .filter((item) => category === "all" || item.parentId === category)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase tracking-[0.18em] text-mint-300">Series</span>
            <select
              value={seriesId}
              onChange={(event) => {
                setParam("series", event.target.value);
                trackEvent("filter_product_series", { series: event.target.value });
              }}
              className="focus-ring h-12 rounded-full border border-white/12 bg-ink/60 px-4 text-sm text-white outline-none"
            >
              <option value="all">全部系列</option>
              {series.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {statusOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                setParam("status", item.value);
                trackEvent("filter_product_status", { status: item.value });
              }}
              className={`focus-ring shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                status === item.value || (status === "active" && item.value === "active")
                  ? "bg-mint-gradient text-plum-950"
                  : "border border-white/12 text-aura/72 hover:bg-white/8 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={resultSummaryRef}
        tabIndex={-1}
        className="mt-5 flex scroll-mt-24 items-center justify-between gap-4 text-sm text-aura/60 outline-none"
      >
        <span>共找到 {filteredProducts.length} 款产品，第 {safePage} / {totalPages} 页</span>
        <Link href="/products?status=active" className="font-bold text-mint-300 hover:text-white">
          只看已上架
        </Link>
      </div>

      {filteredProducts.length > 0 ? (
        <>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
          {totalPages > 1 ? (
            <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="产品分页">
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setPage(safePage - 1)}
                className="focus-ring min-h-11 rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-aura/76 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={`focus-ring flex h-11 w-11 items-center justify-center rounded-full text-sm font-black transition ${
                    safePage === item
                      ? "bg-mint-gradient text-plum-950"
                      : "border border-white/12 text-aura/72 hover:bg-white/8 hover:text-white"
                  }`}
                  aria-current={safePage === item ? "page" : undefined}
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setPage(safePage + 1)}
                className="focus-ring min-h-11 rounded-full border border-white/12 px-4 py-2 text-sm font-bold text-aura/76 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-40"
              >
                下一页
              </button>
            </nav>
          ) : null}
        </>
      ) : (
        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.045] p-7 text-center">
          <h2 className="text-xl font-black text-white">当前没有符合条件的公开商品</h2>
          <p className="mt-3 text-sm leading-7 text-aura/64">
            当前筛选条件下暂无可展示商品。可以切换到新品预告，或稍后查看已开放展示的产品。
          </p>
        </div>
      )}
    </div>
  );
}
