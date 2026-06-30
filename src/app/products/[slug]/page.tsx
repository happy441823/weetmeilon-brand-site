import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ImageFrame } from "@/components/ImageFrame";
import { ProductChannelButtons } from "@/components/ProductChannelButtons";
import { SectionHeader } from "@/components/SectionHeader";
import { TrackView } from "@/components/TrackView";
import { getPublishedArticles, type Article } from "@/lib/articles";
import { getPublicProductBySlugWithCmsFallback, getPublicSeriesWithCmsFallback } from "@/lib/cms/public-products";
import {
  getPublicCatalogProducts
} from "@/lib/catalog";
import { publicProductSeoDescription } from "@/lib/public-seo-copy";
import { canonicalPath } from "@/lib/seo";
import type { PublicCatalogProduct } from "@/types/catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

const coreArticleSlugs = [
  "official-site-to-tmall",
  "beginner-buying-questions",
  "product-info-before-buying",
  "cleaning-and-storage-guide",
  "privacy-shipping-guide",
  "tpe-vs-silicone-material-guide",
  "material-photo-checklist",
  "mold-products-care-guide",
  "how-to-choose-cup-products",
  "weekly-care-routine"
];

function getRelatedArticleSlugs(product: PublicCatalogProduct, seriesName: string) {
  const context = [
    product.slug,
    product.displayName,
    product.shortName,
    product.primaryCategoryId,
    product.subcategoryId || "",
    product.seriesId || "",
    seriesName,
    product.heroLine,
    ...product.publicTags
  ]
    .join(" ")
    .toLowerCase();
  const slugs = new Set<string>();

  if (product.primaryCategoryId === "masturbator-cups" || context.includes("cup") || context.includes("飞机杯")) {
    slugs.add("how-to-choose-cup-products");
    slugs.add("beginner-buying-questions");
    slugs.add("cleaning-and-storage-guide");
  }

  if (
    product.primaryCategoryId === "intimate-molds" ||
    context.includes("mold") ||
    context.includes("hip") ||
    context.includes("half-body") ||
    context.includes("leg") ||
    context.includes("倒模") ||
    context.includes("臀") ||
    context.includes("半身") ||
    context.includes("腿")
  ) {
    slugs.add("mold-products-care-guide");
    slugs.add("material-photo-checklist");
    slugs.add("weekly-care-routine");
  }

  if (context.includes("tpe") || context.includes("silicone") || context.includes("硅胶")) {
    slugs.add("tpe-vs-silicone-material-guide");
    slugs.add("material-photo-checklist");
  }

  slugs.add("official-site-to-tmall");
  slugs.add("beginner-buying-questions");
  slugs.add("product-info-before-buying");
  slugs.add("cleaning-and-storage-guide");
  slugs.add("privacy-shipping-guide");

  for (const slug of coreArticleSlugs) {
    slugs.add(slug);
  }

  return [...slugs].slice(0, 4);
}

function getProductRelatedArticles(articles: Article[], product: PublicCatalogProduct, seriesName: string) {
  const articlesBySlug = new Map(articles.map((article) => [article.slug, article]));
  return getRelatedArticleSlugs(product, seriesName)
    .map((slug) => articlesBySlug.get(slug))
    .filter((article): article is Article => Boolean(article));
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export function generateStaticParams() {
  return getPublicCatalogProducts().map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProductBySlugWithCmsFallback(slug);

  if (!product) {
    return {};
  }

  const title = product.status === "upcoming" ? `${product.displayName}｜新品预告` : product.seoTitle;
  const description = publicProductSeoDescription({ displayName: product.displayName, status: product.status });

  return {
    title,
    description,
    keywords: product.seoKeywords,
    alternates: {
      canonical: canonicalPath(`/products/${product.slug}`)
    }
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getPublicProductBySlugWithCmsFallback(slug);

  if (!product) {
    notFound();
  }

  const isUpcoming = product.status === "upcoming";
  const [series, articles] = await Promise.all([getPublicSeriesWithCmsFallback(), getPublishedArticles()]);
  const seriesName = series.find((item) => item.id === product.seriesId)?.name || "蜜女郎精选";
  const relatedArticles = getProductRelatedArticles(articles, product, seriesName);
  const safeDescription = publicProductSeoDescription({ displayName: product.displayName, status: product.status });
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.displayName,
    description: safeDescription,
    image: product.coverImage,
    brand: {
      "@type": "Brand",
      name: "蜜女郎 SWEETMEILON"
    },
    category: seriesName,
    url: canonicalPath(`/products/${product.slug}`)
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <TrackView
        event={isUpcoming ? "view_upcoming_product" : "view_product"}
        params={{ product_slug: product.slug, product_name: product.displayName, product_status: product.status }}
      />
      <section className="container-shell grid gap-8 py-14 md:py-20 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.055] shadow-purple">
          <ImageFrame src={product.coverImage} alt={product.imageAlt} sizes="(min-width: 1024px) 45vw, 92vw" className="aspect-square" imageClassName="p-0" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-mint-300">{seriesName}</p>
          <div className="mt-4 inline-flex rounded-full border border-mint-300/24 bg-mint-300/10 px-3 py-1 text-xs font-black text-mint-300">
            {isUpcoming ? "即将上新" : "已上架"}
          </div>
          <h1 className="mt-4 text-balance text-4xl font-black tracking-tight text-white md:text-6xl">{product.displayName}</h1>
          <p className="mt-5 text-lg leading-9 text-aura/72">{product.heroLine}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {product.publicTags.map((tag) => (
              <span key={tag} className="rounded-full border border-mint-300/25 bg-mint-300/8 px-3 py-1 text-xs font-bold text-mint-300">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-8">
            {isUpcoming ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/material"
                  className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-mint-gradient px-5 py-3 text-sm font-black text-plum-950 shadow-glow transition hover:-translate-y-0.5"
                >
                  了解原生肌凝硅
                </Link>
                <Link
                  href="/products?status=upcoming"
                  className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full border border-white/14 px-5 py-3 text-sm font-black text-white transition hover:bg-white/8"
                >
                  查看新品预告
                </Link>
              </div>
            ) : (
              <ProductChannelButtons product={product} source="product_detail_hero" />
            )}
          </div>
          <p className="mt-4 text-xs leading-6 text-aura/50">
            {isUpcoming
              ? "本页面为新品预告，暂不展示购买按钮。正式商品信息以上架后的蜜女郎官方旗舰店页面为准。"
              : "实际规格、发货规则与售后信息，以天猫或京东官方旗舰店页面为准。"}
          </p>
        </div>
      </section>

      <section className="bg-white/[0.035] py-14 md:py-20">
        <div className="container-shell grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <SectionHeader
            eyebrow="Highlights"
            title={isUpcoming ? "新品预告先看这几个点" : "购买前先看这几个点"}
            description={isUpcoming ? "先了解材质体验方向，具体商品信息以上架后的官方旗舰店页面为准。" : "先了解材质、触感、清洁方式和官方渠道，再进入旗舰店确认具体规格。"}
          />
          <div className="grid gap-4">
            {product.highlights.map((item) => (
              <div key={item} className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 text-sm leading-7 text-aura/68">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-14 md:py-20">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black text-white">基础信息</h2>
            <div className="mt-5 grid gap-3">
              {product.publicSpecifications.map((spec) => (
                <div key={spec.label} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                  <span className="text-sm text-aura/55">{spec.label}</span>
                  <span className="text-right text-sm font-bold text-white">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">清洁与收纳</h2>
            <ul className="mt-5 grid gap-3">
              {product.careNotes.map((item) => (
                <li key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm leading-7 text-aura/66">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {relatedArticles.length > 0 ? (
        <section className="bg-white/[0.03] py-14 md:py-20">
          <div className="container-shell">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <SectionHeader
                eyebrow="Related Guides"
                title="购买前可以先看这几篇"
                description="从材质区别、清洁收纳、隐私发货和日常保养几个角度，补充商品页之外的参考信息。"
              />
              <Link
                href="/articles"
                className="focus-ring inline-flex items-center gap-1 rounded-full border border-white/12 px-4 py-3 text-sm font-bold text-aura/80 transition hover:bg-white/8 hover:text-white"
              >
                查看全部文章
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {relatedArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="rounded-[26px] border border-white/10 bg-plum-950/48 p-5 transition hover:-translate-y-1 hover:border-mint-300/34"
                >
                  <p className="text-xs font-black text-mint-300">{article.category}</p>
                  <h3 className="mt-3 text-xl font-black leading-snug text-white">{article.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-aura/62">{article.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-shell pb-16">
        <div className="rounded-[34px] border border-mint-300/22 bg-hero-radial p-6 md:p-10">
          <h2 className="text-3xl font-black text-white">{isUpcoming ? "正式上架前，先了解材质概念" : "确认同款信息，请前往官方旗舰店"}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-aura/68">
            {isUpcoming
              ? "本页为新品预告页面，暂不展示购买按钮。正式商品信息、发货与售后说明，请以上架后的蜜女郎官方旗舰店页面为准。"
              : "具体商品标题、规格、发货与售后信息，以天猫或京东官方旗舰店页面为准。"}
          </p>
          <div className="mt-7">
            {isUpcoming ? (
              <Link
                href="/material"
                className="focus-ring inline-flex min-h-12 items-center justify-center rounded-full bg-mint-gradient px-5 py-3 text-sm font-black text-plum-950 shadow-glow transition hover:-translate-y-0.5"
              >
                了解原生肌凝硅
              </Link>
            ) : (
              <ProductChannelButtons product={product} source="product_detail_final" />
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
