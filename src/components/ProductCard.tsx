import Link from "next/link";
import Image from "next/image";
import { ImageFrame } from "@/components/ImageFrame";
import { ProductChannelButtons } from "@/components/ProductChannelButtons";
import { getSeriesById } from "@/lib/catalog";
import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  compact?: boolean;
};

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const isUpcoming = product.status === "upcoming";
  const seriesName = getSeriesById(product.seriesId)?.name || "蜜女郎精选";
  const productName = product.displayName;
  const isConceptPlaceholder = product.coverImage.startsWith("/images/products/product-");

  if (isUpcoming) {
    return (
      <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_80px_rgba(24,0,45,0.28)]">
        <header className="relative z-20 flex min-h-[64px] flex-wrap items-center gap-2 px-5 pb-3 pt-5 sm:min-h-[68px] sm:px-6">
          <span className="inline-flex h-9 items-center rounded-full border border-mint-300/60 bg-[#160722]/85 px-4 text-sm font-bold text-mint-300 backdrop-blur-md">
            即将上新
          </span>
          <span className="inline-flex h-8 items-center rounded-full border border-white/15 bg-white/[0.05] px-3 text-xs font-bold text-white/75">
            {seriesName}
          </span>
        </header>

        <div className="px-4 sm:px-5">
          <Link href={`/products/${product.slug}`} className="block">
            <div className="relative isolate aspect-[4/3] overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_76%_24%,rgba(103,255,225,0.16),transparent_28%),radial-gradient(circle_at_24%_78%,rgba(142,92,255,0.24),transparent_34%),linear-gradient(145deg,rgba(23,5,36,0)_0%,rgba(37,16,59,0.72)_52%,rgba(16,30,49,0)_100%)]"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-10 bottom-6 z-0 h-16 rounded-full bg-mint-300/10 blur-2xl"
              />
              {isConceptPlaceholder ? (
                <div aria-hidden="true" className="absolute inset-0 z-10 transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02] motion-reduce:group-hover:scale-100">
                  <div className="absolute left-[20%] top-[22%] h-[32%] w-[32%] rounded-full border border-mint-300/14" />
                  <div className="absolute left-[32%] top-[22%] h-[32%] w-[32%] rounded-full border border-mint-300/18" />
                  <div className="absolute left-[44%] top-[22%] h-[32%] w-[32%] rounded-full border border-mint-300/18" />
                  <div className="absolute left-[56%] top-[22%] h-[32%] w-[32%] rounded-full border border-mint-300/16" />
                  <div className="absolute bottom-[24%] left-[22%] h-4 w-[34%] rounded-full bg-white/8 blur-[1px]" />
                  <div className="absolute bottom-[21%] left-[31%] h-4 w-[34%] rounded-full bg-white/8 blur-[1px]" />
                  <div className="absolute bottom-[18%] left-[40%] h-4 w-[34%] rounded-full bg-white/8 blur-[1px]" />
                  <div className="absolute bottom-[15%] left-[49%] h-4 w-[34%] rounded-full bg-white/8 blur-[1px]" />
                  <div className="absolute left-[10%] top-[12%] h-4 w-24 rounded-full border border-mint-300/10" />
                </div>
              ) : (
                <Image
                  src={product.coverImage}
                  alt={product.imageAlt || `${productName}新品概念视觉`}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="relative z-10 object-contain transition-transform duration-300 motion-reduce:transition-none group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
                />
              )}
            </div>
          </Link>
        </div>

        <div className="relative z-20 flex flex-1 flex-col px-5 pb-6 pt-5 sm:px-6">
          <div className="mb-2 text-sm font-bold tracking-[0.12em] text-mint-300">{seriesName}</div>
          <h3 className="line-clamp-2 text-2xl font-extrabold leading-tight text-white">{productName}</h3>
          <p className="mt-4 line-clamp-3 text-base leading-8 text-white/68">{product.shortDescription}</p>
          <div className="mt-auto space-y-3 pt-6">
            <Link
              href={`/products/${product.slug}`}
              className="focus-ring flex min-h-12 w-full items-center justify-center rounded-full border border-white/60 px-5 font-bold text-white transition hover:border-mint-300 hover:text-mint-300"
            >
              查看新品详情
            </Link>
            <Link
              href="/material"
              className="focus-ring flex min-h-12 w-full items-center justify-center rounded-full bg-mint-gradient px-5 font-extrabold text-[#15051f] shadow-[0_14px_34px_rgba(100,242,220,0.16)] transition hover:shadow-[0_18px_40px_rgba(100,242,220,0.22)] motion-reduce:transition-none"
            >
              了解原生肌凝硅
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.055] shadow-purple">
      <div className="p-3 pb-0">
        <div className="mb-3 flex min-h-9 flex-wrap items-center gap-2 px-1">
          {isUpcoming ? (
            <span className="rounded-full border border-mint-300/28 bg-ink/72 px-3 py-1 text-xs font-black text-mint-300">
              即将上新
            </span>
          ) : null}
          {product.publicTags.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded-full border border-mint-300/28 bg-ink/68 px-3 py-1 text-xs font-bold text-mint-300">
              {tag}
            </span>
          ))}
        </div>
        <Link href={`/products/${product.slug}`} className="block">
          <ImageFrame
            src={product.coverImage}
            alt={`${productName}产品主视觉`}
            sizes="(min-width: 1024px) 31vw, (min-width: 768px) 45vw, 92vw"
            className="aspect-square rounded-[22px] border border-white/10"
            imageClassName="p-0 group-hover:scale-[1.03]"
            fit="cover"
          />
        </Link>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-mint-300">{seriesName}</p>
        <h3 className="mt-2 line-clamp-2 text-xl font-black text-white">{productName}</h3>
        <p className="mt-3 text-sm leading-7 text-aura/72">{product.shortDescription}</p>
        <div className="mt-auto grid gap-3 pt-5">
          <Link
            href={`/products/${product.slug}`}
            className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/14 px-4 py-3 text-sm font-bold text-aura/86 transition hover:bg-white/8 hover:text-white"
          >
            {isUpcoming ? "查看新品详情" : "查看详情"}
          </Link>
          {isUpcoming ? (
            <Link
              href="/material"
              className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-full bg-mint-gradient px-4 py-3 text-sm font-black text-plum-950 shadow-glow transition hover:-translate-y-0.5"
            >
              了解原生肌凝硅
            </Link>
          ) : (
            <ProductChannelButtons product={product} source="product_card" buttonClassName="w-full px-3 text-[13px] md:text-sm" />
          )}
        </div>
      </div>
    </article>
  );
}
